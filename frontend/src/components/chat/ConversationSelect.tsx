import React from 'react'
import { Conversation } from '@/types'

interface ConversationSelectProps {
  conversations: Conversation[]
  activeId: string | null
  onChange: (id: string) => void
}

export const ConversationSelect: React.FC<ConversationSelectProps> = ({
  conversations,
  activeId,
  onChange,
}) => {
  return (
    <select
      value={activeId || ''}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      {conversations.map((conv, index) => (
        <option key={conv.id} value={conv.id}>
          Conversation {conversations.length - index}
        </option>
      ))}
    </select>
  )
}
