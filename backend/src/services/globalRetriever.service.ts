import { Pinecone } from '@pinecone-database/pinecone'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { PineconeStore } from '@langchain/pinecone'
import { AppDataSource } from '../config/database'
import { Pdf } from '../entities'

let pineconeClient: Pinecone | null = null

const getPineconeClient = () => {
    if (!pineconeClient) {
        const apiKey = process.env.PINECONE_API_KEY
        if (!apiKey) {
            throw new Error('PINECONE_API_KEY is not set')
        }
        pineconeClient = new Pinecone({ apiKey })
    }
    return pineconeClient
}

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
    console.log('🌐 Building global retriever for user:', userId)

    // Get all PDFs for this user
    const pdfRepository = AppDataSource.getRepository(Pdf)
    const userPdfs = await pdfRepository.find({
        where: { userId },
        select: ['id', 'name'],
    })

    if (userPdfs.length === 0) {
        console.warn('⚠️  No PDFs found for user:', userId)
        return async () => []
    }

    console.log(`📚 Found ${userPdfs.length} PDFs for user`)

    const client = getPineconeClient()
    const indexName = process.env.PINECONE_INDEX || 'aiqa'
    const index = client.index(indexName)

    const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GOOGLE_API_KEY,
        modelName: 'text-embedding-004',
    })

    // Create a map of pdfId -> pdfName for quick lookup
    const pdfMap = new Map(userPdfs.map((pdf) => [pdf.id, pdf.name]))

    return async (query: string): Promise<GlobalRetrieverResult[]> => {
        console.log(`🔍 Global search for: "${query}"`)
        console.log(`📄 Searching across ${userPdfs.length} documents`)

        const RAG_TOP_K = parseInt(process.env.RAG_TOP_K || '5', 10)
        const allResults: GlobalRetrieverResult[] = []
        const seenContent = new Set<string>()

        // Search each namespace (PDF) in parallel
        const searchPromises = userPdfs.map(async (pdf) => {
            try {
                const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
                    pineconeIndex: index as unknown as Parameters<typeof PineconeStore.fromExistingIndex>[1]['pineconeIndex'],
                    namespace: pdf.id,
                })

                const results = await (vectorStore as { similaritySearch: (query: string, k: number) => Promise<Array<{ pageContent: string; metadata?: Record<string, unknown> }>> }).similaritySearch(query, 3)

                return results.map((doc) => ({
                    pageContent: doc.pageContent,
                    metadata: doc.metadata,
                    pdfId: pdf.id,
                    pdfName: pdf.name,
                }))
            } catch (error) {
                console.error(`❌ Error searching PDF ${pdf.id}:`, error)
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
        console.log(`✅ Global search returned ${topResults.length} unique results from ${resultsPerPdf.filter((r) => r.length > 0).length} documents`)

        return topResults
    }
}
