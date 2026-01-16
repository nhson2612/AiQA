import { Tool } from '../Tool';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { PineconeStore } from '@langchain/pinecone';

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

export interface RetrieverInput {
    query: string;
    namespace: string; // pdfId
    topK?: number;
}

export interface RetrieverOutput {
    documents: { pageContent: string; metadata?: Record<string, any> }[];
}

/**
 * Retriever Tool using Pinecone + Google Embeddings.
 */
export class RetrieverTool extends Tool<RetrieverInput, RetrieverOutput> {
    name = 'RetrieverTool';
    description = 'Retrieves similar documents from Pinecone vector store.';

    protected async run(input: RetrieverInput): Promise<RetrieverOutput> {
        const client = getPineconeClient();
        const indexName = process.env.PINECONE_INDEX || 'aiqa';
        const index = client.index(indexName);

        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GOOGLE_API_KEY,
            modelName: 'text-embedding-004',
        });

        const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
            pineconeIndex: index as any,
            namespace: input.namespace,
        });

        const topK = input.topK || 6;
        const results = await (vectorStore as any).similaritySearch(input.query, topK);

        return { documents: results };
    }
}
