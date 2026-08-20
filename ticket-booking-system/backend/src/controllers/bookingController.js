const { v4: uuidv4 } = require('uuid');

const prisma = require('../config/db');

const { emitSeatUpdate } = require('../utils/socket');

const { generateBookingQR } = require('../utils/qrGenerator');

const {
  sendMail,
  bookingConfirmationEmail,
} = require('../utils/emailService');

const {
  offerNextWaitlistSeat,
} = require('./waitlistController');


function generateReference() {
  return (
    'BK-' +
    uuidv4()
      .split('-')[0]
      .toUpperCase()
  );
}


// ============================================================
// CREATE BOOKING
// ============================================================

exports.createBooking = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { showSeatIds } = req.body;

    if (
      !Array.isArray(showSeatIds) ||
      showSeatIds.length === 0
    ) {
      return res.status(400).json({
        message: 'showSeatIds[] is required',
      });
    }

    const event =
      await prisma.event.findUnique({
        where: { id: eventId },
      });

    if (!event) {
      return res.status(404).json({
        message: 'Event not found',
      });
    }

    const showSeats =
      await prisma.showSeat.findMany({
        where: {
          id: {
            in: showSeatIds,
          },
          eventId,
        },

        include: {
          seat: {
            include: {
              category: true,
            },
          },
        },
      });

    if (
      showSeats.length !==
      showSeatIds.length
    ) {
      return res.status(400).json({
        message:
          'One or more seats are invalid',
      });
    }

    const notMine =
      showSeats.filter(
        (seat) =>
          seat.status !== 'HELD' ||
          seat.heldById !== req.user.id
      );

    if (notMine.length > 0) {
      return res.status(409).json({
        message:
          'Your hold on some seats has expired. Please reselect.',
        expired:
          notMine.map(
            (seat) => seat.id
          ),
      });
    }

    const pricing =
      await prisma.eventCategoryPrice.findMany({
        where: { eventId },
      });

    const priceMap = {};

    pricing.forEach((price) => {
      priceMap[price.categoryId] =
        price.price;
    });

    const totalAmount =
      showSeats.reduce(
        (sum, seat) =>
          sum +
          (priceMap[
            seat.seat.categoryId
          ] || 0),
        0
      );

    const reference =
      generateReference();

    const booking =
      await prisma.$transaction(
        async (tx) => {

          const newBooking =
            await tx.booking.create({
              data: {
                reference,
                userId: req.user.id,
                eventId,
                totalAmount,
              },
            });

          for (const seat of showSeats) {

            await tx.bookingSeat.create({
              data: {
                bookingId:
                  newBooking.id,

                showSeatId:
                  seat.id,

                price:
                  priceMap[
                    seat.seat.categoryId
                  ] || 0,
              },
            });

            await tx.showSeat.update({
              where: {
                id: seat.id,
              },

              data: {
                status: 'BOOKED',
                heldById: null,
                holdExpiresAt: null,
              },
            });
          }

          return newBooking;
        }
      );

    // Real-time seat updates
    showSeatIds.forEach((id) => {
      emitSeatUpdate(
        eventId,
        {
          showSeatId: id,
          status: 'BOOKED',
        }
      );
    });

    // Generate QR
    const qrCodeDataUrl =
      await generateBookingQR({
        reference,
        eventId,
        userId: req.user.id,
      });

    await prisma.booking.update({
      where: {
        id: booking.id,
      },

      data: {
        qrCodeData:
          qrCodeDataUrl,
      },
    });

    const seatLabel =
      showSeats
        .map(
          (seat) =>
            `${seat.seat.row}${seat.seat.number} (${seat.seat.category.name})`
        )
        .join(', ');

    // Send booking email
    const emailContent =
      bookingConfirmationEmail({
        name: req.user.name,
        eventTitle: event.title,
        seats: seatLabel,
        reference,
        totalAmount,
        qrCodeDataUrl,
      });

    sendMail({
      to: req.user.email,
      ...emailContent,
    }).catch((error) => {
      console.error(
        'Email send failed:',
        error
      );
    });

    res.status(201).json({
      id: booking.id,
      reference,
      totalAmount,
      seats: seatLabel,
      qrCodeDataUrl,
    });

  } catch (err) {

    console.error(
      'Create booking error:',
      err
    );

    res.status(500).json({
      message:
        'Failed to create booking',
    });
  }
};


