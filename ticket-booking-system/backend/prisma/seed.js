const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...');
  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: { name: 'Venue Admin', email: 'admin@demo.com', password, role: 'ADMIN' },
  });

  const organiser = await prisma.user.upsert({
    where: { email: 'organiser@demo.com' },
    update: {},
    create: { name: 'Event Organiser', email: 'organiser@demo.com', password, role: 'ORGANISER' },
  });

  await prisma.user.upsert({
    where: { email: 'customer@demo.com' },
    update: {},
    create: { name: 'Demo Customer', email: 'customer@demo.com', password, role: 'CUSTOMER' },
  });

  let venue = await prisma.venue.findFirst({ where: { adminId: admin.id, name: 'PVR Grand Mall' } });
  if (!venue) {
    venue = await prisma.venue.create({ data: { name: 'PVR Grand Mall', address: 'OMR, Chennai', adminId: admin.id } });
    const premium = await prisma.seatCategory.create({ data: { name: 'Premium', venueId: venue.id } });
    const standard = await prisma.seatCategory.create({ data: { name: 'Standard', venueId: venue.id } });

    const seatData = [];
    ['A', 'B'].forEach((row) => {
      for (let n = 1; n <= 6; n++) seatData.push({ row, number: n, venueId: venue.id, categoryId: premium.id });
    });
    ['C', 'D', 'E'].forEach((row) => {
      for (let n = 1; n <= 8; n++) seatData.push({ row, number: n, venueId: venue.id, categoryId: standard.id });
    });
    await prisma.seat.createMany({ data: seatData });
    console.log(`Created venue "${venue.name}" with ${seatData.length} seats`);
  }

  const categories = await prisma.seatCategory.findMany({ where: { venueId: venue.id } });
  let event = await prisma.event.findFirst({ where: { title: 'Interstellar - Re-release', venueId: venue.id } });
  if (!event) {
    event = await prisma.event.create({
      data: {
        title: 'Interstellar - Re-release',
        type: 'MOVIE',
        description: 'IMAX re-release screening',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        time: '19:30',
        venueId: venue.id,
        organiserId: organiser.id,
      },
    });
    await prisma.eventCategoryPrice.createMany({
      data: categories.map((c) => ({ eventId: event.id, categoryId: c.id, price: c.name === 'Premium' ? 450 : 250 })),
    });
    const seats = await prisma.seat.findMany({ where: { venueId: venue.id } });
    await prisma.showSeat.createMany({ data: seats.map((s) => ({ eventId: event.id, seatId: s.id, status: 'AVAILABLE' })) });
    console.log(`Created event "${event.title}" with seat map`);
  }

  console.log('\nDemo accounts (password for all: password123):');
  console.log('  admin@demo.com      -> Admin (manages venues)');
  console.log('  organiser@demo.com  -> Organiser (creates events)');
  console.log('  customer@demo.com   -> Customer (books tickets)\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
