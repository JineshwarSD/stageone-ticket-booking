const prisma = require('../config/db');

// ADMIN: create venue with seat layout + categories in one call
// body: { name, address, categories: ["Premium","Standard"], rows: [{row:"A", seatCount:10, category:"Premium"}, ...] }
exports.createVenue = async (req, res) => {
  try {
    const { name, address, rows } = req.body;
    if (!name || !address || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'name, address and rows[] are required' });
    }

    const categoryNames = [...new Set(rows.map((r) => r.category))];

    const venue = await prisma.$transaction(async (tx) => {
      const v = await tx.venue.create({
        data: { name, address, adminId: req.user.id },
      });

      const categoryMap = {};
      for (const catName of categoryNames) {
        const cat = await tx.seatCategory.create({
          data: { name: catName, venueId: v.id },
        });
        categoryMap[catName] = cat.id;
      }

      const seatData = [];
      for (const r of rows) {
        for (let n = 1; n <= r.seatCount; n++) {
          seatData.push({
            row: r.row,
            number: n,
            venueId: v.id,
            categoryId: categoryMap[r.category],
          });
        }
      }
      await tx.seat.createMany({ data: seatData });

      return v;
    });

    const full = await prisma.venue.findUnique({
      where: { id: venue.id },
      include: { categories: true, seats: true },
    });
    res.status(201).json(full);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create venue' });
  }
};

exports.listVenues = async (req, res) => {
  const where = req.user.role === 'ADMIN' ? { adminId: req.user.id } : {};
  const venues = await prisma.venue.findMany({
    where,
    include: { categories: true, _count: { select: { seats: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(venues);
};

exports.getVenue = async (req, res) => {
  const venue = await prisma.venue.findUnique({
    where: { id: req.params.id },
    include: { categories: true, seats: true },
  });
  if (!venue) return res.status(404).json({ message: 'Venue not found' });
  res.json(venue);
};
