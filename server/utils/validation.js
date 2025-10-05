const Joi = require('joi');

const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must be at most 30 characters long',
      'any.required': 'Username is required'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password must be at most 100 characters long',
      'any.required': 'Password is required'
    }),
  role: Joi.string()
    .valid('student', 'organizer')
    .default('student')
    .messages({
      'any.only': 'Role must be either student or organizer'
    })
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

const eventSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(200)
    .required()
    .messages({
      'string.min': 'Event title must be at least 3 characters long',
      'string.max': 'Event title must be at most 200 characters long',
      'any.required': 'Event title is required'
    }),
  description: Joi.string()
    .max(1000)
    .allow('')
    .messages({
      'string.max': 'Event description must be at most 1000 characters long'
    }),
  date: Joi.date()
    .greater('now')
    .required()
    .messages({
      'date.greater': 'Event date must be in the future',
      'any.required': 'Event date is required'
    }),
  location: Joi.string()
    .max(200)
    .allow('')
    .messages({
      'string.max': 'Location must be at most 200 characters long'
    }),
  max_attendees: Joi.number()
    .integer()
    .min(1)
    .max(10000)
    .default(100)
    .messages({
      'number.min': 'Maximum attendees must be at least 1',
      'number.max': 'Maximum attendees cannot exceed 10000',
      'number.integer': 'Maximum attendees must be a whole number'
    })
});

const registrationStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'approved', 'rejected')
    .required()
    .messages({
      'any.only': 'Status must be pending, approved, or rejected',
      'any.required': 'Status is required'
    })
});

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages
      });
    }

    req.body = value;
    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: error.details.map(detail => detail.message)
      });
    }

    req.params = value;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: error.details.map(detail => detail.message)
      });
    }

    req.query = value;
    next();
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  eventSchema,
  registrationStatusSchema,
  validate,
  validateParams,
  validateQuery
};
