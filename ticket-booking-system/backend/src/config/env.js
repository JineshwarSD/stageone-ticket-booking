require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  SEAT_HOLD_TTL_MINUTES: parseInt(process.env.SEAT_HOLD_TTL_MINUTES || '10', 10),
  WAITLIST_OFFER_TTL_MINUTES: parseInt(process.env.WAITLIST_OFFER_TTL_MINUTES || '15', 10),
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM || 'Ticket Booking <no-reply@ticketbooking.com>',
};
