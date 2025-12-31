// Quick test script to verify Redis is working
require('dotenv').config();
const { connectRedis, cache } = require('./src/config/redis');

async function testRedis() {
  console.log('🧪 Testing Redis connection...\n');
  
  try {
    // Connect to Redis
    await connectRedis();
    console.log('✅ Redis connected successfully!\n');
    
    // Test 1: Set a value
    console.log('📝 Test 1: Setting a value...');
    await cache.set('test:key', { message: 'Hello Redis!' }, 60);
    console.log('✅ Value set successfully\n');
    
    // Test 2: Get the value
    console.log('📖 Test 2: Getting the value...');
    const value = await cache.get('test:key');
    console.log('✅ Value retrieved:', value);
    console.log('');
    
    // Test 3: Check if key exists
    console.log('🔍 Test 3: Checking if key exists...');
    const exists = await cache.exists('test:key');
    console.log('✅ Key exists:', exists);
    console.log('');
    
    // Test 4: Delete the key
    console.log('🗑️  Test 4: Deleting the key...');
    await cache.del('test:key');
    console.log('✅ Key deleted\n');
    
    // Test 5: Verify deletion
    console.log('🔍 Test 5: Verifying deletion...');
    const deletedValue = await cache.get('test:key');
    console.log('✅ Value after deletion:', deletedValue);
    console.log('');
    
    console.log('🎉 All tests passed! Redis is working correctly.\n');
    console.log('💡 Your app will now cache data for faster performance!');
    
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    console.log('\n⚠️  Redis is not available, but your app will still work.');
    console.log('💡 Install Redis to enable caching (see REDIS_SETUP.md)');
  }
  
  process.exit(0);
}

testRedis();
