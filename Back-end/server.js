// server.js — Emotilearn Node.js backend
// Real-time emotion detection via Socket.io + FastAPI TransformerModel
// Enhanced with JWT, CSRF, ETag, Idempotency, and comprehensive error handling

const http = require('http');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// ── Core dependencies ─────────────────────────────────────────────────────────
const { connectToMongoDB } = require('./connection');
const { registerEmotionSocket } = require('./controllers/emotionSocket');

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/report1');
const storeScoresRoutes = require('./routes/storeScores');

// ── Models ────────────────────────────────────────────────────────────────────
const Admin = require('./models/admin');
const Report = require('./models/report');

// ── Security Middleware ───────────────────────────────────────────────────────
const {
  csrfTokenMiddleware,
  csrfVerifyMiddleware,
  getCsrfTokenRoute,
} = require('./middleware/csrfProtection');
const {
  authMiddleware,
  optionalAuthMiddleware,
  adminOnlyMiddleware,
} = require('./middleware/authMiddleware');
const {
  etagMiddleware,
  cacheMiddleware,
  invalidateCacheMiddleware,
} = require('./middleware/etagMiddleware');
const {
  idempotencyMiddleware,
  requireIdempotencyKey,
} = require('./middleware/idempotencyMiddleware');
const {
  validateRequest,
  registerChildSchema,
  loginChildSchema,
  adminLoginSchema,
  storeScoresSchema,
} = require('./middleware/requestValidation');
const { errorHandler, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');

// ── App + HTTP server ─────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Socket.io ─────────────────────────────────────────────────────────────────
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});
registerEmotionSocket(io);

// ── MongoDB ───────────────────────────────────────────────────────────────────
connectToMongoDB(process.env.CONNECTION_STRING)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ── Security Headers ─────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }),
);

// ── CORS Configuration ────────────────────────────────────────────────────────
app.use(
  cors({
    origin: FRONTEND_URL.split(',').map((url) => url.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'Idempotency-Key',
    ],
  }),
);

// ── Body Parser Middleware ────────────────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rate Limiting ────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again after 15 minutes',
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.body?.childname || req.ip,
  validate: { keyGenerator: false },
});

app.use(generalLimiter);

