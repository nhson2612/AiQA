import apiClient from './axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

export interface SynthesisMessageResponse {
    conversationId: string
    role: 'assistant'
    content: string
    suggestions?: string[]
}

/**
 * Send a synthesis message (non-streaming)
 */
export const sendSynthesisMessage = async (
    input: string,
    pdfIds: string[],
    conversationId?: string
): Promise<SynthesisMessageResponse> => {
    const response = await apiClient.post('/library/synthesize', {
        input,
        pdfIds,
        conversationId,
    })
    return response.data
}

/**
 * Get the URL for streaming synthesis (use with fetchEventSource)
 */
export const getSynthesisStreamUrl = (): string => {
    return `${API_BASE}/api/library/synthesize?stream=true`
}
