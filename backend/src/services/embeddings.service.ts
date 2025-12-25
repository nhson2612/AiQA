import { PineconeStore } from '@langchain/pinecone'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { Pinecone } from '@pinecone-database/pinecone'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { Document } from '@langchain/core/documents'
import { readFile } from 'fs/promises'

// pdf-parse with page-by-page support
const pdfParse = require('pdf-parse')

let pineconeClient: Pinecone | null = null

const getPineconeClient = () => {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY is not set')
    }

    pineconeClient = new Pinecone({
      apiKey,
    })
  }
  return pineconeClient
}

/**
 * Process a PDF document and store embeddings with page number metadata
 * This enables source citations in chat responses
 */
export const processDocument = async (pdfId: string, filePath: string) => {
  console.log(`Processing document ${pdfId}...`)

  try {
    // Read PDF file
    console.log('📄 Reading PDF file...')
    const dataBuffer = await readFile(filePath)

    console.log('📄 Parsing PDF...')
    const pdfData = await pdfParse(dataBuffer)
    console.log(`✅ PDF parsed: ${pdfData.numpages} pages, ${pdfData.text.length} characters`)

    // Validate PDF content
    if (!pdfData.text || pdfData.text.trim().length === 0) {
      throw new Error('PDF contains no readable text')
    }

    // Create documents with page metadata
    // pdf-parse doesn't give us page-by-page text directly, so we'll estimate pages
    // by splitting the text proportionally
    const totalPages = pdfData.numpages
    const fullText = pdfData.text
    const charsPerPage = Math.ceil(fullText.length / totalPages)

    const docs: Document[] = []

    // Split into approximate pages for metadata tracking
    for (let i = 0; i < totalPages; i++) {
      const startIdx = i * charsPerPage
      const endIdx = Math.min(startIdx + charsPerPage, fullText.length)
      const pageText = fullText.substring(startIdx, endIdx).trim()

      if (pageText.length > 0) {
        docs.push(
          new Document({
            pageContent: pageText,
            metadata: {
              pdfId,
              pageNumber: i + 1,
              totalPages,
              source: filePath,
            },
          })
        )
      }
    }

    console.log(`📄 Created ${docs.length} page documents`)

    // Split each page into smaller chunks while preserving page metadata
    console.log('✂️  Splitting text into chunks...')
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 150,
    })

    const splitDocs: Document[] = []
    for (const doc of docs) {
      const chunks = await textSplitter.splitDocuments([doc])
      // Preserve the page metadata in each chunk
      chunks.forEach((chunk, idx) => {
        chunk.metadata = {
          ...doc.metadata,
          chunkIndex: idx,
        }
      })
      splitDocs.push(...chunks)
    }

    console.log(`✅ Split into ${splitDocs.length} chunks with page metadata`)

    if (splitDocs.length === 0) {
      throw new Error('No chunks created from PDF')
    }

    // Create embeddings
    console.log('🔧 Creating embeddings client...')
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      modelName: 'text-embedding-004',
    })
    console.log('✅ Embeddings client created')

    // Store in Pinecone
    console.log('📌 Connecting to Pinecone...')
    const client = getPineconeClient()
    const indexName = process.env.PINECONE_INDEX || 'aiqa'
    const index = client.index(indexName)
    console.log(`📌 Using index: ${indexName}, namespace: ${pdfId}`)

    console.log('💾 Storing embeddings in Pinecone...')
    await PineconeStore.fromDocuments(splitDocs, embeddings, {
      pineconeIndex: index as any,
      namespace: pdfId,
    })
    console.log(`✅ Document ${pdfId} processed successfully`)

    return {
      success: true,
      chunks: splitDocs.length,
      pages: pdfData.numpages,
    }
  } catch (error) {
    console.error(`❌ Error processing document ${pdfId}:`, error)
    throw error
  }
}
