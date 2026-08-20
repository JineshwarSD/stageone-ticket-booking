const prisma = require('../config/db');

// ============================================================
// CREATE NOTIFICATION
// ============================================================

async function createNotification({
  userId,
  title,
  message,
  type = 'INFO',
}) {
  try {
    console.log('\n🔔 Creating notification...');
    console.log('User ID:', userId);
    console.log('Title:', title);

    const notification =
      await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
        },
      });

    console.log(
      '✅ Notification created:',
      notification.id
    );

    return notification;

  } catch (err) {
    console.error(
      '\n❌ Failed to create notification'
    );

    console.error(err);

    return null;
  }
}


// ============================================================
// BOOKING CONFIRMED
// ============================================================

async function notifyBookingConfirmed({
  userId,
  eventTitle,
  reference,
  totalAmount,
}) {
  return createNotification({
    userId,

    title:
      'Booking confirmed 🎟️',

    message:
      `Your booking for ${eventTitle} is confirmed. ` +
      `Reference: ${reference}. ` +
      `Total: ₹${totalAmount}.`,

    type:
      'BOOKING_CONFIRMED',
  });
}


// ============================================================
// BOOKING CANCELLED
// ============================================================

async function notifyBookingCancelled({
  userId,
  eventTitle,
  reference,
}) {
  return createNotification({
    userId,

    title:
      'Booking cancelled',

    message:
      `Your booking for ${eventTitle} ` +
      `(${reference}) has been cancelled.`,

    type:
      'BOOKING_CANCELLED',
  });
}


// ============================================================
// WAITLIST OFFER
// ============================================================

async function notifyWaitlistOffer({
  userId,
  eventTitle,
  categoryName,
  minutesLeft,
}) {
  return createNotification({
    userId,

    title:
      'A seat is available! 🎉',

    message:
      `A ${categoryName} seat for ${eventTitle} ` +
      `is available from your waitlist. ` +
      `You have ${minutesLeft} minutes to claim it.`,

    type:
      'WAITLIST_OFFER',
  });
}


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createNotification,
  notifyBookingConfirmed,
  notifyBookingCancelled,
  notifyWaitlistOffer,
};