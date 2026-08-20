const prisma = require('../config/db');

// ORGANISER: create event/show with per-category pricing.
// body: { title, type, description, date, time, venueId, pricing: [{categoryId, price}] }
exports.createEvent = async (req, res) => {
  try {
    const { title, type, description, date, time, venueId, pricing } = req.body;
    if (!title || !date || !time || !venueId || !Array.isArray(pricing) || pricing.length === 0) {
      return res.status(400).json({ message: 'title, date, time, venueId and pricing[] are required' });
    }

    const venue = await prisma.venue.findUnique({ where: { id: venueId }, include: { seats: true } });
    if (!venue) return res.status(404).json({ message: 'Venue not found' });

    const event = await prisma.$transaction(async (tx) => {
      const ev = await tx.event.create({
        data: {
          title,
          type: type || 'MOVIE',
          description,
          date: new Date(date),
          time,
          venueId,
          organiserId: req.user.id,
        },
      });

      await tx.eventCategoryPrice.createMany({
        data: pricing.map((p) => ({ eventId: ev.id, categoryId: p.categoryId, price: p.price })),
      });

      // Pre-create a ShowSeat row (status AVAILABLE) for every physical seat in the venue
      await tx.showSeat.createMany({
        data: venue.seats.map((s) => ({ eventId: ev.id, seatId: s.id, status: 'AVAILABLE' })),
      });

      return ev;
    });

    const full = await prisma.event.findUnique({
      where: { id: event.id },
      include: { pricing: { include: { category: true } }, venue: true },
    });
    res.status(201).json(full);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create event' });
  }
};

// Public: browse & filter events
exports.listEvents = async (req, res) => {
  const { type, q, from, to } = req.query;
  const where = {};
  if (type) where.type = type;
  if (q) where.title = { contains: q };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }
  if (req.user?.role === 'ORGANISER') where.organiserId = req.user.id;

  const events = await prisma.event.findMany({
    where,
    include: {
      venue: true,
      pricing: { include: { category: true } },
      _count: { select: { showSeats: true } },
    },
    orderBy: { date: 'asc' },
  });
  res.json(events);
};

exports.getEvent = async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: { venue: true, pricing: { include: { category: true } } },
  });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  res.json(event);
};

// ORGANISER: booking summary + revenue for one of their events
exports.eventSummary = async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) return res.status(404).json({ message: 'Event not found' });
  if (event.organiserId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Not your event' });
  }

  const bookings = await prisma.booking.findMany({
    where: { eventId: event.id, status: 'CONFIRMED' },
    include: { seats: true },
  });

  const seatCounts = await prisma.showSeat.groupBy({
    by: ['status'],
    where: { eventId: event.id },
    _count: true,
  });

  const revenue = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const seatsSold = bookings.reduce((sum, b) => sum + b.seats.length, 0);

  res.json({
    eventId: event.id,
    title: event.title,
    totalBookings: bookings.length,
    seatsSold,
    revenue,
    seatBreakdown: seatCounts,
  });
};
