import Redis from 'ioredis'

let redisClient: Redis | undefined

if (process.env.REDIS_URI) {
  // Dùng URI từ Redis Cloud hoặc Render
  redisClient = new Redis(process.env.REDIS_URI, {
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
  })
} else if (process.env.REDIS_HOST) {
  // Dùng host + port local hoặc remote rời
  redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times: number) => Math.min(times * 50, 2000),
  })
} else {
  // Không có cấu hình Redis -> Không khởi tạo
  console.log('⚠️ No Redis configuration found. Using MemoryStore for sessions.')
  redisClient = undefined
}

if (redisClient) {
  redisClient.on('connect', () => console.log('✅ Redis connected'))
  redisClient.on('error', (err) => console.error('❌ Redis error:', err))
}

export default redisClient
