export interface User {
  id: string
  email: string
}

export interface Pdf {
  id: string
  name: string
  userId: string
  createdAt: string
  size: number
}

export interface Message {
  id?: string
  role: 'user' | 'assistant' | 'system' | 'pending'
  content: string
}

export interface Conversation {
  id: string
  pdfId: string
  messages: Message[]
}

export interface Score {
  id: string
  score: number
  conversationId: string
  createdAt: string
}

export interface ScoreStats {
  score: number
  count: number
}
