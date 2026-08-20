const prisma = require('../config/db');


// ============================================================
// ADMIN CHECK
// ============================================================

function requireAdmin(req, res) {

  if (!req.user) {

    res.status(401).json({
      message: 'Authentication required',
    });

    return false;
  }


  if (req.user.role !== 'ADMIN') {

    res.status(403).json({
      message: 'Admin access required',
    });

    return false;
  }


  return true;
}


// ============================================================
// ANALYTICS ACCESS
//
// ADMIN      -> platform-wide analytics
// ORGANISER  -> only their own analytics
// ============================================================

function requireAnalyticsAccess(req, res) {

  if (!req.user) {

    res.status(401).json({
      message: 'Authentication required',
    });

    return false;
  }


  if (
    req.user.role !== 'ADMIN' &&
    req.user.role !== 'ORGANISER'
  ) {

    res.status(403).json({
      message: 'Analytics access required',
    });

    return false;
  }


  return true;
}


// ============================================================
// ADMIN DASHBOARD STATISTICS
// ============================================================

exports.dashboardStats = async (req, res) => {

  try {

    if (!requireAdmin(req, res)) {
      return;
    }


    const [
      totalUsers,
      totalEvents,
      totalVenues,
      totalBookings,
      confirmedBookings,
      cancelledBookings,
      pendingOrganizers,
    ] = await Promise.all([

      prisma.user.count(),

      prisma.event.count(),

      prisma.venue.count(),

      prisma.booking.count(),

      prisma.booking.count({
        where: {
          status: 'CONFIRMED',
        },
      }),

      prisma.booking.count({
        where: {
          status: 'CANCELLED',
        },
      }),

      prisma.user.count({
        where: {
          role: 'ORGANISER',
          approvalStatus: 'PENDING',
        },
      }),

    ]);


    const revenueResult =
      await prisma.booking.aggregate({

        _sum: {
          totalAmount: true,
        },

        where: {
          status: 'CONFIRMED',
        },

      });


    const totalRevenue =
      Number(
        revenueResult._sum.totalAmount || 0
      );


    return res.json({

      stats: {

        totalUsers,

        totalEvents,

        totalVenues,

        totalBookings,

        confirmedBookings,

        cancelledBookings,

        pendingOrganizers,

        totalRevenue,

      },

    });

  } catch (error) {

    console.error(
      'Admin dashboard error:',
      error
    );


    return res.status(500).json({

      message:
        'Failed to load dashboard statistics',

    });

  }

};


// ============================================================
// ANALYTICS
//
// ADMIN
//   Platform-wide statistics
//
// ORGANISER
//   Statistics only for their own events
// ============================================================

