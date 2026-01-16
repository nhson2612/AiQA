import { Tool } from '../Tool';
import { PineconeStore } from '@langchain/pinecone';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Document } from '@langchain/core/documents';

let pineconeClient: Pinecone | null = null;

const getPineconeClient = () => {
    if (!pineconeClient) {
        const apiKey = process.env.PINECONE_API_KEY;
        if (!apiKey) {
            throw new Error('PINECONE_API_KEY is not set');
        }
        pineconeClient = new Pinecone({ apiKey });
    }
    return pineconeClient;
};

export interface EmbeddingInput {
    pdfId: string;
    pages: {
        pageNumber: number;
        content: string;
        hasImages?: boolean;
        imageCount?: number;
    }[];
    totalPages: number;
    filePath: string;
}

export interface EmbeddingOutput {
    success: boolean;
    chunks: number;
    pages: number;
}

/**
 * Embedding Tool - Chunks documents and stores in Pinecone.
 */
export class EmbeddingTool extends Tool<EmbeddingInput, EmbeddingOutput> {
    name = 'EmbeddingTool';
    description = 'Chunks documents and stores embeddings in Pinecone.';

    protected async run(input: EmbeddingInput): Promise<EmbeddingOutput> {
        const docs: Document[] = [];

        for (const page of input.pages) {
            if (page.content.trim().length > 0) {
                docs.push(
                    new Document({
                        pageContent: page.content,
                        metadata: {
                            pdfId: input.pdfId,
                            pageNumber: page.pageNumber,
                            totalPages: input.totalPages,
                            hasImages: page.hasImages || false,
                            imageCount: page.imageCount || 0,
                            source: input.filePath,
                        },
                    })
                );
            }
        }

        if (docs.length === 0) {
            throw new Error('No readable content found');
        }

        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 800,
            chunkOverlap: 150,
        });

        const splitDocs: Document[] = [];
        for (const doc of docs) {
            const chunks = await textSplitter.splitDocuments([doc]);
            chunks.forEach((chunk, idx) => {
                chunk.metadata = {
                    ...doc.metadata,
                    chunkIndex: idx,
                };
            });
            splitDocs.push(...chunks);
        }

        if (splitDocs.length === 0) {
            throw new Error('No chunks created');
        }

        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GOOGLE_API_KEY,
            modelName: 'text-embedding-004',
        });

        const client = getPineconeClient();
        const indexName = process.env.PINECONE_INDEX || 'aiqa';
        const index = client.index(indexName);

        await PineconeStore.fromDocuments(splitDocs, embeddings, {
            pineconeIndex: index as any,
            namespace: input.pdfId,
        });

        return {
            success: true,
            chunks: splitDocs.length,
            pages: input.totalPages,
        };
    }
}
