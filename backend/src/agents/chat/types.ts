import { IWorkflowContext } from '../core/types';

export interface IChatContext extends IWorkflowContext {
    // Input
    userQuery: string;
    pdfId?: string; // Optional for library mode
    userId?: string; // Required for library mode
    selectedPdfIds?: string[]; // Optional for synthesis mode - specific PDFs to search
    conversationHistory: { role: 'user' | 'assistant'; content: string }[];

    // Intermediate Data (filled by steps)
    searchQueries?: string[];
    retrievedDocuments?: { pageContent: string; metadata?: Record<string, any> }[];
    contextString?: string;

    // Output
    answer?: string;
    suggestions?: string[];
}
