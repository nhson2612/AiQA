import { createLogger, format, transports, Logger } from 'winston'
import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

// Custom log levels
export const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  verbose: 4,
}

// Custom log format
export const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json()
)

// Create logger instance
let logger: Logger

if (process.env.NODE_ENV === 'production') {
  logger = createLogger({
    level: 'info',
    levels: logLevels,
    format: logFormat,
    transports: [
      new transports.Console(),
      new transports.File({ filename: 'logs/error.log', level: 'error' }),
      new transports.File({ filename: 'logs/combined.log' }),
    ],
    exceptionHandlers: [
      new transports.File({ filename: 'logs/exceptions.log' }),
    ],
    rejectionHandlers: [
      new transports.File({ filename: 'logs/rejections.log' }),
    ],
  })
} else {
  logger = createLogger({
    level: 'debug',
    levels: logLevels,
    format: format.combine(
      format.colorize(),
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.errors({ stack: true }),
      format.splat(),
      format.printf((info: any) => {
        const { level, message, timestamp, stack } = info;
        return `${timestamp} [${level}]: ${stack || message}`
      })
    ),
    transports: [
      new transports.Console(),
    ],
  })
}

// Add request ID to logger
export const withRequestId = (req: Request, res: Response, next: NextFunction) => {
  const HEADER_ID = req.headers['x-request-id'];
  const requestId = Array.isArray(HEADER_ID) ? HEADER_ID[0] : (HEADER_ID || uuidv4());

  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  const { method, originalUrl, headers, body, query, params } = req
  const userAgent = headers['user-agent']
  const ip = req.ip || req.connection.remoteAddress

  // Log request start
  logger.info({
    requestId: req.requestId,
    message: 'Request started',
    method,
    path: originalUrl,
    ip,
    userAgent,
    query,
    params,
    body: method !== 'GET' ? body : undefined,
  })

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.info({
      requestId: req.requestId,
      message: 'Request completed',
      method,
      path: originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip,
      userAgent,
    })
  })

  next()
}

// Error logging middleware
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const { method, originalUrl, headers, body, query, params } = req
  const userAgent = headers['user-agent']
  const ip = req.ip || req.connection.remoteAddress

  logger.error({
    requestId: req.requestId,
    message: 'Unhandled error',
    error: err.message,
    stack: err.stack,
    method,
    path: originalUrl,
    ip,
    userAgent,
    query,
    params,
    body: method !== 'GET' ? body : undefined,
  })

  next(err)
}

// Custom error classes
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
    public context?: any
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

// Validation error
export class ValidationError extends AppError {
  constructor(public errors: Record<string, string>) {
    super('Validation failed', 400, true, { errors })
  }
}

// Authentication error
export class AuthError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, true)
  }
}

// Not found error
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(`${resource} not found${id ? ` with ID: ${id}` : ''}`, 404, true)
  }
}

// Database error
export class DatabaseError extends AppError {
  constructor(message: string, public originalError?: Error) {
    super(message, 500, false, { originalError })
  }
}

// External API error
export class ExternalAPIError extends AppError {
  constructor(
    public service: string,
    public statusCode: number,
    public response?: any
  ) {
    super(`External API error: ${service}`, statusCode, false, { response })
  }
}

// Logger wrapper with request context
export const createContextLogger = (req: Request) => {
  return {
    info: (message: string, context?: any) => {
      logger.info({
        requestId: req.requestId,
        message,
        ...context,
      })
    },
    debug: (message: string, context?: any) => {
      logger.debug({
        requestId: req.requestId,
        message,
        ...context,
      })
    },
    warn: (message: string, context?: any) => {
      logger.warn({
        requestId: req.requestId,
        message,
        ...context,
      })
    },
    error: (message: string, context?: any) => {
      logger.error({
        requestId: req.requestId,
        message,
        ...context,
      })
    },
  }
}

export default logger