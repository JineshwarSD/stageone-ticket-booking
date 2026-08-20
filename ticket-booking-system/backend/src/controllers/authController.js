const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = require('../config/db');

const {
  JWT_SECRET,
  JWT_EXPIRES_IN,
} = require('../config/env');


// ============================================================
// CREATE TOKEN
// ============================================================

function signToken(user) {

  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    },

    JWT_SECRET,

    {
      expiresIn:
        JWT_EXPIRES_IN,
    }
  );

}


// ============================================================
// REGISTER
// ============================================================

exports.register = async (
  req,
  res
) => {

  try {

    const {
      name,
      email,
      password,
      role,
    } = req.body;


    if (
      !name ||
      !email ||
      !password
    ) {

      return res.status(400).json({
        message:
          'Name, email and password are required',
      });

    }


    const existing =
      await prisma.user.findUnique({

        where: {
          email,
        },

      });


    if (existing) {

      return res.status(409).json({
        message:
          'Email already registered',
      });

    }


    // --------------------------------------------------------
    // ONLY CUSTOMER / ORGANISER REGISTRATION
    // --------------------------------------------------------

    const finalRole =
      role === 'ORGANISER'
        ? 'ORGANISER'
        : 'CUSTOMER';


    // --------------------------------------------------------
    // ORGANISER MUST BE APPROVED
    // --------------------------------------------------------

    const approvalStatus =
      finalRole === 'ORGANISER'
        ? 'PENDING'
        : 'NOT_REQUIRED';


    const hashed =
      await bcrypt.hash(
        password,
        10
      );


    const user =
      await prisma.user.create({

        data: {

          name,

          email,

          password:
            hashed,

          role:
            finalRole,

          approvalStatus,

        },

      });


    // --------------------------------------------------------
    // ORGANISER
    // --------------------------------------------------------

    if (
      finalRole ===
      'ORGANISER'
    ) {

      return res.status(201).json({

        message:
          'Organizer registration submitted for admin approval',

        pending: true,

        user: {

          id: user.id,

          name: user.name,

          email: user.email,

          role: user.role,

          approvalStatus:
            user.approvalStatus,

        },

      });

    }


    // --------------------------------------------------------
    // CUSTOMER
    // --------------------------------------------------------

    const token =
      signToken(user);


    return res.status(201).json({

      message:
        'Registration successful',

      token,

      user: {

        id: user.id,

        name: user.name,

        email: user.email,

        role: user.role,

        approvalStatus:
          user.approvalStatus,

      },

    });

  } catch (error) {

    console.error(
      'Registration error:',
      error
    );


    return res.status(500).json({

      message:
        'Registration failed',

    });

  }

};


// ============================================================
// LOGIN
// ============================================================

exports.login = async (
  req,
  res
) => {

  try {

    const {
      email,
      password,
    } = req.body;


    if (
      !email ||
      !password
    ) {

      return res.status(400).json({
        message:
          'Email and password are required',
      });

    }


    const user =
      await prisma.user.findUnique({

        where: {
          email,
        },

      });


    if (!user) {

      return res.status(401).json({
        message:
          'Invalid credentials',
      });

    }


    const match =
      await bcrypt.compare(
        password,
        user.password
      );


    if (!match) {

      return res.status(401).json({
        message:
          'Invalid credentials',
      });

    }


    // --------------------------------------------------------
    // ORGANISER APPROVAL CHECK
    // --------------------------------------------------------

    if (
      user.role ===
      'ORGANISER'
    ) {

      if (
        user.approvalStatus ===
        'PENDING'
      ) {

        return res.status(403).json({

          message:
            'Your organizer account is waiting for admin approval.',

          approvalStatus:
            'PENDING',

        });

      }


      if (
        user.approvalStatus ===
        'REJECTED'
      ) {

        return res.status(403).json({

          message:
            'Your organizer application was rejected by the administrator.',

          approvalStatus:
            'REJECTED',

        });

      }

    }


    const token =
      signToken(user);


    return res.json({

      message:
        'Login successful',

      token,

      user: {

        id: user.id,

        name: user.name,

        email: user.email,

        role: user.role,

        approvalStatus:
          user.approvalStatus,

      },

    });

  } catch (error) {

    console.error(
      'Login error:',
      error
    );


    return res.status(500).json({

      message:
        'Login failed',

    });

  }

};


// ============================================================
// CURRENT USER
// ============================================================

exports.me = async (
  req,
  res
) => {

  try {

    const user =
      await prisma.user.findUnique({

        where: {
          id: req.user.id,
        },

      });


    if (!user) {

      return res.status(404).json({
        message:
          'User not found',
      });

    }


    return res.json({

      id: user.id,

      name: user.name,

      email: user.email,

      role: user.role,

      approvalStatus:
        user.approvalStatus,

    });

  } catch (error) {

    console.error(
      'Me error:',
      error
    );


    return res.status(500).json({

      message:
        'Failed to load user',

    });

  }

};