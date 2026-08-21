const bcrypt = require('bcryptjs');
const prisma = require('../config/db');

exports.createAdmin = async (req, res) => {
  try {
    const email = 'admin@stageone.com';
    const password = 'admin123';

    const existingAdmin = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
      },
    });

    if (existingAdmin) {
      return res.status(409).json({
        message: 'An admin account already exists.',
        admin: {
          name: existingAdmin.name,
          email: existingAdmin.email,
          role: existingAdmin.role,
        },
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'This email is already registered.',
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const admin = await prisma.user.create({
      data: {
        name: 'StageOne Admin',
        email,
        password: hashedPassword,
        role: 'ADMIN',
        approvalStatus: 'NOT_REQUIRED',
      },
    });

    return res.status(201).json({
      message: 'Admin created successfully.',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

  } catch (error) {
    console.error('Create admin error:', error);

    return res.status(500).json({
      message: 'Failed to create admin.',
    });
  }
};