exports.analytics = async (req, res) => {

  try {

    if (!requireAnalyticsAccess(req, res)) {
      return;
    }


    // ========================================================
    // ADMIN ANALYTICS
    // ========================================================

    if (req.user.role === 'ADMIN') {

      const [
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        totalUsers,
        totalEvents,
      ] = await Promise.all([

        prisma.booking.count(),

        prisma.booking.count({
          where: {
            status: 'CONFIRMED',
          },
        }),

        prisma.booking.count({
          where: {
            status: 'CANCELLED',
          },
        }),

        prisma.user.count(),

        prisma.event.count(),

      ]);


      const revenueResult =
        await prisma.booking.aggregate({

          _sum: {
            totalAmount: true,
          },

          where: {
            status: 'CONFIRMED',
          },

        });


      const totalRevenue =
        Number(
          revenueResult._sum.totalAmount || 0
        );


      const bookings =
        await prisma.booking.findMany({

          select: {

            createdAt: true,

            totalAmount: true,

            status: true,

          },

          orderBy: {

            createdAt: 'asc',

          },

        });


      const monthlyData = {};


      bookings.forEach((booking) => {

        const date =
          new Date(
            booking.createdAt
          );


        const key =
          `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, '0')}`;


        if (!monthlyData[key]) {

          monthlyData[key] = {

            bookings: 0,

            revenue: 0,

          };

        }


        monthlyData[key].bookings += 1;


        if (
          booking.status ===
          'CONFIRMED'
        ) {

          monthlyData[key].revenue +=
            Number(
              booking.totalAmount || 0
            );

        }

      });


      const monthly =
        Object.entries(
          monthlyData
        ).map(
          ([month, values]) => ({

            month,

            bookings:
              values.bookings,

            revenue:
              Number(
                values.revenue.toFixed(2)
              ),

          })
        );


      return res.json({

        role: 'ADMIN',

        summary: {

          totalBookings,

          confirmedBookings,

          cancelledBookings,

          totalUsers,

          totalEvents,

          totalRevenue,

        },

        monthly,

        eventPerformance: [],

      });

    }


    // ========================================================
    // ORGANISER ANALYTICS
    // ========================================================

    // IMPORTANT:
    // Get the logged-in organiser's ID FIRST.
    // This fixes:
    // ReferenceError: organiserId is not defined

    const organiserId =
      req.user.id;


    // --------------------------------------------------------
    // GET ONLY THIS ORGANISER'S EVENTS
    // --------------------------------------------------------

    const events =
      await prisma.event.findMany({

        where: {

          organiserId:
            organiserId,

        },

        select: {

          id: true,

          title: true,

          date: true,

        },

        orderBy: {

          date: 'asc',

        },

      });


    // --------------------------------------------------------
    // EVENT IDS
    // --------------------------------------------------------

    const eventIds =
      events.map(
        (event) =>
          event.id
      );


    // --------------------------------------------------------
    // BOOKINGS
    // --------------------------------------------------------

    let bookings = [];


    if (eventIds.length > 0) {

      bookings =
        await prisma.booking.findMany({

          where: {

            eventId: {

              in: eventIds,

            },

          },

          select: {

            id: true,

            eventId: true,

            userId: true,

            status: true,

            totalAmount: true,

            createdAt: true,

          },

          orderBy: {

            createdAt: 'asc',

          },

        });

    }


    // ========================================================
    // SUMMARY
    // ========================================================

    const totalBookings =
      bookings.length;


    const confirmedBookings =
      bookings.filter(
        (booking) =>
          booking.status ===
          'CONFIRMED'
      ).length;


    const cancelledBookings =
      bookings.filter(
        (booking) =>
          booking.status ===
          'CANCELLED'
      ).length;


    const totalRevenue =
      bookings
        .filter(
          (booking) =>
            booking.status ===
            'CONFIRMED'
        )
        .reduce(
          (sum, booking) =>
            sum +
            Number(
              booking.totalAmount || 0
            ),
          0
        );


    // ========================================================
    // UNIQUE CUSTOMERS
    // ========================================================

    const uniqueCustomers =
      new Set(
        bookings.map(
          (booking) =>
            booking.userId
        )
      ).size;


    // ========================================================
    // MONTHLY DATA
    // ========================================================

    const monthlyData = {};


    bookings.forEach((booking) => {

      const date =
        new Date(
          booking.createdAt
        );


      const key =
        `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, '0')}`;


      if (!monthlyData[key]) {

        monthlyData[key] = {

          bookings: 0,

          revenue: 0,

        };

      }


      monthlyData[key].bookings += 1;


      if (
        booking.status ===
        'CONFIRMED'
      ) {

        monthlyData[key].revenue +=
          Number(
            booking.totalAmount || 0
          );

      }

    });


    const monthly =
      Object.entries(
        monthlyData
      ).map(
        ([month, values]) => ({

          month,

          bookings:
            values.bookings,

          revenue:
            Number(
              values.revenue.toFixed(2)
            ),

        })
      );


    // ========================================================
    // EVENT PERFORMANCE
    // ========================================================

    const eventPerformance =
      events.map((event) => {

        const eventBookings =
          bookings.filter(
            (booking) =>
              booking.eventId ===
              event.id
          );


        const confirmed =
          eventBookings.filter(
            (booking) =>
              booking.status ===
              'CONFIRMED'
          );


        const revenue =
          confirmed.reduce(
            (sum, booking) =>
              sum +
              Number(
                booking.totalAmount || 0
              ),
            0
          );


        const cancelled =
          eventBookings.filter(
            (booking) =>
              booking.status ===
              'CANCELLED'
          ).length;


        return {

          id:
            event.id,

          title:
            event.title,

          date:
            event.date,

          bookings:
            eventBookings.length,

          confirmedBookings:
            confirmed.length,

          cancelledBookings:
            cancelled,

          revenue:
            Number(
              revenue.toFixed(2)
            ),

        };

      });


    // ========================================================
    // ORGANISER RESPONSE
    // ========================================================

    return res.json({

      role:
        'ORGANISER',

      summary: {

        totalBookings,

        confirmedBookings,

        cancelledBookings,

        totalUsers:
          uniqueCustomers,

        totalEvents:
          events.length,

        totalRevenue:
          Number(
            totalRevenue.toFixed(2)
          ),

      },

      monthly,

      eventPerformance,

    });

  } catch (error) {

    console.error(
      'Analytics error:',
      error
    );


    return res.status(500).json({

      message:
        'Failed to load analytics',

    });

  }

};


