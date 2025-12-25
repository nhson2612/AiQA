export interface PromptTemplate<T = Record<string, unknown>> {
    role: 'system' | 'user'
    template: string
    build: (context?: T) => { role: 'system' | 'user'; content: string }
}

export interface ChatContext {
    pdfName?: string
}

export interface LibraryContext {
    documentCount?: number
}

export interface MindMapContext {
    pdfName: string
    documentContext: string
}
