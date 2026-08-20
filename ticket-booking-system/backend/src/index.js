const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
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
    credentials: true,
  },
});


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
  cors({
    origin: CLIENT_URL,
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
      message: 'Route not found',
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
      message: 'Internal server error',
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

    console.log('');
  }
);