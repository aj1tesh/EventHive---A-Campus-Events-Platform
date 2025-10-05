/**
 * Registrations routes
 * Handles event registration and approval/rejection
 */

const express = require('express');
const { query } = require('../database/connection');
const { authenticateToken, requireStudent, requireOrganizer, requireOwnershipOrAdmin } = require('../middleware/auth');
const { validate, validateParams, registrationStatusSchema } = require('../utils/validation');

const router = express.Router();

/**
 * Get user's registrations
 * GET /api/registrations
 */
router.get('/', authenticateToken, requireStudent, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    let whereClause = 'WHERE r.user_id = $1';
    const params = [userId];
    let paramCount = 2;

    if (status) {
      whereClause += ` AND r.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM registrations r
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get registrations with event details
    const registrationsQuery = `
      SELECT 
        r.id,
        r.status,
        r.registered_at,
        r.updated_at,
        e.id as event_id,
        e.title as event_title,
        e.description as event_description,
        e.date as event_date,
        e.location as event_location,
        e.max_attendees,
        u.username as organizer_username
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN users u ON e.created_by = u.id
      ${whereClause}
      ORDER BY r.registered_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    params.push(limit, offset);
    const registrationsResult = await query(registrationsQuery, params);

    const registrations = registrationsResult.rows.map(reg => ({
      id: reg.id,
      status: reg.status,
      registered_at: reg.registered_at,
      updated_at: reg.updated_at,
      event: {
        id: reg.event_id,
        title: reg.event_title,
        description: reg.event_description,
        date: reg.event_date,
        location: reg.event_location,
        max_attendees: parseInt(reg.max_attendees),
        organizer_username: reg.organizer_username
      }
    }));

    res.json({
      success: true,
      data: {
        registrations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching registrations'
    });
  }
});

/**
 * Register for an event
 * POST /api/registrations
 */
router.post('/', authenticateToken, requireStudent, async (req, res) => {
  try {
    const { event_id } = req.body;
    const userId = req.user.id;

    if (!event_id) {
      return res.status(400).json({
        success: false,
        message: 'Event ID is required'
      });
    }

    // Check if event exists and is upcoming
    const eventResult = await query(
      'SELECT id, title, date, max_attendees FROM events WHERE id = $1',
      [event_id]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const event = eventResult.rows[0];

    // Check if event is in the past
    if (new Date(event.date) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot register for past events'
      });
    }

    // Check if user is already registered
    const existingRegistration = await query(
      'SELECT id, status FROM registrations WHERE event_id = $1 AND user_id = $2',
      [event_id, userId]
    );

    if (existingRegistration.rows.length > 0) {
      const reg = existingRegistration.rows[0];
      return res.status(409).json({
        success: false,
        message: `Already registered for this event with status: ${reg.status}`
      });
    }

    // Check if event is full
    const attendeesCount = await query(
      'SELECT COUNT(*) as count FROM registrations WHERE event_id = $1 AND status = $2',
      [event_id, 'approved']
    );

    const currentAttendees = parseInt(attendeesCount.rows[0].count);
    if (currentAttendees >= event.max_attendees) {
      return res.status(400).json({
        success: false,
        message: 'Event is full'
      });
    }

    // Create registration
    const result = await query(
      `INSERT INTO registrations (event_id, user_id, status) 
       VALUES ($1, $2, 'pending') 
       RETURNING id, event_id, user_id, status, registered_at`,
      [event_id, userId]
    );

    const registration = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Successfully registered for the event',
      data: { registration }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

/**
 * Cancel registration
 * DELETE /api/registrations/:id
 */
router.delete('/:id', authenticateToken, requireStudent, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if registration exists and belongs to user
    const registrationResult = await query(
      'SELECT id FROM registrations WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (registrationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Delete registration
    await query('DELETE FROM registrations WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Registration cancelled successfully'
    });

  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while cancelling registration'
    });
  }
});

/**
 * Get registrations for events created by current user (organizer/admin)
 * GET /api/registrations/manage
 */
