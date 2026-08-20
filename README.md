# StageOne — Ticket Booking System

## 1. Project Overview

StageOne is a full-stack ticket booking platform for movies and concerts. It supports three roles:

- Customer
- Organiser
- Admin

The system is designed around the key booking challenges in high-demand events: temporary seat holds, automatic hold expiry, real-time seat availability, concurrency protection, waitlists, cancellation-based seat reallocation, QR-code tickets, and email notifications.

## 2. Core Features

### Customer
- Register and log in
- Browse events
- Select an event and view its visual seat map
- See seat states such as available, held, and booked
- Hold seats temporarily during checkout
- Complete a booking
- View booking history
- Cancel bookings
- Join a category-specific waitlist for sold-out events
- Receive booking/waitlist notifications

### Organiser
- Register through the organiser registration page
- Wait for administrator approval
- Log in only after approval
- Create and manage event listings
- Select venue, date, time, and category-wise pricing
- View event-specific analytics
- View bookings, confirmed bookings, cancellations, customers, and revenue for their own events

### Admin
- Secure admin dashboard
- View real database statistics
- Approve/reject organiser applications
- Manage venues
- View platform analytics
- Monitor users, events, venues, bookings, and confirmed revenue

## 3. Technology Stack

### Frontend
- React
- React Router
- Tailwind CSS
- Axios
- Lucide React
- React Hot Toast
- Socket.IO client

### Backend
- Node.js
- Express
- Prisma ORM
- JWT authentication
- bcryptjs
- Socket.IO
- Morgan
- CORS

### Database
- SQLite through Prisma

## 4. Application Architecture

```text
React Frontend
      |
      | REST API / Socket.IO
      v
Express Backend
      |
      +---- Authentication
      +---- Events
      +---- Venues
      +---- Seats
      +---- Bookings
      +---- Waitlist
      +---- Admin
      |
      v
Prisma ORM
      |
      v
SQLite Database
```

## 5. Role-Based Access

| Role | Main Access |
|---|---|
| CUSTOMER | Dashboard, events, seat map, bookings, waitlist |
| ORGANISER | Event management and own analytics |
| ADMIN | Dashboard, organiser approvals, venues, platform analytics |

Organiser registration uses an approval workflow:

```text
Organizer Registration
        |
        v
approvalStatus = PENDING
        |
        v
Admin reviews application
      /        Approve  Reject
      |       |
      v       v
 APPROVED   REJECTED
      |
      v
Organizer can log in
```

## 6. Seat Booking Flow

```text
Customer selects event
        |
        v
Visual seat map
        |
        v
Select available seats
        |
        v
Temporary seat hold
        |
        +----------------------+
        |                      |
        v                      v
Checkout completed        Checkout abandoned
        |                      |
        v                      v
Confirmed booking        Hold expires
        |                      |
        v                      v
QR ticket/email          Seat becomes AVAILABLE
```

A seat is represented for a specific event/show using `ShowSeat`. This allows the same physical venue seat to have an independent status for each event.

## 7. Seat Hold TTL

When a customer starts checkout, selected seats are placed into a temporary held state.

Important fields:

- `status`
- `heldById`
- `holdExpiresAt`

The expiry job periodically checks expired holds and releases them.

Expected lifecycle:

```text
AVAILABLE
   |
   | customer selects
   v
HELD
   |
   +---- checkout succeeds ----> BOOKED
   |
   +---- TTL expires ----------> AVAILABLE
```

The TTL must be configured through the application's hold-expiry configuration/job.

## 8. Concurrency Protection

The system must ensure that two customers cannot successfully hold or book the same seat simultaneously.

The important database constraint is:

```text
@@unique([eventId, seatId])
```

on `ShowSeat`.

The booking/hold operation must also perform an atomic availability check/update or transaction so that a stale client cannot reserve an already-held/booked seat.

Recommended verification:

1. Open the same event in two browser sessions.
2. Select the same seat at nearly the same time.
3. Confirm that only one session obtains the hold.
4. Confirm that the second session receives an unavailable-seat response.
5. Confirm that the database contains only one active hold/booking for that event seat.

## 9. Waitlist Flow

Waitlists are category-specific.

```text
Event sold out for category
          |
          v
Customer joins waitlist
          |
          v
Position assigned
          |
          v
Booking is cancelled
          |
          v
Next eligible customer selected
          |
          v
Time-limited offer created
          |
          v
Customer receives notification/link
       /              completes        expires
    |                 |
    v                 v
 booking         next customer
```

The `Waitlist` model stores:

- event
- category
- user
- status
- position
- offered seat
- offer expiry
- offer token
- creation time

## 10. Database Model Summary

### User
Stores customer, organiser, and admin accounts.

Important fields:
- id
- name
- email
- password
- role
- approvalStatus
- createdAt

### Venue
Stores venue information and its relationship to the administrator.

### SeatCategory
Stores categories such as Premium and Standard.

### Seat
Stores physical venue seats.

### Event
Stores movie/event information and links the event to its organiser and venue.

### EventCategoryPrice
Stores category-specific pricing for an event.

