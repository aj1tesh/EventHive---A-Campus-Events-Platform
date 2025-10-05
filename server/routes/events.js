/**
 * Events routes
 * Handles CRUD operations for events
 */

const express = require('express');
const { query } = require('../database/connection');
const { authenticateToken, requireOrganizer, requireOwnershipOrAdmin } = require('../middleware/auth');
const { validate, validateParams, eventSchema } = require('../utils/validation');

const router = express.Router();

/**
 * Get all events with optional filtering
 * GET /api/events
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, upcoming } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];
    let paramCount = 1;

    // Build WHERE clause based on query parameters
    if (search) {
      whereClause += ` WHERE (e.title ILIKE $${paramCount} OR e.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (upcoming === 'true') {
      const condition = whereClause ? ' AND' : ' WHERE';
      whereClause += `${condition} e.date > NOW()`;
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM events e
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get events with registration counts
    const eventsQuery = `
      SELECT 
        e.id,
        e.title,
        e.description,
        e.date,
        e.location,
        e.max_attendees,
        e.created_by,
        e.created_at,
        e.updated_at,
        u.username as created_by_username,
        COUNT(r.id) as current_attendees,
        CASE 
          WHEN e.date > NOW() THEN 'upcoming'
          WHEN e.date <= NOW() THEN 'past'
          ELSE 'unknown'
        END as status
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'approved'
      ${whereClause}
      GROUP BY e.id, u.username
      ORDER BY e.date ASC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    params.push(limit, offset);
    const eventsResult = await query(eventsQuery, params);

    const events = eventsResult.rows.map(event => ({
      ...event,
      current_attendees: parseInt(event.current_attendees),
      max_attendees: parseInt(event.max_attendees),
      is_full: parseInt(event.current_attendees) >= parseInt(event.max_attendees)
    }));

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching events'
    });
  }
});

/**
 * Get event by ID with detailed information
 * GET /api/events/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const eventQuery = `
      SELECT 
        e.id,
        e.title,
        e.description,
        e.date,
        e.location,
        e.max_attendees,
        e.created_by,
        e.created_at,
        e.updated_at,
        u.username as created_by_username,
        COUNT(r.id) as current_attendees,
        CASE 
          WHEN e.date > NOW() THEN 'upcoming'
          WHEN e.date <= NOW() THEN 'past'
          ELSE 'unknown'
        END as status
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'approved'
      WHERE e.id = $1
      GROUP BY e.id, u.username
    `;

    const result = await query(eventQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const event = result.rows[0];
    event.current_attendees = parseInt(event.current_attendees);
    event.max_attendees = parseInt(event.max_attendees);
    event.is_full = event.current_attendees >= event.max_attendees;

    res.json({
      success: true,
      data: { event }
    });

  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching event'
    });
  }
});

/**
 * Create a new event
 * POST /api/events
 */
router.post('/', authenticateToken, requireOrganizer, validate(eventSchema), async (req, res) => {
  try {
    const { title, description, date, location, max_attendees } = req.body;
    const createdBy = req.user.id;

    const result = await query(
      `INSERT INTO events (title, description, date, location, max_attendees, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, title, description, date, location, max_attendees, created_by, created_at, updated_at`,
      [title, description, date, location, max_attendees, createdBy]
    );

    const event = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: { event }
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating event'
    });
  }
});

/**
 * Update an event
 * PUT /api/events/:id
 */
router.put('/:id', 
  authenticateToken, 
  requireOrganizer, 
  requireOwnershipOrAdmin('id', 'events', 'created_by'),
  validate(eventSchema), 
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, date, location, max_attendees } = req.body;

      // Check if event exists
      const existingEvent = await query('SELECT id FROM events WHERE id = $1', [id]);
      if (existingEvent.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      const result = await query(
        `UPDATE events 
         SET title = $1, description = $2, date = $3, location = $4, max_attendees = $5, updated_at = CURRENT_TIMESTAMP
         WHERE id = $6 
         RETURNING id, title, description, date, location, max_attendees, created_by, created_at, updated_at`,
        [title, description, date, location, max_attendees, id]
      );

      const event = result.rows[0];

      res.json({
        success: true,
        message: 'Event updated successfully',
        data: { event }
      });

    } catch (error) {
      console.error('Update event error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating event'
      });
    }
  }
);

/**
 * Delete an event
 * DELETE /api/events/:id
 */
router.delete('/:id', 
  authenticateToken, 
  requireOrganizer, 
  requireOwnershipOrAdmin('id', 'events', 'created_by'),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if event exists
      const existingEvent = await query('SELECT id FROM events WHERE id = $1', [id]);
      if (existingEvent.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      // Delete event (cascade will handle related registrations)
      await query('DELETE FROM events WHERE id = $1', [id]);

      res.json({
        success: true,
        message: 'Event deleted successfully'
      });

    } catch (error) {
      console.error('Delete event error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while deleting event'
      });
    }
  }
);

/**
 * Get events created by the current user
 * GET /api/events/my-events
 */
router.get('/my-events', authenticateToken, requireOrganizer, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as total FROM events WHERE created_by = $1',
      [userId]
    );
    const total = parseInt(countResult.rows[0].total);

    // Get events with registration counts
    const eventsQuery = `
      SELECT 
        e.id,
        e.title,
        e.description,
        e.date,
        e.location,
        e.max_attendees,
        e.created_by,
        e.created_at,
        e.updated_at,
        COUNT(r.id) as current_attendees,
        CASE 
          WHEN e.date > NOW() THEN 'upcoming'
          WHEN e.date <= NOW() THEN 'past'
          ELSE 'unknown'
        END as status
      FROM events e
      LEFT JOIN registrations r ON e.id = r.event_id AND r.status = 'approved'
      WHERE e.created_by = $1
      GROUP BY e.id
      ORDER BY e.date ASC
      LIMIT $2 OFFSET $3
    `;

    const eventsResult = await query(eventsQuery, [userId, limit, offset]);

    const events = eventsResult.rows.map(event => ({
      ...event,
      current_attendees: parseInt(event.current_attendees),
      max_attendees: parseInt(event.max_attendees),
      is_full: parseInt(event.current_attendees) >= parseInt(event.max_attendees)
    }));

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get my events error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching your events'
    });
  }
});

module.exports = router;
