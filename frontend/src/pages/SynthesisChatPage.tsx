import React, { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatList } from '@/components/chat/ChatList'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import { selectedPdfIdsAtom, synthesisConversationIdAtom } from '@/atoms/synthesisAtom'
import { usePdfs } from '@/hooks/usePdfs'
import { getSynthesisStreamUrl } from '@/api/synthesis'

interface Message {
    id?: string
    role: 'user' | 'assistant' | 'pending'
    content: string
}

export const SynthesisChatPage: React.FC = () => {
    const [searchParams] = useSearchParams()
    const { pdfs } = usePdfs()
    const setSelectedPdfIds = useSetRecoilState(selectedPdfIdsAtom)

    const [isStreaming, setIsStreaming] = useState(false)
    const [localMessages, setLocalMessages] = useState<Message[]>([])
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [conversationId, setConversationId] = useRecoilState(synthesisConversationIdAtom)

    // Get PDF IDs from URL query params
    const pdfIdsFromUrl = useMemo(() => {
        const idsParam = searchParams.get('ids')
        return idsParam ? idsParam.split(',').filter(Boolean) : []
    }, [searchParams])

    // Get selected PDFs details
    const selectedPdfs = useMemo(() => {
        return pdfs.filter((pdf) => pdfIdsFromUrl.includes(pdf.id))
    }, [pdfs, pdfIdsFromUrl])

    // Sync URL params to atom on mount
    useEffect(() => {
        if (pdfIdsFromUrl.length > 0) {
            setSelectedPdfIds(pdfIdsFromUrl)
        }
    }, [pdfIdsFromUrl, setSelectedPdfIds])

    const handleSubmit = async (text: string) => {
        if (pdfIdsFromUrl.length === 0) return

        setSuggestions([])

        const tempId = Date.now().toString()
        const newMessages: Message[] = [
            ...localMessages,
            { id: tempId, role: 'user', content: text },
            { id: `${tempId}-pending`, role: 'pending', content: 'Đang phân tích tài liệu...' },
        ]
        setLocalMessages(newMessages)
        setIsStreaming(true)

        let accumulatedResponse = ''

        try {
            await fetchEventSource(getSynthesisStreamUrl(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    input: text,
                    pdfIds: pdfIdsFromUrl,
                    conversationId,
                }),
                onmessage(ev) {
                    if (ev.data === '[DONE]') {
                        setLocalMessages((msgs) => msgs.filter((m) => m.role !== 'pending'))
                        setIsStreaming(false)
                        return
                    }

                    try {
                        const data = JSON.parse(ev.data)

                        if (data.content) {
                            accumulatedResponse += data.content
                            setLocalMessages((msgs) => {
                                const filtered = msgs.filter((m) => m.role !== 'pending')
                                const last = filtered[filtered.length - 1]
                                if (last?.role === 'assistant' && !last.id) {
                                    return [...filtered.slice(0, -1), { ...last, content: accumulatedResponse }]
                                } else {
                                    return [...filtered, { role: 'assistant', content: accumulatedResponse }]
                                }
                            })
                        }

                        if (data.suggestions && Array.isArray(data.suggestions)) {
                            setSuggestions(data.suggestions)
                        }

                        if (data.conversationId && !conversationId) {
                            setConversationId(data.conversationId)
                        }
                    } catch {
                        // Ignore parse errors for partial chunks
                    }
                },
                onerror(err) {
                    console.error('Synthesis streaming error:', err)
                    setIsStreaming(false)
                    throw err
                },
            })
        } catch (error) {
            console.error('Synthesis error:', error)
            setIsStreaming(false)
            setLocalMessages((msgs) => msgs.filter((m) => m.role !== 'pending'))
        }
    }

    const handleSuggestionClick = (suggestion: string) => {
        handleSubmit(suggestion)
    }

    const handleNewChat = () => {
        setConversationId(null)
        setLocalMessages([])
        setSuggestions([])
    }

    if (pdfIdsFromUrl.length === 0) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Không có tài liệu nào được chọn</h2>
                    <p className="text-gray-600 mb-4">Vui lòng quay lại và chọn tài liệu để phân tích.</p>
                    <Link
                        to="/documents"
                        className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                    >
                        ← Quay lại thư viện
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="bg-white border-b px-4 py-3">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/documents" className="text-gray-600 hover:text-gray-900">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                                Phân tích & So sánh
                            </h1>
                            <p className="text-sm text-gray-500">
                                {selectedPdfs.length} tài liệu đang được phân tích
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleNewChat}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-md hover:bg-primary/20"
                    >
                        <span className="material-symbols-outlined text-sm mr-1">add</span>
                        Chat mới
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden max-w-5xl mx-auto w-full">
                {/* Sidebar - Contributing Documents */}
                <div className="w-64 border-r bg-slate-50 p-4 overflow-y-auto hidden md:block">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                        Tài liệu đang phân tích
                    </h3>
                    <div className="space-y-2">
                        {selectedPdfs.map((pdf) => (
                            <div
                                key={pdf.id}
                                className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200"
                            >
                                <span className="material-symbols-outlined text-primary text-lg">picture_as_pdf</span>
                                <span className="text-sm text-gray-700 truncate flex-1">{pdf.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col bg-slate-50">
                    {localMessages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-4xl text-primary">compare</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">So sánh tài liệu</h2>
                            <p className="text-gray-600 max-w-md mb-8">
                                Hỏi bất cứ điều gì về {selectedPdfs.length} tài liệu đã chọn. AI sẽ phân tích và so sánh nội dung.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                                {[
                                    'So sánh nội dung chính giữa các tài liệu',
                                    'Có điểm nào mâu thuẫn không?',
                                    'Tóm tắt điểm giống và khác nhau',
                                ].map((example, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSubmit(example)}
                                        className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-primary/50"
                                    >
                                        {example}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <ChatList messages={localMessages} />
                    )}

                    {suggestions.length > 0 && !isStreaming && (
                        <div className="px-4 py-2 border-t bg-slate-100">
                            <p className="text-xs text-gray-500 mb-2">💡 Câu hỏi gợi ý:</p>
                            <div className="flex flex-wrap gap-2">
                                {suggestions.map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="text-sm px-3 py-1.5 rounded-full border border-primary/30 bg-white text-primary hover:bg-primary/10 hover:border-primary transition-colors"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <ChatInput onSubmit={handleSubmit} disabled={isStreaming} />
                </div>
            </div>
        </div>
    )
}
