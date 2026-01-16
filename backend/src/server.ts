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
app.use(helmet())

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173']

app.use(
  cors({
    origin: allowedOrigins,
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
    await AppDataSource.initialize()
    logger.info('Database connected successfully')

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`, {
        port: PORT,
        env: process.env.NODE_ENV || 'development',
        allowedOrigins,
      })
    })
  } catch (error) {
    logger.error('Error starting server', { error: (error as Error).message })
    process.exit(1)
  }
}

startServer()

export default app
