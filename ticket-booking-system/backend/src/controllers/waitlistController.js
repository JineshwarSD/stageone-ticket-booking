const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/db');
const { WAITLIST_OFFER_TTL_MINUTES, CLIENT_URL } = require('../config/env');
const { emitSeatUpdate } = require('../utils/socket');
const { sendMail, waitlistOfferEmail, bookingConfirmationEmail } = require('../utils/emailService');
const { generateBookingQR } = require('../utils/qrGenerator');

// Customer joins the waitlist for a sold-out category on an event.
exports.joinWaitlist = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { categoryId } = req.body;
    if (!categoryId) return res.status(400).json({ message: 'categoryId is required' });

    const availableCount = await prisma.showSeat.count({
      where: { eventId, status: 'AVAILABLE', seat: { categoryId } },
    });
    if (availableCount > 0) {
      return res.status(400).json({ message: 'Seats are still available in this category — no need to join the waitlist.' });
    }

    const existing = await prisma.waitlist.findFirst({
      where: { eventId, categoryId, userId: req.user.id, status: { in: ['WAITING', 'OFFERED'] } },
    });
    if (existing) return res.status(409).json({ message: 'You are already on the waitlist for this category' });

    const lastPosition = await prisma.waitlist.count({ where: { eventId, categoryId } });

    const entry = await prisma.waitlist.create({
      data: { eventId, categoryId, userId: req.user.id, position: lastPosition + 1 },
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to join waitlist' });
  }
};

