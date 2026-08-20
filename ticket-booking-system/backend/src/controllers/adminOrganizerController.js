const prisma = require('../config/db');

// ============================================================
// GET PENDING ORGANIZER APPLICATIONS
// GET /api/admin/organizers/pending
// ============================================================

exports.getPendingOrganizers = async (req, res) => {
  try {
    const organizers = await prisma.user.findMany({
      where: {
        role: 'ORGANISER',
        approvalStatus: 'PENDING',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      organizers,
      count: organizers.length,
    });
  } catch (error) {
    console.error('Get pending organizers error:', error);

    res.status(500).json({
      message: 'Failed to load organizer applications',
    });
  }
};


// ============================================================
// APPROVE ORGANIZER
// PATCH /api/admin/organizers/:id/approve
// ============================================================

exports.approveOrganizer = async (req, res) => {
  try {
    const { id } = req.params;

    const organizer = await prisma.user.findUnique({
      where: { id },
    });

    if (!organizer) {
      return res.status(404).json({
        message: 'Organizer not found',
      });
    }

    if (organizer.role !== 'ORGANISER') {
      return res.status(400).json({
        message: 'User is not an organiser',
      });
    }

    if (organizer.approvalStatus !== 'PENDING') {
      return res.status(400).json({
        message: 'Organizer application is not pending',
      });
    }

    const updatedOrganizer = await prisma.user.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        createdAt: true,
      },
    });

    res.json({
      message: 'Organizer approved successfully',
      organizer: updatedOrganizer,
    });
  } catch (error) {
    console.error('Approve organizer error:', error);

    res.status(500).json({
      message: 'Failed to approve organizer',
    });
  }
};


// ============================================================
// REJECT ORGANIZER
// PATCH /api/admin/organizers/:id/reject
// ============================================================

exports.rejectOrganizer = async (req, res) => {
  try {
    const { id } = req.params;

    const organizer = await prisma.user.findUnique({
      where: { id },
    });

    if (!organizer) {
      return res.status(404).json({
        message: 'Organizer not found',
      });
    }

    if (organizer.role !== 'ORGANISER') {
      return res.status(400).json({
        message: 'User is not an organiser',
      });
    }

    if (organizer.approvalStatus !== 'PENDING') {
      return res.status(400).json({
        message: 'Organizer application is not pending',
      });
    }

    const updatedOrganizer = await prisma.user.update({
      where: { id },
      data: {
        approvalStatus: 'REJECTED',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        approvalStatus: true,
        createdAt: true,
      },
    });

    res.json({
      message: 'Organizer rejected successfully',
      organizer: updatedOrganizer,
    });
  } catch (error) {
    console.error('Reject organizer error:', error);

    res.status(500).json({
      message: 'Failed to reject organizer',
    });
  }
};