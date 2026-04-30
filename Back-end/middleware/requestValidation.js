/**
 * requestValidation.js
 * ====================
 * Comprehensive request validation schemas using Joi
 * Ensures data integrity across all API endpoints
 */

const Joi = require('joi');

// ============ AUTH SCHEMAS ============

const registerChildSchema = Joi.object({
  childname: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.empty': 'Child name is required',
      'string.alphanum': 'Child name must contain only letters and numbers',
      'string.min': 'Child name must be at least 3 characters',
      'string.max': 'Child name cannot exceed 30 characters',
    }),
  password: Joi.string()
    .min(8)
    .max(50)
    .required()
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    )
    .messages({
      'string.pattern.base':
        'Password must contain uppercase, lowercase, number, and special character',
      'string.min': 'Password must be at least 8 characters',
      'string.max': 'Password cannot exceed 50 characters',
    }),
}).unknown(false);

const loginChildSchema = Joi.object({
  childname: Joi.string()
    .alphanum()
    .required()
    .messages({
      'string.empty': 'Child name is required',
    }),
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required',
    }),
}).unknown(false);

const adminLoginSchema = Joi.object({
  id: Joi.string()
    .required()
    .messages({
      'string.empty': 'Admin ID is required',
    }),
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required',
    }),
}).unknown(false);

// ============ EMOTION DATA SCHEMAS ============

const emotionEventSchema = Joi.object({
  gameId: Joi.string()
    .valid('quiz', 'animal', 'memory')
    .required()
    .messages({
      'any.only': 'gameId must be one of: quiz, animal, memory',
    }),
  qid: Joi.string()
    .required()
    .messages({
      'string.empty': 'Question ID is required',
    }),
  emotions: Joi.object({
    angry: Joi.number().min(0).max(1).required(),
    disgust: Joi.number().min(0).max(1).required(),
    fear: Joi.number().min(0).max(1).required(),
    happy: Joi.number().min(0).max(1).required(),
    neutral: Joi.number().min(0).max(1).required(),
    sad: Joi.number().min(0).max(1).required(),
  })
    .required()
    .messages({
      'object.base': 'Emotions must be an object',
    }),
  dominant_emotion: Joi.string()
    .valid('angry', 'disgust', 'fear', 'happy', 'neutral', 'sad')
    .required(),
  dominant_score: Joi.number()
    .min(0)
    .max(1)
    .required(),
}).unknown(false);

const storeScoresSchema = Joi.object({
  sessionId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid session ID format',
    }),
  gameType: Joi.string()
    .valid('quiz', 'memory', 'animal')
    .required()
    .messages({
      'any.only': 'Game type must be one of: quiz, memory, animal',
    }),
  score: Joi.number()
    .integer()
    .min(0)
    .max(10000)
    .required()
    .messages({
      'number.max': 'Score cannot exceed 10000',
    }),
  duration: Joi.number()
    .integer()
    .min(1)
    .max(3600)
    .optional()
    .messages({
      'number.max': 'Duration cannot exceed 1 hour (3600 seconds)',
    }),
}).unknown(false);

// ============ REPORT SCHEMAS ============

const reportQuerySchema = Joi.object({
  childname: Joi.string()
    .alphanum()
    .optional(),
  startDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'Invalid date format for startDate',
    }),
  endDate: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'Invalid date format for endDate',
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20),
  skip: Joi.number()
    .integer()
    .min(0)
    .optional()
    .default(0),
}).unknown(false);

// ============ CHILD MANAGEMENT SCHEMAS ============

const childUpdateSchema = Joi.object({
  childname: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .optional(),
  password: Joi.string()
    .min(8)
    .max(50)
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    )
    .optional(),
  status: Joi.string()
    .valid('active', 'inactive', 'suspended')
    .optional(),
}).unknown(false);

// ============ WEBSOCKET SCHEMAS ============

const landmarkSchema = Joi.object({
  landmarks: Joi.array()
    .items(Joi.number().min(-1).max(1))
    .length(1404)
    .required()
    .messages({
      'array.length': 'Landmarks must contain exactly 1404 values',
    }),
  gameId: Joi.string()
    .valid('quiz', 'animal', 'memory')
    .required(),
  qid: Joi.string()
    .required(),
}).unknown(false);

const sessionJoinSchema = Joi.object({
  childname: Joi.string()
    .alphanum()
    .required(),
  sessionId: Joi.string()
    .uuid()
    .required(),
}).unknown(false);

// ============ VALIDATION MIDDLEWARE ============

/**
 * Create validation middleware
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} source - Where to validate: 'body', 'query', 'params'
 */
function validateRequest(schema, source = 'body') {
  return (req, res, next) => {
    const toValidate = source === 'body' ? req.body : req[source];

    const { error, value } = schema.validate(toValidate, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
        type: d.type,
      }));
      return res.status(400).json({
        error: 'Validation failed',
        details,
      });
    }

    // Replace original data with validated data
    if (source === 'body') {
      req.body = value;
    } else {
      req[source] = value;
    }

    req.validatedData = value;
    next();
  };
}

module.exports = {
  // Schemas
  registerChildSchema,
  loginChildSchema,
  adminLoginSchema,
  emotionEventSchema,
  storeScoresSchema,
  reportQuerySchema,
  childUpdateSchema,
  landmarkSchema,
  sessionJoinSchema,

  // Middleware factory
  validateRequest,
};
