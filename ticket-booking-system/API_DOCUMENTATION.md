# StageOne — API Documentation

Base URL:

```text
http://localhost:<PORT>/api
```

Authentication uses a JWT token. Protected requests should send:

```text
Authorization: Bearer <JWT_TOKEN>
```

## Authentication

### POST `/auth/register`

Registers a customer or organiser.

Example:

```json
{
  "name": "Subathra",
  "email": "subathra@example.com",
  "password": "password123",
  "role": "CUSTOMER"
}
```

For organisers, the account is created with:

```text
role = ORGANISER
approvalStatus = PENDING
```

### POST `/auth/login`

Authenticates a user.

Returns a JWT and user information when access is permitted.

A pending organiser receives an approval-related error instead of a login token.

### GET `/auth/me`

Returns the authenticated user's basic profile.

---

# Venues

Base path:

```text
/venues
```

Venue APIs support administrator venue management and the venue/seat/category structures required by the booking system.

Typical operations include creating, viewing, updating, and managing venue seat layouts.

---

# Events

Base path:

```text
/events
```

Event APIs support:

- Event creation
- Event listing
- Event details
- Event filtering/browsing
- Organiser event management
- Event category pricing

An event contains:

- title
- type
- description
- date
- time
- venue
- organiser
- category pricing

---

# Seats

Base path:

```text
/seats
```

Seat APIs support event-specific seat inventory and seat-map operations.

The central event-specific seat entity is `ShowSeat`.

Seat states include:

```text
AVAILABLE
HELD
BOOKED
```

---

# Bookings

Base path:

```text
/bookings
```

Booking functionality includes:

- Seat hold
- Checkout/booking
- Booking history
- Booking cancellation
- Booking reference
- Total amount
- QR ticket data

The booking flow should ensure that a seat cannot be booked twice.

---

# Waitlist

Base path:

```text
/waitlist
```

Waitlist functionality includes:

- Joining a waitlist
- Category-specific queue positions
- Cancellation-triggered offers
- Offer tokens
- Offer expiration
- Next-customer assignment

The waitlist is associated with an event and seat category.

---

# Admin

Base path:

```text
/admin
```

## GET `/admin/dashboard/stats`

Admin only.

Returns real database statistics:

```json
{
  "stats": {
    "totalUsers": 0,
    "totalEvents": 0,
    "totalVenues": 0,
    "totalBookings": 0,
    "confirmedBookings": 0,
    "cancelledBookings": 0,
    "pendingOrganizers": 0,
    "totalRevenue": 0
  }
}
```

## GET `/admin/analytics`

Admin and approved organiser access.

For administrators, the response contains platform-wide statistics.

For organisers, the response is restricted to events owned by the authenticated organiser.

## GET `/admin/organizers/pending`

Admin only.

Returns organiser accounts where:

```text
role = ORGANISER
approvalStatus = PENDING
```

## PATCH `/admin/organizers/:id/approve`

Admin only.

Changes the organiser approval state to:

```text
APPROVED
```

## PATCH `/admin/organizers/:id/reject`

Admin only.

Changes the organiser approval state to:

```text
REJECTED
```

---

# Analytics Response

An organiser analytics response contains:

```json
{
  "role": "ORGANISER",
  "summary": {
    "totalBookings": 0,
    "confirmedBookings": 0,
    "cancelledBookings": 0,
    "totalUsers": 0,
    "totalEvents": 0,
    "totalRevenue": 0
  },
  "monthly": [],
  "eventPerformance": []
}
```

`eventPerformance` contains event-level booking and revenue information.

---

# Error Convention

Typical responses:

```json
{
  "message": "Authentication required"
}
```

```json
{
  "message": "Admin access required"
}
```

```json
{
  "message": "Invalid credentials"
}
```

```json
{
  "message": "Failed to load analytics"
}
```

HTTP status codes:

- `200` — successful request
- `201` — resource created
- `400` — invalid request
- `401` — authentication required/invalid credentials
- `403` — insufficient permissions
- `404` — resource not found
- `409` — resource conflict
- `500` — server error