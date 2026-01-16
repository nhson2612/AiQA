import { AppDataSource } from '../config/database'
import { User } from '../entities'
import { loadUser } from '../middleware/auth'
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { createContextLogger } from '../services/logger.service'
import { ValidationError, AuthError, DatabaseError } from '../services/logger.service'
import { validateRequest } from '../middleware/validate'
import { signinSchema, signupSchema } from '../validators/schemas'

const router = Router()

// Get current user
router.get('/user', loadUser, (req, res) => {
  const contextLogger = createContextLogger(req)
  contextLogger.debug('Get current user request')

  if (req.user) {
    contextLogger.info('User found in session', { userId: req.user.id })
    return res.json(req.user.toJSON())
  }

  contextLogger.debug('No user in session')
  res.json(null)
})

// Sign up with validation
router.post('/signup', validateRequest(signupSchema), async (req, res, next) => {
  const contextLogger = createContextLogger(req)
  contextLogger.info('Signup attempt')

  try {
    const { email, password } = req.body

    const userRepository = AppDataSource.getRepository(User)

    // Check if user exists
    const existingUser = await userRepository.findOne({ where: { email } })
    if (existingUser) {
      contextLogger.warn('Signup failed: User already exists', { email })
      throw new ValidationError({ email: 'User already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = userRepository.create({
      email,
      password: hashedPassword,
    })

    await userRepository.save(user)

    // Set session
    const session = req.session as any
    session.userId = user.id

    contextLogger.info('Signup successful', { userId: user.id, email: user.email })
    res.json(user.toJSON())
  } catch (error) {
    contextLogger.error('Signup error', { error: (error as Error).message })
    next(error)
  }
})

// Sign in with validation
router.post('/signin', validateRequest(signinSchema), async (req, res, next) => {
  const contextLogger = createContextLogger(req)
  contextLogger.info('Signin attempt')

  try {
    const { email, password } = req.body

    const userRepository = AppDataSource.getRepository(User)
    const user = await userRepository.findOne({ where: { email } })

    if (!user) {
      contextLogger.warn('Signin failed: Invalid credentials', { email })
      throw new AuthError('Invalid credentials')
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      contextLogger.warn('Signin failed: Incorrect password', { userId: user.id })
      throw new AuthError('Incorrect password')
    }

    // Set session
    const session = req.session as any
    session.userId = user.id

    contextLogger.info('Signin successful', { userId: user.id, email: user.email })
    res.json(user.toJSON())
  } catch (error) {
    contextLogger.error('Signin error', { error: (error as Error).message })
    next(error)
  }
})

// Sign out
router.post('/signout', (req, res) => {
  const contextLogger = createContextLogger(req)
  contextLogger.info('Signout attempt')

  req.session.destroy((err) => {
    if (err) {
      contextLogger.error('Signout failed', { error: err.message })
      return res.status(500).json({ message: 'Could not log out' })
    }

    contextLogger.info('Signout successful')
    res.json({ message: 'Successfully logged out.' })
  })
})

export default router
