const cron = require('node-cron');
const prisma = require('../config/db');
const { emitSeatUpdate } = require('../utils/socket');
const { expireStaleOffers } = require('../controllers/waitlistController');

// Runs every 30 seconds:
//  1. Releases any seat holds whose TTL has passed (abandoned checkouts).
//  2. Expires any waitlist offers whose time-limit has passed and cascades
//     the seat offer to the next person in line.
function startHoldExpiryJob() {
  cron.schedule('*/30 * * * * *', async () => {
    try {
      const now = new Date();
      const expired = await prisma.showSeat.findMany({
        where: { status: 'HELD', holdExpiresAt: { lt: now } },
        select: { id: true, eventId: true },
      });

      if (expired.length > 0) {
        await prisma.showSeat.updateMany({
          where: { id: { in: expired.map((s) => s.id) } },
          data: { status: 'AVAILABLE', heldById: null, holdExpiresAt: null },
        });
        expired.forEach((s) => emitSeatUpdate(s.eventId, { showSeatId: s.id, status: 'AVAILABLE' }));
        console.log(`[holdExpiryJob] Released ${expired.length} expired seat hold(s)`);
      }

      const expiredOffers = await expireStaleOffers();
      if (expiredOffers > 0) {
        console.log(`[holdExpiryJob] Expired ${expiredOffers} waitlist offer(s) and cascaded to next in line`);
      }
    } catch (err) {
      console.error('[holdExpiryJob] error:', err);
    }
  });
  console.log('[holdExpiryJob] scheduled every 30s');
}

module.exports = { startHoldExpiryJob };
