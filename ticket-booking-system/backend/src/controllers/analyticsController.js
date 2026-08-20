const prisma = require('../config/db');


// ============================================================
// ORGANISER / ADMIN ANALYTICS
// ============================================================

exports.getAnalytics = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'ADMIN';

    // Admin sees everything.
    // Organiser sees only their own events.
    const eventWhere = isAdmin
      ? {}
      : { organiserId: req.user.id };

    const events = await prisma.event.findMany({
      where: eventWhere,
      include: {
        venue: true,
        showSeats: true,
        bookings: {
          where: {
            status: 'CONFIRMED',
          },
          include: {
            seats: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalEvents = events.length;

    let totalTicketsSold = 0;
    let totalRevenue = 0;
    let totalSeats = 0;
    let totalBookedSeats = 0;

    const eventPerformance = [];

    for (const event of events) {
      const seats = event.showSeats || [];

      const bookedSeats = seats.filter(
        (seat) => seat.status === 'BOOKED'
      );

      const ticketsSold = event.bookings.reduce(
        (sum, booking) =>
          sum + (booking.seats?.length || 0),
        0
      );

      const revenue = event.bookings.reduce(
        (sum, booking) =>
          sum + Number(booking.totalAmount || 0),
        0
      );

      totalSeats += seats.length;
      totalBookedSeats += bookedSeats.length;
      totalTicketsSold += ticketsSold;
      totalRevenue += revenue;

      eventPerformance.push({
        id: event.id,
        title: event.title,
        type: event.type,
        date: event.date,
        venue: event.venue?.name || 'Unknown',
        ticketsSold,
        revenue,
        totalSeats: seats.length,
        occupancy:
          seats.length > 0
            ? Number(
                (
                  (bookedSeats.length /
                    seats.length) *
                  100
                ).toFixed(1)
              )
            : 0,
      });
    }

    // Highest revenue event
    const bestEvent =
      [...eventPerformance].sort(
        (a, b) => b.revenue - a.revenue
      )[0] || null;

    // Recent confirmed bookings
    const recentBookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        event: eventWhere,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        event: {
          select: {
            title: true,
            date: true,
          },
        },
        seats: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Booking trend by date
    const trendMap = {};

    for (const booking of recentBookings) {
      const date = new Date(
        booking.createdAt
      ).toLocaleDateString('en-IN');

      if (!trendMap[date]) {
        trendMap[date] = {
          date,
          bookings: 0,
          revenue: 0,
        };
      }

      trendMap[date].bookings += 1;
      trendMap[date].revenue += Number(
        booking.totalAmount || 0
      );
    }

    const bookingTrend =
      Object.values(trendMap).reverse();

    res.json({
      overview: {
        totalEvents,
        totalTicketsSold,
        totalRevenue,
        totalSeats,
        totalBookedSeats,

        occupancy:
          totalSeats > 0
            ? Number(
                (
                  (totalBookedSeats /
                    totalSeats) *
                  100
                ).toFixed(1)
              )
            : 0,
      },

      bestEvent,

      eventPerformance,

      bookingTrend,

      recentBookings,
    });
  } catch (err) {
    console.error(
      'Analytics error:',
      err
    );

    res.status(500).json({
      message:
        'Failed to load analytics',
    });
  }
};