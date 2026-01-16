import { Router } from 'express'
import { AppDataSource } from '../config/database'
import { Pdf } from '../entities'
import { authenticate } from '../middleware/auth'
import { upload } from '../middleware/upload'
import * as fs from 'fs'
import * as path from 'path'
import logger from '../services/logger.service'
import { createContextLogger } from '../services/logger.service'
import { ValidationError, NotFoundError, DatabaseError, ExternalAPIError } from '../services/logger.service'

import { EmbeddingTool } from '../agents/core/tools/EmbeddingTool'
import { processPdf } from '../services/pdfProcessor.service'
import { generateMindMap } from '../services/mindmap.service'
import { validateRequest } from '../middleware/validate'
import { pdfIdParamSchema } from '../validators/schemas'

const router = Router()

// List user's PDFs
router.get('/', authenticate, async (req, res) => {
  try {
    const pdfRepository = AppDataSource.getRepository(Pdf)
    const pdfs = await pdfRepository.find({
      where: { userId: req.user!.id },
      order: { createdAt: 'DESC' },
    })

    res.json(pdfs.map((pdf) => pdf.toJSON()))
  } catch (error) {
    const contextLogger = createContextLogger(req)
    contextLogger.error('List PDFs error', { error: (error as Error).message })
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Upload PDF
router.post('/', authenticate as any, upload.single('file'), async (req, res, next) => {
  const contextLogger = createContextLogger(req)
  contextLogger.info('PDF upload attempt')

  try {
    if (!req.file) {
      contextLogger.warn('PDF upload failed: No file uploaded')
      throw new ValidationError({ file: 'No file uploaded' })
    }

    const pdfRepository = AppDataSource.getRepository(Pdf)

    // Extract file ID from filename (without extension)
    const fileId = path.parse(req.file.filename).name
    contextLogger.debug('Processing PDF file', {
      fileId,
      originalName: req.file.originalname,
      size: req.file.size
    })

    const pdf = pdfRepository.create({
      id: fileId,
      name: req.file.originalname,
      userId: req.user!.id,
    })

    await pdfRepository.save(pdf)
    contextLogger.info('PDF record created in database', { pdfId: pdf.id });

    // Process document in background
    (async () => {
      const processedPdf = await processPdf(req.file!.path);
      const embeddingTool = new EmbeddingTool();
      await embeddingTool.execute({
        pdfId: pdf.id,
        filePath: req.file!.path,
        pages: processedPdf.pages,
        totalPages: processedPdf.totalPages
      });
    })()
      .then(() => {
        contextLogger.info('PDF processing completed successfully', { pdfId: pdf.id })
      })
      .catch((err: Error) => {
        contextLogger.error('Document processing error', {
          pdfId: pdf.id,
          error: err.message,
          stack: err.stack
        })
        // Note: We don't throw this error as processing happens in background
      })

    contextLogger.info('PDF upload successful', { pdfId: pdf.id })
    res.json(pdf.toJSON())
  } catch (error) {
    contextLogger.error('Upload PDF error', { error: (error as Error).message })
    next(error)
  }
})

// Get PDF details
router.get('/:id', authenticate, validateRequest(pdfIdParamSchema), async (req, res) => {
  const contextLogger = createContextLogger(req)
  try {
    const pdfRepository = AppDataSource.getRepository(Pdf)
    const pdf = await pdfRepository.findOne({
      where: { id: req.params.id, userId: req.user!.id },
    })

    if (!pdf) {
      contextLogger.warn('PDF not found during details fetch', { pdfId: req.params.id })
      return res.status(404).json({ message: 'PDF not found' })
    }

    const uploadDir = process.env.UPLOAD_DIR || './uploads'
    const filePath = path.join(uploadDir, `${pdf.id}.pdf`)

    // Construct absolute URL for PDF download
    let baseUrl = process.env.BACKEND_URL

    if (!baseUrl) {
      // Fallback: construct from request headers
      // Handle X-Forwarded-Proto for proxies/load balancers
      const protocol = req.get('x-forwarded-proto') || req.protocol
      const host = req.get('x-forwarded-host') || req.get('host')
      baseUrl = `${protocol}://${host}`
    }

    const downloadUrl = `${baseUrl}/api/pdfs/${pdf.id}/download`

    contextLogger.debug('PDF Download details', {
      baseUrl,
      downloadUrl,
    })

    res.json({
      pdf: pdf.toJSON(),
      downloadUrl,
    })
  } catch (error) {
    contextLogger.error('Get PDF error', { error: (error as Error).message })
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Download PDF
router.get('/:id/download', authenticate, async (req, res) => {
  try {
    const pdfRepository = AppDataSource.getRepository(Pdf)
    const pdf = await pdfRepository.findOne({
      where: { id: req.params.id, userId: req.user!.id },
    })

    if (!pdf) {
      return res.status(404).json({ message: 'PDF not found' })
    }

    const uploadDir = process.env.UPLOAD_DIR || './uploads'
    const filePath = path.join(uploadDir, `${pdf.id}.pdf`)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' })
    }

    // Set proper headers for download
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(pdf.name)}"`)
    res.download(filePath, pdf.name)
  } catch (error) {
    const contextLogger = createContextLogger(req)
    contextLogger.error('Download PDF error', { error: (error as Error).message })
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Delete PDF
router.delete('/:id', authenticate, async (req, res, next) => {
  const contextLogger = createContextLogger(req)
  contextLogger.info('PDF delete attempt', { pdfId: req.params.id })

  try {
    const pdfRepository = AppDataSource.getRepository(Pdf)
    const pdf = await pdfRepository.findOne({
      where: { id: req.params.id, userId: req.user!.id },
      relations: ['conversations'],
    })

    if (!pdf) {
      contextLogger.warn('PDF delete failed: PDF not found', { pdfId: req.params.id })
      throw new NotFoundError('PDF', req.params.id)
    }

    contextLogger.debug('PDF found, proceeding with deletion', { pdfId: pdf.id, name: pdf.name })

    // Delete physical file
    const uploadDir = process.env.UPLOAD_DIR || './uploads'
    const filePath = path.join(uploadDir, `${pdf.id}.pdf`)

    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath)
        contextLogger.info('Physical file deleted', { filePath })
      } catch (fileError) {
        contextLogger.error('Error deleting physical file', {
          filePath,
          error: (fileError as Error).message
        })
        // Continue with database deletion even if file deletion fails
      }
    } else {
      contextLogger.warn('Physical file not found, skipping file deletion', { filePath })
    }

    // Delete related conversations and messages first (cascade)
    if (pdf.conversations && pdf.conversations.length > 0) {
      contextLogger.debug('Deleting related conversations and messages', {
        conversationCount: pdf.conversations.length
      })

      const conversationRepository = AppDataSource.getRepository(
        require('../entities').Conversation
      )
      const messageRepository = AppDataSource.getRepository(require('../entities').Message)

      for (const conversation of pdf.conversations) {
        // Delete messages first
        await messageRepository.delete({ conversationId: conversation.id })
        contextLogger.debug('Deleted messages for conversation', { conversationId: conversation.id })

        // Then delete conversation
        await conversationRepository.delete({ id: conversation.id })
        contextLogger.debug('Deleted conversation', { conversationId: conversation.id })
      }
    }

    // Delete PDF record from database
    await pdfRepository.remove(pdf)
    contextLogger.info('PDF record deleted from database', { pdfId: pdf.id })

    contextLogger.info('PDF deletion successful', { pdfId: pdf.id })
    res.json({ message: 'PDF deleted successfully' })
  } catch (error) {
    contextLogger.error('Delete PDF error', { error: (error as Error).message })
    next(error)
  }
})

// Generate Mind Map for PDF
router.get('/:id/mindmap', authenticate, async (req, res, next) => {
  const contextLogger = createContextLogger(req)
  contextLogger.info('Mind map generation attempt', { pdfId: req.params.id })

  try {
    const pdfRepository = AppDataSource.getRepository(Pdf)
    const pdf = await pdfRepository.findOne({
      where: { id: req.params.id, userId: req.user!.id },
    })

    if (!pdf) {
      contextLogger.warn('Mind map generation failed: PDF not found', { pdfId: req.params.id })
      throw new NotFoundError('PDF', req.params.id)
    }

    contextLogger.info('Generating mind map', { pdfId: pdf.id, pdfName: pdf.name })
    const mindMapData = await generateMindMap(pdf.id, pdf.name)

    contextLogger.info('Mind map generation successful', {
      pdfId: pdf.id,
      nodeCount: mindMapData.nodes.length,
      edgeCount: mindMapData.edges.length
    })

    res.json(mindMapData)
  } catch (error) {
    contextLogger.error('Mind map generation error', {
      pdfId: req.params.id,
      error: (error as Error).message
    })
    next(error)
  }
})

export default router