// ── Request Logging Middleware (Development/Debug) ──────────────────────────
if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
  app.use((req, res, next) => {
    const start = Date.now();
    const { method, url, body } = req;

    // Sanitize body to avoid logging plain text passwords
    const sanitizedBody = { ...body };
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.adminPassword) sanitizedBody.adminPassword = '[REDACTED]';

    console.log(`[REQUEST] ${new Date().toISOString()} | ${method} ${url} | IP: ${req.ip}`);
    if (Object.keys(sanitizedBody).length) {
      console.log(`[REQUEST BODY]`, JSON.stringify(sanitizedBody, null, 2));
    }

    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[RESPONSE] ${method} ${url} | Status: ${res.statusCode} | Duration: ${duration}ms`);
    });

    next();
  });
}

// ── CSRF Protection ──────────────────────────────────────────────────────────
app.use(csrfTokenMiddleware);

// ── Optional Auth for Caching ────────────────────────────────────────────────
app.use(optionalAuthMiddleware);

// ── Middleware (order matters!) ───────────────────────────────────────────────
app.use(etagMiddleware);
app.use(idempotencyMiddleware);

// ── Health Checks ────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

app.get('/health/db', asyncHandler(async (req, res) => {
  const mongoStatus = await Report.findOne({}).lean();
  res.json({
    status: 'ok',
    database: 'connected',
    collections: 'accessible',
  });
}));

app.get('/health/ai', asyncHandler(async (req, res) => {
  // Check AI service health
  const fetch = (await import('node-fetch')).default;
  try {
    const response = await fetch(`${process.env.AI_SERVICE_URL}/health`, {
      timeout: 5000,
    });
    const data = await response.json();
    res.json({ status: 'ok', aiService: data });
  } catch (err) {
    res.status(503).json({ error: 'AI service unavailable' });
  }
}));

// ── CSRF Token Endpoint ───────────────────────────────────────────────────────
app.get('/csrf-token', getCsrfTokenRoute);

// ── Public Routes (no auth required) ──────────────────────────────────────────
app.post(
  '/register',
  authLimiter,
  validateRequest(registerChildSchema, 'body'),
  csrfVerifyMiddleware,
  require('./routes/authRoutes').registerChild,
);

app.post(
  '/login',
  authLimiter,
  validateRequest(loginChildSchema, 'body'),
  csrfVerifyMiddleware,
  require('./routes/authRoutes').loginChild,
);

app.post(
  '/admin/login',
  authLimiter,
  validateRequest(adminLoginSchema, 'body'),
  csrfVerifyMiddleware,
  require('./routes/authRoutes').adminLogin,
);

// ── Protected Routes ──────────────────────────────────────────────────────────
app.get('/profile', authMiddleware, require('./routes/authRoutes').getProfile);

app.post(
  '/logout',
  authMiddleware,
  csrfVerifyMiddleware,
  require('./routes/authRoutes').logoutChild,
);

// ── Reports Routes ───────────────────────────────────────────────────────────
app.get('/reports/children', authMiddleware, adminOnlyMiddleware, 
  cacheMiddleware(300), // Cache for 5 minutes
  asyncHandler(async (req, res) => {
    const children = await Report.find(
      {},
      'childname sessions.sessionId sessions.sessiondate sessions.isProcessed sessions.scores',
    );
    res.json(children);
  }),
);

app.get('/reports/report/:childname', authMiddleware, 
  cacheMiddleware(600), // Cache for 10 minutes
  asyncHandler(async (req, res) => {
    const { childname } = req.params;
    const report = await Report.findOne({ childname });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(report);
  }),
);

// Mount reportRoutes to expose specific session details (GET /reports/:childName/:sessionID)
app.use('/reports', authMiddleware, reportRoutes);

// ── Store Scores ──────────────────────────────────────────────────────────────
app.use('/store-scores', authMiddleware, csrfVerifyMiddleware, storeScoresRoutes);

// ── Children Management (Admin only) ──────────────────────────────────────────
app.get(
  '/children',
  authMiddleware,
  adminOnlyMiddleware,
  cacheMiddleware(300),
  asyncHandler(async (req, res) => {
    const children = await Report.find(
      {},
      'childname sessions.sessionId sessions.sessiondate sessions.isProcessed sessions.scores',
    );
    res.json(children);
  }),
);

app.post(
  '/children',
  authMiddleware,
  adminOnlyMiddleware,
  csrfVerifyMiddleware,
  invalidateCacheMiddleware,
  requireIdempotencyKey,
  idempotencyMiddleware,
  asyncHandler(async (req, res) => {
    const newChild = new Report(req.body);
    await newChild.save();
    res.status(201).json(newChild);
  }),
);

app.put(
  '/children/:id',
  authMiddleware,
  adminOnlyMiddleware,
  csrfVerifyMiddleware,
  invalidateCacheMiddleware,
  asyncHandler(async (req, res) => {
    const updated = await Report.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  }),
);

app.delete(
  '/children/:id',
  authMiddleware,
  adminOnlyMiddleware,
  csrfVerifyMiddleware,
  invalidateCacheMiddleware,
  asyncHandler(async (req, res) => {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Child deleted successfully' });
  }),
);

// ── Session Management ────────────────────────────────────────────────────────
app.patch(
  '/sessions/:childId/:sessionId',
  authMiddleware,
  adminOnlyMiddleware,
  csrfVerifyMiddleware,
  invalidateCacheMiddleware,
  asyncHandler(async (req, res) => {
    const { childId, sessionId } = req.params;
    const { isProcessed } = req.body;

    const child = await Report.findById(childId);
    if (!child) return res.status(404).json({ message: 'Child not found' });

    const session = child.sessions.id(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    session.isProcessed = isProcessed;
    await child.save();

    res.json(child);
  }),
);

// ── Admin Management ──────────────────────────────────────────────────────────
app.get(
  '/admins',
  authMiddleware,
  adminOnlyMiddleware,
  cacheMiddleware(300),
  asyncHandler(async (req, res) => {
    const admins = await Admin.find({});
    res.json(admins);
  }),
);

app.post(
  '/admins',
  authMiddleware,
  adminOnlyMiddleware,
  csrfVerifyMiddleware,
  invalidateCacheMiddleware,
  requireIdempotencyKey,
  idempotencyMiddleware,
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Admin name is required',
      });
    }

    // Check if name is already taken by an admin
    const existingAdmin = await Admin.findOne({ name });
    if (existingAdmin) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Admin name already exists',
      });
    }

    // Check if name is already taken by a child
    const existingChild = await Report.findOne({ childname: name });
    if (existingChild) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Name is already taken by a child',
      });
    }

    const newAdmin = new Admin(req.body);
    await newAdmin.save();
    res.status(201).json(newAdmin);
  }),
);

app.delete(
  '/admins/:id',
  authMiddleware,
  adminOnlyMiddleware,
  csrfVerifyMiddleware,
  invalidateCacheMiddleware,
  asyncHandler(async (req, res) => {
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ message: 'Admin deleted successfully' });
  }),
);

// ── Static Files ──────────────────────────────────────────────────────────────
app.use('/photos', express.static(path.join(__dirname, 'photos')));

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use(notFoundHandler);

// ── Error Handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
    🚀 Emotilearn Backend Started
    ├─ HTTP: http://localhost:${PORT}
    ├─ WebSocket: ws://localhost:${PORT}
    ├─ Environment: ${process.env.NODE_ENV || 'development'}
    ├─ Database: ${process.env.CONNECTION_STRING?.split('@')[1] || 'MongoDB'}
    ├─ Security Features:
    │  ├─ JWT Authentication ✅
    │  ├─ CSRF Protection ✅
    │  ├─ ETag Caching ✅
    │  ├─ Idempotency ✅
    │  ├─ Rate Limiting ✅
    │  └─ Request Validation ✅
    └─ Health: http://localhost:${PORT}/health
  `);
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('SIGTERM received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };

