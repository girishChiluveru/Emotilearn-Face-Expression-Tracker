/**
 * etagMiddleware.js
 * ================
 * ETag-based HTTP caching for optimized performance
 * Reduces bandwidth and improves response times
 */

const crypto = require('crypto');

/**
 * Generate ETag hash from content
 * @param {string} content - Content to hash
 * @returns {string} ETag value
 */
function generateETag(content) {
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(content))
    .digest('hex')
    .substring(0, 16);
  return `"${hash}"`;
}

/**
 * ETag middleware - adds ETag to responses
 * Should be applied to GET requests that return JSON
 */
function etagMiddleware(req, res, next) {
  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to add ETag
  res.json = function (data) {
    // Generate ETag for response
    const etag = generateETag(data);
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'private, max-age=300'); // 5 min cache

    // Check if-none-match header
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch === etag) {
      // Content hasn't changed
      return res.status(304).end(); // Not Modified
    }

    // Content changed, send full response
    return originalJson(data);
  };

  next();
}

/**
 * Cache key generator for caching responses
 * @param {Object} req - Express request
 * @returns {string} Cache key
 */
function generateCacheKey(req) {
  return `${req.method}:${req.originalUrl}:${req.user?.id || 'anonymous'}`;
}

/**
 * In-memory cache store
 * In production, use Redis
 */
class CacheStore {
  constructor() {
    this.store = new Map();
    this.ttls = new Map();
  }

  set(key, value, ttl = 300) {
    this.store.set(key, value);
    
    // Clear old timeout if exists
    if (this.ttls.has(key)) {
      clearTimeout(this.ttls.get(key));
    }

    // Set new timeout
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

  clear() {
    for (const timeout of this.ttls.values()) {
      clearTimeout(timeout);
    }
    this.store.clear();
    this.ttls.clear();
  }
}

const cacheStore = new CacheStore();

/**
 * Response caching middleware
 * @param {number} ttl - Time to live in seconds
 */
function cacheMiddleware(ttl = 300) {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = generateCacheKey(req);

    // Check cache
    if (cacheStore.has(cacheKey)) {
      const cachedData = cacheStore.get(cacheKey);
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    // Store original json
    const originalJson = res.json.bind(res);

    // Override json to cache response
    res.json = function (data) {
      cacheStore.set(cacheKey, data, ttl);
      res.setHeader('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
}

/**
 * Cache invalidation middleware
 * Clears cache on state-changing requests
 */
function invalidateCacheMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    // Clear related cache entries
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      // Clear all cache for this resource type
      for (const key of cacheStore.store.keys()) {
        // Simple invalidation: clear cache if URL pattern matches
        if (key.includes(req.baseUrl)) {
          cacheStore.delete(key);
        }
      }
    }

    return originalJson(data);
  };

  next();
}

module.exports = {
  generateETag,
  etagMiddleware,
  cacheMiddleware,
  invalidateCacheMiddleware,
  generateCacheKey,
  CacheStore,
  cacheStore,
};
