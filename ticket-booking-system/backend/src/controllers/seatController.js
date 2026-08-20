const prisma = require('../config/db');
const { SEAT_HOLD_TTL_MINUTES } = require('../config/env');
const { emitSeatUpdate } = require('../utils/socket');

// Visual seat map for a show: every seat + its live status.
exports.getSeatMap = async (req, res) => {
  const { eventId } = req.params;

  // Expire any holds that are past their TTL before returning the map,
  // so the caller always sees a fresh, accurate picture.
  await releaseExpiredHolds(eventId);

  const showSeats = await prisma.showSeat.findMany({
    where: { eventId },
    include: { seat: { include: { category: true } } },
    orderBy: [{ seat: { row: 'asc' } }, { seat: { number: 'asc' } }],
  });

  const pricing = await prisma.eventCategoryPrice.findMany({
    where: { eventId },
    include: { category: true },
  });

  res.json({
    seats: showSeats.map((s) => ({
      showSeatId: s.id,
      row: s.seat.row,
      number: s.seat.number,
      category: s.seat.category.name,
      categoryId: s.seat.categoryId,
      status: s.status,
      heldByMe: s.heldById === req.user?.id,
      holdExpiresAt: s.holdExpiresAt,
    })),
    pricing: pricing.map((p) => ({ categoryId: p.categoryId, category: p.category.name, price: p.price })),
  });
};

async function releaseExpiredHolds(eventId) {
  const now = new Date();
  const expired = await prisma.showSeat.findMany({
    where: { eventId, status: 'HELD', holdExpiresAt: { lt: now } },
    select: { id: true },
  });
  if (expired.length === 0) return;

  await prisma.showSeat.updateMany({
    where: { id: { in: expired.map((s) => s.id) } },
    data: { status: 'AVAILABLE', heldById: null, holdExpiresAt: null },
  });

  expired.forEach((s) => emitSeatUpdate(eventId, { showSeatId: s.id, status: 'AVAILABLE' }));
}

// Place a hold on a set of seats for the current customer.
// Concurrency-safe: each seat is only claimed via a conditional UPDATE
// (`status = 'AVAILABLE'` in the WHERE clause). If two requests race for the
// same seat, only the first UPDATE affects a row - the second sees 0 rows
// affected and that seat is reported as a conflict, never silently double-booked.
exports.holdSeats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { showSeatIds } = req.body;
    if (!Array.isArray(showSeatIds) || showSeatIds.length === 0) {
      return res.status(400).json({ message: 'showSeatIds[] is required' });
    }

    await releaseExpiredHolds(eventId);

    const holdExpiresAt = new Date(Date.now() + SEAT_HOLD_TTL_MINUTES * 60 * 1000);
    const succeeded = [];
    const conflicts = [];

    for (const showSeatId of showSeatIds) {
      const result = await prisma.showSeat.updateMany({
        where: { id: showSeatId, eventId, status: 'AVAILABLE' },
        data: { status: 'HELD', heldById: req.user.id, holdExpiresAt },
      });
      if (result.count === 1) {
        succeeded.push(showSeatId);
      } else {
        conflicts.push(showSeatId);
      }
    }

    succeeded.forEach((id) =>
      emitSeatUpdate(eventId, { showSeatId: id, status: 'HELD', holdExpiresAt })
    );

    if (conflicts.length > 0) {
      // Roll back whatever we did manage to hold, so a partially-successful
      // request never leaves the customer holding a random subset of seats.
      if (succeeded.length > 0) {
        await prisma.showSeat.updateMany({
          where: { id: { in: succeeded } },
          data: { status: 'AVAILABLE', heldById: null, holdExpiresAt: null },
        });
        succeeded.forEach((id) => emitSeatUpdate(eventId, { showSeatId: id, status: 'AVAILABLE' }));
      }
      return res.status(409).json({
        message: 'Some seats were just taken by another customer. Please reselect.',
        conflicts,
      });
    }

    res.json({ held: succeeded, holdExpiresAt, ttlMinutes: SEAT_HOLD_TTL_MINUTES });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to hold seats' });
  }
};

// Explicit release, e.g. when the customer abandons checkout / navigates away.
exports.releaseSeats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { showSeatIds } = req.body;
    if (!Array.isArray(showSeatIds) || showSeatIds.length === 0) {
      return res.status(400).json({ message: 'showSeatIds[] is required' });
    }

    const result = await prisma.showSeat.updateMany({
      where: { id: { in: showSeatIds }, eventId, heldById: req.user.id, status: 'HELD' },
      data: { status: 'AVAILABLE', heldById: null, holdExpiresAt: null },
    });

    showSeatIds.forEach((id) => emitSeatUpdate(eventId, { showSeatId: id, status: 'AVAILABLE' }));

    res.json({ released: result.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to release seats' });
  }
};

module.exports.releaseExpiredHolds = releaseExpiredHolds;
