import React, { useState, useEffect } from 'react'
import { useConversations } from '@/hooks/useConversations'
import { ChatInput } from './ChatInput'
import { ChatList } from './ChatList'
import { ConversationSelect } from './ConversationSelect'
import { Alert } from '../common/Alert'
import { useRecoilValue } from 'recoil'
import { chatErrorAtom } from '@/atoms/chatAtom'
import { fetchEventSource } from '@microsoft/fetch-event-source'

interface ChatPanelProps {
  documentId: string
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ documentId }) => {
  const [isStreaming, setIsStreaming] = useState(false)
  const [localMessages, setLocalMessages] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])

  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    isSending,
  } = useConversations(documentId)

  const error = useRecoilValue(chatErrorAtom)

  const activeConversation = conversations.find((c) => c.id === activeConversationId)
  const displayMessages =
    localMessages.length > 0 ? localMessages : activeConversation?.messages || []

  // Reset local messages and suggestions when conversation changes
  useEffect(() => {
    setLocalMessages([])
    setSuggestions([])
  }, [activeConversationId])

  const handleSubmit = async (text: string) => {
    if (!activeConversationId) return

    // Clear previous suggestions
    setSuggestions([])

    // Add pending message
    const tempId = Date.now().toString()
    const newMessages = [
      ...displayMessages,
      { id: tempId, role: 'user' as const, content: text },
      { id: `${tempId}-pending`, role: 'pending' as const, content: 'Đang suy nghĩ...' },
    ]
    setLocalMessages(newMessages)

    setIsStreaming(true)
    let accumulatedResponse = ''

    try {
      await fetchEventSource(`/api/conversations/${activeConversationId}/messages?stream=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ input: text }),
        onmessage(ev) {
          if (ev.data === '[DONE]') {
            setLocalMessages((messages) => messages.filter((m) => m.role !== 'pending'))
            setIsStreaming(false)
            return
          }

          const data = JSON.parse(ev.data)

          // Handle content chunks
          if (data.content) {
            accumulatedResponse += data.content
            setLocalMessages((messages) => {
              const filteredMessages = messages.filter((m) => m.role !== 'pending')
              const lastMessage = filteredMessages[filteredMessages.length - 1]
              if (lastMessage?.role === 'assistant' && !lastMessage.id) {
                return [
                  ...filteredMessages.slice(0, -1),
                  { ...lastMessage, content: accumulatedResponse },
                ]
              } else {
                return [
                  ...filteredMessages,
                  { role: 'assistant' as const, content: accumulatedResponse },
                ]
              }
            })
          }

          // Handle suggestions
          if (data.suggestions && Array.isArray(data.suggestions)) {
            setSuggestions(data.suggestions)
          }
        },
        onerror(err) {
          console.error('Streaming error:', err)
          setIsStreaming(false)
          throw err
        },
      })
    } catch (error) {
      console.error('Chat error:', error)
      setIsStreaming(false)
      setLocalMessages((messages) => messages.filter((m) => m.role !== 'pending'))
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSubmit(suggestion)
  }

  const handleNewChat = () => {
    createConversation()
    setSuggestions([])
  }

  return (
    <div
      style={{ height: 'calc(100vh - 80px)' }}
      className="flex flex-col bg-slate-50 border rounded-xl shadow"
    >
      <div className="rounded-lg border-b px-3 py-2 flex flex-row items-center justify-end">
        <div className="flex gap-2">
          {activeConversationId && (
            <ConversationSelect
              conversations={conversations}
              activeId={activeConversationId}
              onChange={setActiveConversationId}
            />
          )}
          <button
            className="rounded text-sm border border-blue-500 px-2 py-0.5 hover:bg-blue-50"
            onClick={handleNewChat}
          >
            New Chat
          </button>
        </div>
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        {error && error.length < 200 && (
          <div className="p-4">
            <Alert type="error" onDismiss={() => { }}>
              {error}
            </Alert>
          </div>
        )}
        <ChatList messages={displayMessages} />

        {/* Suggestions */}
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

        <ChatInput onSubmit={handleSubmit} disabled={isSending || isStreaming} />
      </div>
    </div>
  )
}
