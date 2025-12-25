import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from './Button'

export const Navbar: React.FC = () => {
  const { user, signout } = useAuth()
  const navigate = useNavigate()

  const handleSignout = () => {
    signout()
    navigate('/auth/signin')
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-blue-600">
              AiQA
            </Link>
            {user && (
              <div className="ml-10 flex space-x-4">
                <Link
                  to="/documents"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Documents
                </Link>
                <Link
                  to="/library-chat"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Library Chat
                </Link>
                <Link
                  to="/scores"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Scores
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">{user.email}</span>
                <Button variant="secondary" size="sm" onClick={handleSignout}>
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth/signin">
                  <Button variant="secondary" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth/signup">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
