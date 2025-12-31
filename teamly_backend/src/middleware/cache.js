// Caching middleware for API responses
const { cache } = require('../config/redis');

// Cache middleware - use on routes that can be cached
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL and user ID
    const userId = req.user?.userId || 'anonymous';
    const cacheKey = `cache:${userId}:${req.originalUrl}`;

    try {
      // Try to get from cache
      const cachedData = await cache.get(cacheKey);
      
      if (cachedData) {
        console.log(`✅ Cache HIT: ${cacheKey}`);
        return res.json(cachedData);
      }

      console.log(`❌ Cache MISS: ${cacheKey}`);

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = (data) => {
        // Only cache successful responses
        if (res.statusCode === 200 && data.success !== false) {
          cache.set(cacheKey, data, duration).catch(console.error);
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Invalidate cache for specific patterns
const invalidateCache = async (pattern) => {
  try {
    await cache.delPattern(pattern);
    console.log(`🗑️ Cache invalidated: ${pattern}`);
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

module.exports = { cacheMiddleware, invalidateCache };