// ============================================================
// MY BOOKINGS
// ============================================================

exports.myBookings = async (req, res) => {
  try {

    const bookings =
      await prisma.booking.findMany({
        where: {
          userId: req.user.id,
        },

        include: {
          event: {
            include: {
              venue: true,
            },
          },

          seats: {
            include: {
              showSeat: {
                include: {
                  seat: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    res.json(bookings);

  } catch (err) {

    console.error(
      'My bookings error:',
      err
    );

    res.status(500).json({
      message:
        'Failed to load bookings',
    });
  }
};


// ============================================================
// DASHBOARD DATA
// ============================================================

exports.dashboard = async (req, res) => {
  try {

    const bookings =
      await prisma.booking.findMany({
        where: {
          userId: req.user.id,
        },

        include: {
          event: {
            include: {
              venue: true,
            },
          },

          seats: {
            include: {
              showSeat: {
                include: {
                  seat: true,
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    const confirmed =
      bookings.filter(
        (booking) =>
          booking.status ===
          'CONFIRMED'
      );

    const cancelled =
      bookings.filter(
        (booking) =>
          booking.status ===
          'CANCELLED'
      );

    const totalSpent =
      confirmed.reduce(
        (sum, booking) =>
          sum +
          Number(
            booking.totalAmount || 0
          ),
        0
      );

    const now = new Date();

    const upcoming =
      confirmed
        .filter(
          (booking) =>
            booking.event &&
            new Date(
              booking.event.date
            ) >= now
        )
        .sort(
          (a, b) =>
            new Date(
              a.event.date
            ) -
            new Date(
              b.event.date
            )
        );

    res.json({
      stats: {
        totalBookings:
          bookings.length,

        confirmedBookings:
          confirmed.length,

        cancelledBookings:
          cancelled.length,

        totalSpent,
      },

      nextEvent:
        upcoming[0] || null,

      upcomingBookings:
        upcoming,

      recentBookings:
        bookings.slice(0, 5),
    });

  } catch (err) {

    console.error(
      'Dashboard error:',
      err
    );

    res.status(500).json({
      message:
        'Failed to load dashboard',
    });
  }
};


// ============================================================
// CANCEL BOOKING
// ============================================================

exports.cancelBooking = async (req, res) => {
  try {

    const { id } = req.params;

    const booking =
      await prisma.booking.findUnique({
        where: { id },

        include: {
          event: true,

          seats: {
            include: {
              showSeat: {
                include: {
                  seat: true,
                },
              },
            },
          },
        },
      });

    if (!booking) {
      return res.status(404).json({
        message:
          'Booking not found',
      });
    }

    if (
      booking.userId !==
        req.user.id &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        message:
          'Not your booking',
      });
    }

    if (
      booking.status ===
      'CANCELLED'
    ) {
      return res.status(400).json({
        message:
          'Already cancelled',
      });
    }

    await prisma.booking.update({
      where: { id },

      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    for (const bs of booking.seats) {

      await prisma.showSeat.update({
        where: {
          id: bs.showSeatId,
        },

        data: {
          status: 'AVAILABLE',
          heldById: null,
          holdExpiresAt: null,
        },
      });

      emitSeatUpdate(
        booking.eventId,
        {
          showSeatId:
            bs.showSeatId,

          status:
            'AVAILABLE',
        }
      );

      await offerNextWaitlistSeat({
        eventId:
          booking.eventId,

        categoryId:
          bs.showSeat.seat.categoryId,

        showSeatId:
          bs.showSeatId,
      });
    }

    res.json({
      message:
        'Booking cancelled',

      bookingId: id,
    });

  } catch (err) {

    console.error(
      'Cancel booking error:',
      err
    );

    res.status(500).json({
      message:
        'Failed to cancel booking',
    });
  }
};