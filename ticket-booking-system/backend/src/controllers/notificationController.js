const prisma = require('../config/db');

// ============================================================
// GET MY NOTIFICATIONS
// ============================================================

exports.getNotifications = async (req, res) => {
  try {
    const notifications =
      await prisma.notification.findMany({
        where: {
          userId: req.user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 30,
      });

    const unreadCount =
      await prisma.notification.count({
        where: {
          userId: req.user.id,
          isRead: false,
        },
      });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error(
      'Notification error:',
      err
    );

    res.status(500).json({
      message: 'Failed to load notifications',
    });
  }
};

// ============================================================
// MARK ONE NOTIFICATION AS READ
// ============================================================

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification =
      await prisma.notification.findUnique({
        where: { id },
      });

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found',
      });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({
        message: 'Not your notification',
      });
    }

    await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
      },
    });

    res.json({
      message: 'Notification marked as read',
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Failed to update notification',
    });
  }
};

// ============================================================
// MARK ALL AS READ
// ============================================================

exports.markAllAsRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.json({
      message: 'All notifications marked as read',
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message:
        'Failed to mark notifications as read',
    });
  }
};