// ============================================================
// GET PENDING ORGANIZERS
// ============================================================

exports.getPendingOrganizers = async (
  req,
  res
) => {

  try {

    if (!requireAdmin(req, res)) {
      return;
    }


    const organizers =
      await prisma.user.findMany({

        where: {

          role: 'ORGANISER',

          approvalStatus:
            'PENDING',

        },

        select: {

          id: true,

          name: true,

          email: true,

          role: true,

          approvalStatus: true,

          createdAt: true,

        },

        orderBy: {

          createdAt: 'desc',

        },

      });


    return res.json({

      organizers,

      count:
        organizers.length,

    });

  } catch (error) {

    console.error(
      'Pending organizers error:',
      error
    );


    return res.status(500).json({

      message:
        'Failed to load organizer applications',

    });

  }

};


// ============================================================
// APPROVE ORGANIZER
// ============================================================

exports.approveOrganizer = async (
  req,
  res
) => {

  try {

    if (!requireAdmin(req, res)) {
      return;
    }


    const {
      id,
    } = req.params;


    const organizer =
      await prisma.user.findUnique({

        where: {
          id,
        },

      });


    if (!organizer) {

      return res.status(404).json({

        message:
          'Organizer not found',

      });

    }


    if (
      organizer.role !==
      'ORGANISER'
    ) {

      return res.status(400).json({

        message:
          'User is not an organiser',

      });

    }


    const updated =
      await prisma.user.update({

        where: {
          id,
        },

        data: {

          approvalStatus:
            'APPROVED',

        },

        select: {

          id: true,

          name: true,

          email: true,

          role: true,

          approvalStatus: true,

        },

      });


    return res.json({

      message:
        'Organizer approved successfully',

      organizer:
        updated,

    });

  } catch (error) {

    console.error(
      'Approve organizer error:',
      error
    );


    return res.status(500).json({

      message:
        'Failed to approve organizer',

    });

  }

};


// ============================================================
// REJECT ORGANIZER
// ============================================================

exports.rejectOrganizer = async (
  req,
  res
) => {

  try {

    if (!requireAdmin(req, res)) {
      return;
    }


    const {
      id,
    } = req.params;


    const organizer =
      await prisma.user.findUnique({

        where: {
          id,
        },

      });


    if (!organizer) {

      return res.status(404).json({

        message:
          'Organizer not found',

      });

    }


    if (
      organizer.role !==
      'ORGANISER'
    ) {

      return res.status(400).json({

        message:
          'User is not an organiser',

      });

    }


    const updated =
      await prisma.user.update({

        where: {
          id,
        },

        data: {

          approvalStatus:
            'REJECTED',

        },

        select: {

          id: true,

          name: true,

          email: true,

          role: true,

          approvalStatus: true,

        },

      });


    return res.json({

      message:
        'Organizer rejected successfully',

      organizer:
        updated,

    });

  } catch (error) {

    console.error(
      'Reject organizer error:',
      error
    );


    return res.status(500).json({

      message:
        'Failed to reject organizer',

    });

  }

};