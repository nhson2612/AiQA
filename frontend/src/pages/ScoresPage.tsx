import React from 'react'
import { useScores } from '@/hooks/useScores'
import { ScoreChart } from '@/components/scores/ScoreChart'

export const ScoresPage: React.FC = () => {
  const { scoreStats, isLoading } = useScores()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Conversation Scores</h1>

      {scoreStats.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No scores yet</h3>
          <p className="text-gray-600">Start conversations and rate them to see statistics here</p>
        </div>
      ) : (
        <ScoreChart data={scoreStats} />
      )}
    </div>
  )
}
