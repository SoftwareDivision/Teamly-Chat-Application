// Redis configuration for caching
const redis = require('redis');

let client = null;

const connectRedis = async () => {
  // Only use Redis if configured
  if (!process.env.REDIS_HOST) {
    console.log('⚠️ Redis not configured, caching disabled');
    return null;
  }

  try {
    client = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    client.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });

    client.on('connect', () => {
      console.log('✅ Redis connected');
    });

    await client.connect();
    return client;
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    return null;
  }
};

// Cache helper functions
const cache = {
  // Get value from cache
  async get(key) {
    if (!client) return null;
    try {
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  },

  // Set value in cache with expiry (in seconds)
  async set(key, value, expirySeconds = 300) {
    if (!client) return false;
    try {
      await client.setEx(key, expirySeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  },

  // Delete key from cache
  async del(key) {
    if (!client) return false;
    try {
      await client.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  },

  // Delete multiple keys matching pattern
  async delPattern(pattern) {
    if (!client) return false;
    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Redis delPattern error:', error);
      return false;
    }
  },

  // Check if key exists
  async exists(key) {
    if (!client) return false;
    try {
      return await client.exists(key);
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  },
};

module.exports = { connectRedis, cache };
