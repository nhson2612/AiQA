import { Request, Response, NextFunction } from 'express'
import logger from '../services/logger.service'
import { AppError, ValidationError, AuthError, NotFoundError, DatabaseError, ExternalAPIError } from '../services/logger.service'

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error({
    requestId: req.requestId,
    message: 'Error handler invoked',
    errorName: err.name,
    errorMessage: err.message,
    stack: err.stack,
  })

  // Handle specific error types
  if (err instanceof ValidationError) {
    return res.status(400).json({
      error: {
        message: 'Validation error',
        errors: err.errors,
      },
    })
  }

  if (err instanceof AuthError) {
    return res.status(401).json({
      error: {
        message: err.message,
      },
    })
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      error: {
        message: err.message,
      },
    })
  }

  if (err instanceof DatabaseError) {
    logger.error({
      requestId: req.requestId,
      message: 'Database error occurred',
      originalError: err.originalError,
    })
    return res.status(500).json({
      error: {
        message: 'Database operation failed',
      },
    })
  }

  if (err instanceof ExternalAPIError) {
    logger.error({
      requestId: req.requestId,
      message: 'External API error',
      service: err.service,
      statusCode: err.statusCode,
      response: err.response,
    })
    return res.status(err.statusCode).json({
      error: {
        message: `External service error: ${err.service}`,
      },
    })
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: {
        message: 'File too large',
      },
    })
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        message: 'Invalid token',
      },
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        message: 'Token expired',
      },
    })
  }

  if (err.name === 'TypeError') {
    logger.error({
      requestId: req.requestId,
      message: 'Type error occurred',
      error: err.message,
    })
    return res.status(400).json({
      error: {
        message: 'Invalid data type',
      },
    })
  }

  // Handle AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { context: err.context }),
      },
    })
  }

  // Handle generic errors
  logger.error({
    requestId: req.requestId,
    message: 'Unhandled error type',
    error: err,
  })

  res.status(500).json({
    error: {
      message: 'Internal server error',
    },
  })
}