### ShowSeat
Creates the event-specific seat state.

### Booking
Stores booking reference, customer, event, status, total amount, QR data, and timestamps.

### BookingSeat
Connects a booking to the selected show seats.

### Waitlist
Stores category-specific queue information and temporary seat offers.

## 11. Important Data Relationships

```text
User
 ├── Events (as organiser)
 ├── Bookings
 ├── Waitlist entries
 └── Held seats

Venue
 ├── Seat Categories
 ├── Seats
 └── Events

Event
 ├── Venue
 ├── Organiser
 ├── Category Prices
 ├── Show Seats
 ├── Bookings
 └── Waitlist

Booking
 └── Booking Seats

ShowSeat
 └── Booking Seats
```

## 12. Authentication

Authentication uses:

- bcryptjs for password hashing
- JWT for authenticated sessions
- middleware for protected API endpoints
- role checks for admin/organiser/customer operations

Passwords must never be stored in plain text.

## 13. QR Ticket

A confirmed booking contains QR-related booking data. The QR payload should encode the unique booking reference so that the ticket can be identified from the generated QR code.

The complete production verification should confirm:

1. Booking succeeds.
2. QR data is generated.
3. QR image is generated.
4. Email is sent.
5. Email contains the QR ticket.
6. QR decodes to the booking reference.

## 14. Real-Time Seat Updates

Socket.IO is used to support real-time seat status updates.

Expected behaviour:

```text
Customer A holds seat
       |
       v
Backend updates ShowSeat
       |
       v
Socket event emitted
       |
       v
Customer B's seat map updates
```

This avoids requiring customers to manually refresh the page to see seat changes.

## 15. Analytics

### Admin Analytics
Platform-wide:
- total users
- total events
- total bookings
- confirmed bookings
- cancelled bookings
- confirmed revenue

### Organiser Analytics
Restricted to the logged-in organiser:
- own events
- bookings for own events
- confirmed bookings
- cancelled bookings
- unique customers
- revenue
- monthly performance
- event-level performance

Organisers must never receive another organiser's booking or revenue data.

## 16. Main API Groups

```text
/api/auth
/api/venues
/api/events
/api/seats
/api/bookings
/api/waitlist
/api/admin
```

Admin endpoints include:

```text
GET   /api/admin/dashboard/stats
GET   /api/admin/analytics
GET   /api/admin/organizers/pending
PATCH /api/admin/organizers/:id/approve
PATCH /api/admin/organizers/:id/reject
```

## 17. Local Setup

### Prerequisites
- Node.js
- npm
- SQLite
- Git (recommended)

### Backend

```bash
cd backend
npm install
```

Create `.env` from `.env.example`.

Then:

```bash
npx prisma generate
npx prisma migrate dev
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend API base URL must point to the backend server.

## 18. Environment Variables

See `.env.example`.

Do not commit real secrets, email credentials, JWT secrets, or production database credentials.

## 19. Testing Checklist

### Authentication
- [ ] Customer registration
- [ ] Customer login
- [ ] Organiser registration
- [ ] Admin approval
- [ ] Approved organiser login
- [ ] Rejected organiser cannot log in
- [ ] Admin route protection
- [ ] Organiser route protection
- [ ] Customer route protection

### Seat Booking
- [ ] Event browsing
- [ ] Visual seat map
- [ ] Seat hold
- [ ] Hold TTL
- [ ] Automatic hold release
- [ ] Real-time seat updates
- [ ] Same-seat concurrency test
- [ ] Successful booking
- [ ] Booking history
- [ ] Cancellation

### Waitlist
- [ ] Join waitlist
- [ ] Category-specific queue
- [ ] Cancellation triggers offer
- [ ] Offer has expiry
- [ ] Successful offer booking
- [ ] Expired offer advances to next customer

### Ticket
- [ ] QR generated
- [ ] QR contains booking reference
- [ ] Email sent
- [ ] QR attachment/display verified

### Organiser
- [ ] Create event
- [ ] Category pricing
- [ ] Own booking summary
- [ ] Own revenue
- [ ] Own analytics only

### Admin
- [ ] Dashboard
- [ ] Real database statistics
- [ ] Pending organisers
- [ ] Approve
- [ ] Reject
- [ ] Venues
- [ ] Analytics

## 20. Submission Deliverables

Before submission, include:

```text
ticket-booking-system/
├── frontend/
├── backend/
├── README.md
├── SYSTEM_DESIGN.md
├── API_DOCUMENTATION.md
├── .env.example
└── screenshots/
```

Also provide:
- Complete ZIP source code
- Hosted application URL
- README
- API documentation
- Database/schema explanation
- Seat hold/TTL explanation
- Concurrency explanation
- Waitlist explanation
- System design write-up (maximum 800 words)

## 21. Important Submission Note

The high-priority evaluation areas are:

1. Seat hold TTL and automatic release
2. Concurrency protection
3. Waitlist automatic assignment and time-limited offers
4. Seat map data model and real-time updates
5. QR generation and email delivery
6. API design, code structure, and documentation

These should be demonstrated with screenshots or a short test video where possible.