router.get('/manage', authenticateToken, requireOrganizer, async (req, res) => {
  try {
    const { page = 1, limit = 10, event_id, status } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    let whereClause = 'WHERE e.created_by = $1';
    const params = [userId];
    let paramCount = 2;

    if (event_id) {
      whereClause += ` AND r.event_id = $${paramCount}`;
      params.push(event_id);
      paramCount++;
    }

    if (status) {
      whereClause += ` AND r.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get registrations with user and event details
    const registrationsQuery = `
      SELECT 
        r.id,
        r.status,
        r.registered_at,
        r.updated_at,
        r.event_id,
        e.title as event_title,
        e.date as event_date,
        u.id as user_id,
        u.username as user_username,
        u.email as user_email
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      JOIN users u ON r.user_id = u.id
      ${whereClause}
      ORDER BY r.registered_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    params.push(limit, offset);
    const registrationsResult = await query(registrationsQuery, params);

    const registrations = registrationsResult.rows.map(reg => ({
      id: reg.id,
      status: reg.status,
      registered_at: reg.registered_at,
      updated_at: reg.updated_at,
      event_id: reg.event_id,
      event_title: reg.event_title,
      event_date: reg.event_date,
      user: {
        id: reg.user_id,
        username: reg.user_username,
        email: reg.user_email
      }
    }));

    res.json({
      success: true,
      data: {
        registrations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get managed registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching registrations'
    });
  }
});

/**
 * Update registration status (approve/reject)
 * PUT /api/registrations/:id/status
 */
router.put('/:id/status', 
  authenticateToken, 
  requireOrganizer, 
  validate(registrationStatusSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Get registration with event details
      const registrationResult = await query(
        `SELECT r.id, r.event_id, r.user_id, r.status, e.created_by, e.title as event_title
         FROM registrations r
         JOIN events e ON r.event_id = e.id
         WHERE r.id = $1`,
        [id]
      );

      if (registrationResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found'
        });
      }

      const registration = registrationResult.rows[0];

      // Check if user can manage this registration
      if (req.user.role !== 'admin' && registration.created_by !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only manage registrations for your own events'
        });
      }

      // Check if event is full (only for approval)
      if (status === 'approved') {
        const attendeesCount = await query(
          'SELECT COUNT(*) as count FROM registrations WHERE event_id = $1 AND status = $2',
          [registration.event_id, 'approved']
        );

        const eventResult = await query(
          'SELECT max_attendees FROM events WHERE id = $1',
          [registration.event_id]
        );

        const currentAttendees = parseInt(attendeesCount.rows[0].count);
        const maxAttendees = parseInt(eventResult.rows[0].max_attendees);

        if (currentAttendees >= maxAttendees) {
          return res.status(400).json({
            success: false,
            message: 'Event is full, cannot approve more registrations'
          });
        }
      }

      // Update registration status
      const updateResult = await query(
        `UPDATE registrations 
         SET status = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING id, event_id, user_id, status, registered_at, updated_at`,
        [status, id]
      );

      const updatedRegistration = updateResult.rows[0];

      res.json({
        success: true,
        message: `Registration ${status} successfully`,
        data: { registration: updatedRegistration }
      });

    } catch (error) {
      console.error('Update registration status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating registration status'
      });
    }
  }
);

/**
 * Bulk update registration statuses
 * PUT /api/registrations/bulk-status
 */
router.put('/bulk-status', 
  authenticateToken, 
  requireOrganizer, 
  async (req, res) => {
    try {
      const { registration_ids, status } = req.body;

      if (!Array.isArray(registration_ids) || registration_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Registration IDs array is required'
        });
      }

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be pending, approved, or rejected'
        });
      }

      const client = await query.getClient();
      
      try {
        await client.query('BEGIN');

        // Verify all registrations belong to events created by the user (or admin)
        const verifyQuery = `
          SELECT r.id, r.event_id, e.created_by
          FROM registrations r
          JOIN events e ON r.event_id = e.id
          WHERE r.id = ANY($1)
        `;
        
        const verifyResult = await client.query(verifyQuery, [registration_ids]);
        
        if (req.user.role !== 'admin') {
          const unauthorizedRegs = verifyResult.rows.filter(
            reg => reg.created_by !== req.user.id
          );
          
          if (unauthorizedRegs.length > 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({
              success: false,
              message: 'You can only manage registrations for your own events'
            });
          }
        }

        // Update all registrations
        const updateResult = await client.query(
          `UPDATE registrations 
           SET status = $1, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ANY($2) 
           RETURNING id, event_id, user_id, status`,
          [status, registration_ids]
        );

        await client.query('COMMIT');

        res.json({
          success: true,
          message: `${updateResult.rows.length} registration(s) updated successfully`,
          data: {
            updated_count: updateResult.rows.length,
            status,
            registrations: updateResult.rows
          }
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Bulk update registration status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while bulk updating registrations'
      });
    }
  }
);

module.exports = router;
