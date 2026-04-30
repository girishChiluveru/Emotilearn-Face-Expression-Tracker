/**
 * idempotencyMiddleware.js
 * =======================
 * Idempotency pattern implementation
 * Ensures duplicate requests return same result
 * Critical for payment, transaction, and state-changing operations
 */

/**
 * In-memory idempotency store
 * In production, use Redis with TTL
 */
class IdempotencyStore {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
  }

  set(key, value, ttl = 86400) {
    // Store result
    this.store.set(key, {
      statusCode: value.statusCode,
      body: value.body,
      timestamp: Date.now(),
    });

    // Clear old timeout
    if (this.ttls.has(key)) {
      clearTimeout(this.ttls.get(key));
    }

    // Set expiration (24 hours default)
    const timeout = setTimeout(() => {
      this.store.delete(key);
      this.ttls.delete(key);
    }, ttl * 1000);

    this.ttls.set(key, timeout);
  }

  get(key) {
    return this.store.get(key);
  }

  has(key) {
    return this.store.has(key);
  }

  delete(key) {
    if (this.ttls.has(key)) {
      clearTimeout(this.ttls.get(key));
      this.ttls.delete(key);
    }
    this.store.delete(key);
  }
}

const idempotencyStore = new IdempotencyStore();

/**
 * Idempotency middleware
 * Tracks and replays responses for duplicate requests
 * 
 * Usage:
 * - Client sends 'Idempotency-Key' header with unique request ID
 * - Server stores result with this key
 * - Duplicate requests return cached result
 */
function idempotencyMiddleware(req, res, next) {
  const idempotencyKey = req.headers['idempotency-key'];

  // Only apply to state-changing requests
  if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return next();
  }

  // If no idempotency key, proceed normally (not idempotent)
  if (!idempotencyKey) {
    return next();
  }

  // Validate idempotency key format (should be UUID or similar)
  if (!/^[a-f0-9\-]{36}$/.test(idempotencyKey) && idempotencyKey.length < 10) {
    return res.status(400).json({
      error: 'Invalid Idempotency-Key',
      message: 'Idempotency-Key must be a valid UUID or unique identifier',
    });
  }

  // Generate cache key (include method, path, and user)
  const cacheKey = `${req.method}:${req.path}:${req.user?.id || 'anonymous'}:${idempotencyKey}`;

  // Check if request was already processed
  if (idempotencyStore.has(cacheKey)) {
    const cached = idempotencyStore.get(cacheKey);
    res.setHeader('Idempotency-Replay', 'true');
    return res.status(cached.statusCode).json(cached.body);
  }

  // Store original res.json and res.status
  const originalJson = res.json.bind(res);
  const originalStatus = res.status.bind(res);
  let statusCode = 200;

  // Override status to capture it
  res.status = function (code) {
    statusCode = code;
    return originalStatus(code);
  };

  // Override json to store response
  res.json = function (data) {
    // Store for idempotency
    idempotencyStore.set(cacheKey, {
      statusCode,
      body: data,
    });

    res.setHeader('Idempotency-Key', idempotencyKey);
    return originalJson(data);
  };

  next();
}

/**
 * Idempotency key validation middleware
 * Ensures idempotency key is present for critical operations
 */
function requireIdempotencyKey(req, res, next) {
  // Only apply to state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    if (!req.headers['idempotency-key']) {
      return res.status(400).json({
        error: 'Missing Idempotency-Key',
        message: 'Idempotency-Key header is required for this operation',
        example: 'Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000',
      });
    }
  }

  next();
}

module.exports = {
  idempotencyMiddleware,
  requireIdempotencyKey,
  IdempotencyStore,
  idempotencyStore,
};
