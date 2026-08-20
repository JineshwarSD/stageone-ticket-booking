# StageOne — System Design Write-up

## 1. Architecture

StageOne uses a React frontend, an Express/Node.js backend, Prisma ORM, SQLite database, and Socket.IO for real-time communication. REST APIs handle authentication, events, venues, seats, bookings, waitlists, administration, and analytics. JWT-based authentication and role checks protect resources.

## 2. Seat Hold and TTL Mechanism

Seat availability is represented by the `ShowSeat` entity. A physical seat is associated with a particular event through `eventId` and `seatId`, allowing each event to maintain its own seat state.

When a customer selects an available seat, the system changes its status to `HELD`, records the user in `heldById`, and records an expiration timestamp in `holdExpiresAt`. The hold is temporary and is not a permanent booking.

A background hold-expiry job periodically checks for expired holds. When the TTL has passed, the seat is released and its state returns to `AVAILABLE`. The backend then emits a real-time update so other connected clients can immediately see the released seat.

This prevents abandoned checkouts from permanently blocking inventory.

## 3. Concurrency Protection

Concurrency is critical because two customers may attempt to select the same seat at nearly the same time. The system represents every event-seat combination as a unique `ShowSeat` record using the database constraint on `eventId` and `seatId`.

The booking/hold operation must perform an atomic availability check/update or database transaction. The operation succeeds only if the seat is still available. A second simultaneous request therefore receives an unavailable-seat response instead of creating a duplicate active reservation.

Concurrency testing should be performed using two browser sessions attempting to reserve the same event seat simultaneously.

## 4. Waitlist Auto-Assignment

When a category is sold out, a customer can join a category-specific waitlist. Each waitlist record stores the event, category, user, status, and queue position.

When a confirmed booking is cancelled, the released seat becomes eligible for the next customer in the appropriate category queue. The system creates a time-limited offer using an offer token and expiry timestamp.

The customer receives a notification/link and can complete the booking within the allowed period. If the customer does not complete the booking before expiry, the offer is released and the next eligible waitlisted customer receives the opportunity.

This mechanism improves seat utilization while maintaining queue fairness.

## 5. Real-Time Seat Status

Socket.IO is used to broadcast seat-state changes. When a seat is held, booked, released, or otherwise changes state, connected clients can update their visual seat maps without requiring a manual page refresh.

The frontend therefore presents available, held, and booked states using the event-specific `ShowSeat` records.

## 6. QR Ticket and Email

After a successful booking, the booking reference is stored with the booking. QR data is generated from the booking reference so the ticket can be identified. The ticket is intended to be delivered through email together with the QR representation.

The end-to-end submission test should verify booking creation, QR generation, email delivery, and decoding of the QR value back to the booking reference.

## 7. Role-Based Security

The application has three roles. Customers can browse and book events. Organisers can manage their own events and access analytics for their own events. Administrators can manage venues, review organiser applications, and view platform-level analytics.

Organiser registration initially creates a `PENDING` approval status. The organiser cannot log in until an administrator approves the application.

## 8. Data Model

The main entities are `User`, `Venue`, `SeatCategory`, `Seat`, `Event`, `EventCategoryPrice`, `ShowSeat`, `Booking`, `BookingSeat`, and `Waitlist`.

`ShowSeat` is the central seat-inventory entity because seat status is event-specific. `BookingSeat` links confirmed bookings to the event-specific seats. `Waitlist` stores category-level queue and offer information.

## 9. Conclusion

The architecture separates presentation, API/business logic, persistence, and real-time communication. The design specifically addresses the core high-demand ticketing problems: temporary inventory reservation, abandoned checkout recovery, simultaneous booking attempts, sold-out event queues, automated reallocation, and real-time customer feedback.