exports.myWaitlist = async (req, res) => {
  const items = await prisma.waitlist.findMany({
    where: { userId: req.user.id, status: { in: ['WAITING', 'OFFERED'] } },
    include: { event: true, category: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(items);
};

exports.leaveWaitlist = async (req, res) => {
  const { id } = req.params;
  const entry = await prisma.waitlist.findUnique({ where: { id } });
  if (!entry || entry.userId !== req.user.id) return res.status(404).json({ message: 'Not found' });
  await prisma.waitlist.update({ where: { id }, data: { status: 'CANCELLED' } });
  res.json({ message: 'Removed from waitlist' });
};

// Called when a seat frees up (cancellation, or a previous offer expiring).
// Finds the next WAITING entry for that event+category, holds the seat for
// them, and emails a time-limited link to complete the booking.
async function offerNextWaitlistSeat({ eventId, categoryId, showSeatId }) {
  const next = await prisma.waitlist.findFirst({
    where: { eventId, categoryId, status: 'WAITING' },
    orderBy: { position: 'asc' },
    include: { user: true, event: true, category: true },
  });
  if (!next) return null;

  const offerExpiresAt = new Date(Date.now() + WAITLIST_OFFER_TTL_MINUTES * 60 * 1000);
  const offerToken = uuidv4();

  await prisma.$transaction([
    prisma.showSeat.update({
      where: { id: showSeatId },
      data: { status: 'HELD', heldById: next.userId, holdExpiresAt: offerExpiresAt },
    }),
    prisma.waitlist.update({
      where: { id: next.id },
      data: { status: 'OFFERED', offeredShowSeatId: showSeatId, offerExpiresAt, offerToken },
    }),
  ]);

  emitSeatUpdate(eventId, { showSeatId, status: 'HELD', holdExpiresAt: offerExpiresAt });

  const link = `${CLIENT_URL}/waitlist-offer/${offerToken}`;
  const emailContent = waitlistOfferEmail({
    name: next.user.name,
    eventTitle: next.event.title,
    categoryName: next.category.name,
    link,
    minutesLeft: WAITLIST_OFFER_TTL_MINUTES,
  });
  sendMail({ to: next.user.email, ...emailContent }).catch((e) => console.error('Waitlist email failed:', e));

  return next;
}

// Waitlisted customer clicks the emailed link to complete their booking.
exports.getOffer = async (req, res) => {
  const { token } = req.params;
  const entry = await prisma.waitlist.findFirst({
    where: { offerToken: token, status: 'OFFERED' },
    include: { event: { include: { venue: true } }, category: true },
  });
  if (!entry) return res.status(404).json({ message: 'Offer not found or already used' });
  if (entry.offerExpiresAt < new Date()) return res.status(410).json({ message: 'This offer has expired' });

  const price = await prisma.eventCategoryPrice.findFirst({ where: { eventId: entry.eventId, categoryId: entry.categoryId } });

  res.json({
    eventTitle: entry.event.title,
    venue: entry.event.venue.name,
    category: entry.category.name,
    price: price?.price || 0,
    offerExpiresAt: entry.offerExpiresAt,
    showSeatId: entry.offeredShowSeatId,
  });
};

exports.completeOffer = async (req, res) => {
  try {
    const { token } = req.params;
    const entry = await prisma.waitlist.findFirst({
      where: { offerToken: token, status: 'OFFERED' },
      include: { event: true, category: true, user: true },
    });
    if (!entry) return res.status(404).json({ message: 'Offer not found or already used' });
    if (entry.offerExpiresAt < new Date()) return res.status(410).json({ message: 'This offer has expired' });
    if (entry.userId !== req.user.id) return res.status(403).json({ message: 'This offer is not yours' });

    const showSeat = await prisma.showSeat.findUnique({ where: { id: entry.offeredShowSeatId }, include: { seat: true } });
    if (!showSeat || showSeat.status !== 'HELD' || showSeat.heldById !== req.user.id) {
      return res.status(409).json({ message: 'Seat is no longer held for you' });
    }

    const price = await prisma.eventCategoryPrice.findFirst({ where: { eventId: entry.eventId, categoryId: entry.categoryId } });
    const reference = 'BK-' + uuidv4().split('-')[0].toUpperCase();

    const booking = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.create({
        data: { reference, userId: req.user.id, eventId: entry.eventId, totalAmount: price?.price || 0 },
      });
      await tx.bookingSeat.create({ data: { bookingId: b.id, showSeatId: showSeat.id, price: price?.price || 0 } });
      await tx.showSeat.update({ where: { id: showSeat.id }, data: { status: 'BOOKED', heldById: null, holdExpiresAt: null } });
      await tx.waitlist.update({ where: { id: entry.id }, data: { status: 'CONVERTED' } });
      return b;
    });

    emitSeatUpdate(entry.eventId, { showSeatId: showSeat.id, status: 'BOOKED' });

    const qrCodeDataUrl = await generateBookingQR({ reference, eventId: entry.eventId, userId: req.user.id });
    await prisma.booking.update({ where: { id: booking.id }, data: { qrCodeData: qrCodeDataUrl } });

    const seatLabel = `${showSeat.seat.row}${showSeat.seat.number} (${entry.category.name})`;
    const emailContent = bookingConfirmationEmail({
      name: entry.user.name,
      eventTitle: entry.event.title,
      seats: seatLabel,
      reference,
      totalAmount: price?.price || 0,
      qrCodeDataUrl,
    });
    sendMail({ to: entry.user.email, ...emailContent }).catch((e) => console.error(e));

    res.status(201).json({ id: booking.id, reference, seats: seatLabel, totalAmount: price?.price || 0, qrCodeDataUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to complete waitlist booking' });
  }
};

// Used by the cron job: sweeps offers whose time limit has passed, releases
// the seat, and cascades the offer to the next person in the waitlist.
async function expireStaleOffers() {
  const now = new Date();
  const stale = await prisma.waitlist.findMany({
    where: { status: 'OFFERED', offerExpiresAt: { lt: now } },
  });

  for (const entry of stale) {
    await prisma.waitlist.update({ where: { id: entry.id }, data: { status: 'EXPIRED' } });
    await prisma.showSeat.update({
      where: { id: entry.offeredShowSeatId },
      data: { status: 'AVAILABLE', heldById: null, holdExpiresAt: null },
    });
    emitSeatUpdate(entry.eventId, { showSeatId: entry.offeredShowSeatId, status: 'AVAILABLE' });

    await offerNextWaitlistSeat({
      eventId: entry.eventId,
      categoryId: entry.categoryId,
      showSeatId: entry.offeredShowSeatId,
    });
  }
  return stale.length;
}

module.exports = {
  joinWaitlist: exports.joinWaitlist,
  myWaitlist: exports.myWaitlist,
  leaveWaitlist: exports.leaveWaitlist,
  getOffer: exports.getOffer,
  completeOffer: exports.completeOffer,
  offerNextWaitlistSeat,
  expireStaleOffers,
};
