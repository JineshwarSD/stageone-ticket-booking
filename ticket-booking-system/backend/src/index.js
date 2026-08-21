const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const { Server } = require('socket.io');

const {
  PORT,
  CLIENT_URL,
} = require('./config/env');

const {
  initSocket,
} = require('./utils/socket');

const {
  startHoldExpiryJob,
} = require('./jobs/holdExpiry');

const prisma = require('./config/db');


// ============================================================
// ROUTES
// ============================================================

const authRoutes =
  require('./routes/authRoutes');

const venueRoutes =
  require('./routes/venueRoutes');

const eventRoutes =
  require('./routes/eventRoutes');

const seatRoutes =
  require('./routes/seatRoutes');

const bookingRoutes =
  require('./routes/bookingRoutes');

const waitlistRoutes =
  require('./routes/waitlistRoutes');

const adminRoutes =
  require('./routes/adminRoutes');


// ============================================================
// APP
// ============================================================

const app = express();

const server =
  http.createServer(app);


// ============================================================
// SOCKET.IO
// ============================================================

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
  cors({
    origin: CLIENT_URL,
    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],
    credentials: true,
  })
);

app.use(
  express.json()
);

app.use(
  morgan('dev')
);


// ============================================================
// HEALTH CHECK
// ============================================================

app.get(
  '/api/health',
  (req, res) => {

    res.json({
      status: 'ok',
      time: new Date().toISOString(),
    });

  }
);


// ============================================================
// TEMPORARY ADMIN CREATION
// ============================================================
//
// Creates exactly ONE ADMIN account:
//
// Email:    admin@stageone.com
// Password: admin123
//
// REMOVE THIS ROUTE AFTER SUCCESSFUL CREATION.
//

app.get(
  '/api/setup/create-admin',
  async (req, res) => {

    try {

      const email =
        'admin@stageone.com';

      const password =
        'admin123';


      // --------------------------------------------------------
      // CHECK IF ADMIN ALREADY EXISTS
      // --------------------------------------------------------

      const existingAdmin =
        await prisma.user.findFirst({
          where: {
            role: 'ADMIN',
          },
        });


      if (existingAdmin) {

        return res.status(409).json({

          message:
            'An admin account already exists.',

          admin: {
            name:
              existingAdmin.name,

            email:
              existingAdmin.email,

            role:
              existingAdmin.role,
          },

        });

      }


      // --------------------------------------------------------
      // CHECK EMAIL
      // --------------------------------------------------------

      const existingUser =
        await prisma.user.findUnique({

          where: {
            email,
          },

        });


      if (existingUser) {

        return res.status(409).json({

          message:
            'This email is already registered.',

        });

      }


      // --------------------------------------------------------
      // HASH PASSWORD
      // --------------------------------------------------------

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );


      // --------------------------------------------------------
      // CREATE ADMIN
      // --------------------------------------------------------

      const admin =
        await prisma.user.create({

          data: {

            name:
              'StageOne Admin',

            email,

            password:
              hashedPassword,

            role:
              'ADMIN',

            approvalStatus:
              'NOT_REQUIRED',

          },

        });


      return res.status(201).json({

        message:
          'Admin created successfully.',

        admin: {

          id:
            admin.id,

          name:
            admin.name,

          email:
            admin.email,

          role:
            admin.role,

        },

      });

    } catch (error) {

      console.error(
        'Create admin error:',
        error
      );

      return res.status(500).json({

        message:
          'Failed to create admin.',

        error:
          error.message,

      });

    }

  }
);


// ============================================================
// API ROUTES
// ============================================================

app.use(
  '/api/auth',
  authRoutes
);

app.use(
  '/api/venues',
  venueRoutes
);

app.use(
  '/api/events',
  eventRoutes
);

app.use(
  '/api/seats',
  seatRoutes
);

app.use(
  '/api/bookings',
  bookingRoutes
);

app.use(
  '/api/waitlist',
  waitlistRoutes
);


// ============================================================
// ADMIN ROUTES
// ============================================================

app.use(
  '/api/admin',
  adminRoutes
);


// ============================================================
// 404
// ============================================================

app.use(
  (req, res) => {

    console.log(
      `404 - ${req.method} ${req.originalUrl}`
    );

    res.status(404).json({
      message:
        'Route not found',
    });

  }
);


// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
  (err, req, res, next) => {

    console.error(
      'Server error:',
      err
    );

    res.status(500).json({

      message:
        'Internal server error',

    });

  }
);


// ============================================================
// SOCKET
// ============================================================

initSocket(io);


// ============================================================
// HOLD EXPIRY JOB
// ============================================================

startHoldExpiryJob();


// ============================================================
// SERVER
// ============================================================

server.listen(
  PORT,
  () => {

    console.log('');

    console.log(
      `🚀 Ticket Booking API running on http://localhost:${PORT}`
    );

    console.log(
      '   Socket.io ready for real-time seat updates'
    );

    console.log(
      '   Admin dashboard: /api/admin/dashboard/stats'
    );

    console.log(
      '   Organizer approvals: /api/admin/organizers/pending'
    );

    console.log(
      '   Analytics: /api/admin/analytics'
    );

    console.log(
      '   Temporary admin setup: /api/setup/create-admin'
    );

    console.log('');

  }
);