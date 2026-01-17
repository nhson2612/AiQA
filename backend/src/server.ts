require('dotenv').config()
import 'reflect-metadata'
import './types'
import express from 'express'
import cors from 'cors'
import { RedisStore } from 'connect-redis'
import helmet from 'helmet'
import { AppDataSource } from './config/database'
import redisClient from './config/redis'
import routes from './routes'
import logger, {
  errorLogger,
  requestLogger,
  withRequestId,
  AppError,
} from './services/logger.service'
const session = require('express-session')

const app = express()
app.set('trust proxy', 1) // Trust first proxy (Cloud Run Load Balancer)
const PORT = process.env.PORT || 8000


// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)

const getNormalizedOrigins = () => {
  const envOrigins = process.env.CORS_ORIGIN
  // Log the raw env var for debugging
  console.log('[DEBUG CORS] ENV CORS_ORIGIN raw:', JSON.stringify(envOrigins))

  if (!envOrigins) return ['http://localhost:5173']

  return envOrigins.split(/[,;]/).map((origin) => {
    // Normalize: lowercase, trim, remove trailing slash
    return origin.trim().toLowerCase().replace(/\/$/, '')
  })
}

app.use(
  cors({
    origin: (requestOrigin, callback) => {
      // Log incoming request origin
      console.log('[DEBUG CORS] Incoming Request Origin:', requestOrigin)

      // Allow requests with no origin (like mobile apps or curl requests)
      if (!requestOrigin) return callback(null, true)

      const allowedOrigins = getNormalizedOrigins()
      const normalizedRequestOrigin = requestOrigin.trim().toLowerCase().replace(/\/$/, '')

      console.log('[DEBUG CORS] Normalized Allowed:', allowedOrigins)
      console.log('[DEBUG CORS] Normalized Request:', normalizedRequestOrigin)

      if (allowedOrigins.includes(normalizedRequestOrigin)) {
        callback(null, true)
      } else {
        console.warn(`[CORS] Blocked request from origin: ${requestOrigin}`)
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
    exposedHeaders: ['Set-Cookie', 'X-Request-ID'],
  })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Logging middleware
app.use(withRequestId)
app.use(requestLogger)

const sessionMiddleware = session({
  store: redisClient ? new RedisStore({ client: redisClient as any }) : undefined,
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined,
  },
})

app.use(sessionMiddleware as unknown as express.RequestHandler)

// Routes
app.use('/api', routes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handler
app.use(errorLogger)
app.use((err: AppError, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const statusCode = err.statusCode || 500
  const message = err.isOperational ? err.message : 'Internal server error'
  const errorId = req.requestId

  logger.error({
    errorId,
    message: 'Error response sent',
    statusCode,
    errorMessage: err.message,
    isOperational: err.isOperational,
    context: err.context,
  })

  res.status(statusCode).json({
    error: {
      id: errorId,
      message,
      status: statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  })
})

// Initialize database and start server
const startServer = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
      logger.info('Database connected successfully')
    }

    // Only listen if not in test environment or if we want to explicitly start it
    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`, {
          port: PORT,
          env: process.env.NODE_ENV || 'development',
          allowedOrigins: getNormalizedOrigins(),
        })
      })
    }
  } catch (error) {
    logger.error('Error starting server', { error: (error as Error).message })
    process.exit(1)
  }
}

// Only start the server if this file is run directly
if (require.main === module) {
  startServer()
}

export { startServer }
export default app
