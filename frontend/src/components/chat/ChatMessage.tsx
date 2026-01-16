import React from 'react'
import { marked } from 'marked'
import classNames from 'classnames'
import { Message } from '@/types'

interface ChatMessageProps {
  message: Message
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user'
  const isPending = message.role === 'pending'

  const renderContent = () => {
    if (isPending) {
      return (
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
          <span>{message.content}</span>
        </div>
      )
    }

    if (isUser) {
      return message.content
    }

    // Render markdown for assistant messages
    return (
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: marked(message.content) }}
      />
    )
  }

  return (
    <div
      className={classNames('flex', {
        'justify-end': isUser,
        'justify-start': !isUser,
      })}
    >
      <div
        className={classNames('max-w-[80%] rounded-lg px-4 py-2', {
          'bg-primary text-white': isUser,
          'bg-gray-100 text-gray-900': !isUser && !isPending,
          'bg-gray-50 text-gray-600': isPending,
        })}
      >
        {renderContent()}
      </div>
    </div>
  )
}
