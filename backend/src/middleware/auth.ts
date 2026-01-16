import { Request, Response, NextFunction } from 'express'
import { AppDataSource } from '../config/database'
import { User } from '../entities'
import logger from '../services/logger.service'
import { AuthError, DatabaseError } from '../services/logger.service'

declare module 'express-session' {
  interface SessionData {
    userId?: string
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: User
      requestId?: string
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const contextLogger = logger.child({ requestId: req.requestId })
  contextLogger.info('Starting authentication')

  // Get userId from session
  const session = req.session as any
  const userId = session?.userId

  if (!userId) {
    contextLogger.warn('Authentication failed: No user ID in session')
    throw new AuthError('Unauthorized')
  }

  try {
    const userRepository = AppDataSource.getRepository(User)
    const user = await userRepository.findOne({ where: { id: userId } })

    if (!user) {
      contextLogger.warn('Authentication failed: User not found', { userId })
      throw new AuthError('User not found')
    }

    contextLogger.info('Authentication successful', { userId: user.id, email: user.email })
    req.user = user
    next()
  } catch (error) {
    contextLogger.error('Authentication error', { error: (error as Error).message })
    if (error instanceof AuthError) {
      throw error
    }
    throw new DatabaseError('Authentication database error', error as Error)
  }
}

export const loadUser = async (req: Request, res: Response, next: NextFunction) => {
  const contextLogger = logger.child({ requestId: req.requestId })
  contextLogger.debug('Loading user from session')

  const session = req.session as any
  if (session.userId) {
    try {
      const userRepository = AppDataSource.getRepository(User)
      const user = await userRepository.findOne({ where: { id: session.userId } })
      if (user) {
        contextLogger.debug('User loaded successfully', { userId: user.id })
        req.user = user
      }
    } catch (error) {
      contextLogger.error('Error loading user', { error: (error as Error).message })
    }
  }
  next()
}
