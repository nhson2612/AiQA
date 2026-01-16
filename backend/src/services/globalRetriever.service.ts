import { RetrieverTool } from '../agents/core/tools/RetrieverTool'
import { AppDataSource } from '../config/database'
import { Pdf } from '../entities'
import logger from './logger.service'

export interface GlobalRetrieverResult {
    pageContent: string
    metadata?: Record<string, unknown>
    pdfId: string
    pdfName: string
}

export type GlobalRetriever = (query: string) => Promise<GlobalRetrieverResult[]>

/**
 * Build a retriever that searches across ALL user's PDFs
 */
export const buildGlobalRetriever = async (userId: string): Promise<GlobalRetriever> => {
    // Get all PDFs for this user
    const pdfRepository = AppDataSource.getRepository(Pdf)
    const userPdfs = await pdfRepository.find({
        where: { userId },
        select: ['id', 'name'],
    })

    if (userPdfs.length === 0) {
        return async () => []
    }

    return async (query: string): Promise<GlobalRetrieverResult[]> => {
        const RAG_TOP_K = parseInt(process.env.RAG_TOP_K || '5', 10)
        const allResults: GlobalRetrieverResult[] = []
        const seenContent = new Set<string>()
        const retrieverTool = new RetrieverTool()

        // Search each namespace (PDF) in parallel
        const searchPromises = userPdfs.map(async (pdf) => {
            try {
                const result = await retrieverTool.execute({
                    query,
                    namespace: pdf.id,
                    topK: 3
                })

                return result.documents.map((doc) => ({
                    pageContent: doc.pageContent,
                    metadata: doc.metadata,
                    pdfId: pdf.id,
                    pdfName: pdf.name,
                }))
            } catch (error) {
                logger.error(`Error searching PDF namespace`, { pdfId: pdf.id, error: (error as Error).message })
                return []
            }
        })

        const resultsPerPdf = await Promise.all(searchPromises)

        // Merge and deduplicate results
        for (const pdfResults of resultsPerPdf) {
            for (const result of pdfResults) {
                const contentKey = result.pageContent.substring(0, 100).toLowerCase()
                if (!seenContent.has(contentKey)) {
                    seenContent.add(contentKey)
                    allResults.push(result)
                }
            }
        }

        // Sort by relevance (we could add scoring later) and limit
        const topResults = allResults.slice(0, RAG_TOP_K * 2) // Extra results since we're searching across multiple docs

        return topResults
    }
}
