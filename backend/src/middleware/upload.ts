import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import fs from 'fs'
import logger from '../services/logger.service'
import { AppError } from '../services/logger.service'

const uploadDir = process.env.UPLOAD_DIR || './uploads'

// Ensure upload directory exists
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
    logger.info('Created upload directory', { path: uploadDir })
  }
} catch (error) {
  logger.error('Failed to create upload directory', { error: (error as Error).message, path: uploadDir })
  throw new AppError('Failed to initialize upload directory', 500, false)
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    logger.debug('Setting upload destination', { path: uploadDir })
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const fileId = crypto.randomUUID()
    const ext = path.extname(file.originalname)
    const filename = `${fileId}${ext}`
    logger.debug('Generating filename for upload', { originalName: file.originalname, generatedName: filename })
    cb(null, filename)
  },
})

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = ['application/pdf']
  logger.debug('Checking file type', { mimeType: file.mimetype, allowedTypes })

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    logger.warn('Invalid file type rejected', { mimeType: file.mimetype })
    cb(new AppError('Only PDF files are allowed', 400), false)
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
})


