import React from 'react'
import classNames from 'classnames'

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error'
  children: React.ReactNode
  onDismiss?: () => void
}

export const Alert: React.FC<AlertProps> = ({ type = 'info', children, onDismiss }) => {
  const typeClasses = {
    info: 'bg-primary-50 text-primary-800 border-primary-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error: 'bg-red-50 text-red-800 border-red-200',
  }

  return (
    <div
      className={classNames(
        'border rounded-lg p-4 flex items-start justify-between',
        typeClasses[type]
      )}
    >
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-4 flex-shrink-0 text-current opacity-60 hover:opacity-100"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
