const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');
const { authenticateToken } = require('../middleware/auth');
const { validate, registerSchema, loginSchema } = require('../utils/validation');

const router = express.Router();

router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
      [username, email, passwordHash, role]
    );

    const newUser = result.rows[0];

    const authToken = jwt.sign(
      { userId: newUser.id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET,
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          created_at: newUser.created_at
        },
        token: authToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      'SELECT id, username, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const authToken = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token: authToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { username, email } = req.body;
    const userId = req.user.id;

    if (!username && !email) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (username or email) is required'
      });
    }

    if (username || email) {
      let checkQuery = 'SELECT id FROM users WHERE (';
      const checkParams = [];
      let paramCount = 1;

      if (username) {
        checkQuery += `username = $${paramCount++}`;
        checkParams.push(username);
      }
      if (email) {
        if (username) checkQuery += ' OR ';
        checkQuery += `email = $${paramCount++}`;
        checkParams.push(email);
      }
      checkQuery += `) AND id != $${paramCount}`;
      checkParams.push(userId);

      const existingUser = await query(checkQuery, checkParams);
      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Username or email already exists'
        });
      }
    }

    const updates = [];
    const updateParams = [];
    let paramCount = 1;

    if (username) {
      updates.push(`username = $${paramCount++}`);
      updateParams.push(username);
    }
    if (email) {
      updates.push(`email = $${paramCount++}`);
      updateParams.push(email);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    updateParams.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING id, username, email, role, created_at, updated_at
    `;

    const result = await query(updateQuery, updateParams);
    const updatedUser = result.rows[0];

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during profile update'
    });
  }
});

router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during password change'
    });
  }
});

module.exports = router;
