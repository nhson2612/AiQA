import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatList } from '@/components/chat/ChatList'
import { fetchEventSource } from '@microsoft/fetch-event-source'

interface Message {
    id?: string
    role: 'user' | 'assistant' | 'pending'
    content: string
}

interface LibraryConversation {
    id: string
    title: string
    messages: Message[]
}

export const LibraryChatPage: React.FC = () => {
    const [isStreaming, setIsStreaming] = useState(false)
    const [localMessages, setLocalMessages] = useState<Message[]>([])
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [conversations, setConversations] = useState<LibraryConversation[]>([])
    const [isLoadingHistory, setIsLoadingHistory] = useState(true)

    // Load library conversations on mount
    useEffect(() => {
        const loadConversations = async () => {
            try {
                const apiBaseUrl = import.meta.env.VITE_API_URL || ''
                const response = await fetch(`${apiBaseUrl}/api/library/conversations`, {
                    credentials: 'include',
                })
                if (response.ok) {
                    const data = await response.json()
                    setConversations(data)
                    // If there's an existing conversation, load it
                    if (data.length > 0) {
                        setConversationId(data[0].id)
                        setLocalMessages(data[0].messages || [])
                    }
                }
            } catch (error) {
                console.error('Failed to load library conversations:', error)
            } finally {
                setIsLoadingHistory(false)
            }
        }
        loadConversations()
    }, [])

    const handleSubmit = async (text: string) => {
        setSuggestions([])

        const tempId = Date.now().toString()
        const newMessages: Message[] = [
            ...localMessages,
            { id: tempId, role: 'user', content: text },
            { id: `${tempId}-pending`, role: 'pending', content: 'Đang tìm kiếm trong thư viện...' },
        ]
        setLocalMessages(newMessages)
        setIsStreaming(true)

        let accumulatedResponse = ''

        try {
            const apiBaseUrl = import.meta.env.VITE_API_URL || ''
            await fetchEventSource(`${apiBaseUrl}/api/library/messages?stream=true`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ input: text, conversationId }),
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
                    console.error('Library chat streaming error:', err)
                    setIsStreaming(false)
                    throw err
                },
            })
        } catch (error) {
            console.error('Library chat error:', error)
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

    if (isLoadingHistory) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col">
            <div className="bg-white border-b px-4 py-3">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/documents" className="text-gray-600 hover:text-gray-900">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-blue-600">auto_awesome</span>
                                Library Chat
                            </h1>
                            <p className="text-sm text-gray-500">Hỏi đáp xuyên suốt tất cả tài liệu của bạn</p>
                        </div>
                    </div>
                    <button
                        onClick={handleNewChat}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                    >
                        <span className="material-symbols-outlined text-sm mr-1">add</span>
                        Chat mới
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden max-w-4xl mx-auto w-full">
                <div className="h-full flex flex-col bg-slate-50 border-x">
                    {localMessages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className="size-20 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-4xl text-blue-600">library_books</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Hỏi bất cứ điều gì</h2>
                            <p className="text-gray-600 max-w-md mb-8">
                                AI sẽ tìm kiếm câu trả lời từ tất cả tài liệu bạn đã tải lên và trích dẫn nguồn gốc.
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                                {['Tóm tắt tất cả tài liệu của tôi', 'So sánh nội dung giữa các file', 'Tìm thông tin về...'].map(
                                    (example, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSubmit(example)}
                                            className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-blue-300"
                                        >
                                            {example}
                                        </button>
                                    )
                                )}
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
                                        className="text-sm px-3 py-1.5 rounded-full border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-colors"
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
