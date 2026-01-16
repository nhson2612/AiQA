import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthGuard } from './components/auth/AuthGuard'
import { HomePage } from './pages/HomePage'
import { SignInPage } from './pages/SignInPage'
import { SignUpPage } from './pages/SignUpPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { DocumentDetailPage } from './pages/DocumentDetailPage'
import { ScoresPage } from './pages/ScoresPage'
import { LibraryChatPage } from './pages/LibraryChatPage'
import { SynthesisChatPage } from './pages/SynthesisChatPage'
import { Header } from './components/common/Header'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Standard protected route with Header
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthGuard>
      <Header />
      <div className="max-w-[1200px] mx-auto">
        {children}
      </div>
    </AuthGuard>
  )
}

// Chat route WITHOUT header (DocumentDetailPage has its own ChatHeader)
const ChatRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  )
}

function App() {
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50 font-display">
            <Routes>
              <Route path="/" element={<><Header /><HomePage /></>} />
              <Route path="/auth/signin" element={<SignInPage />} />
              <Route path="/auth/signup" element={<SignUpPage />} />
              <Route
                path="/documents"
                element={
                  <ProtectedRoute>
                    <DocumentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/documents/:id"
                element={
                  <ChatRoute>
                    <DocumentDetailPage />
                  </ChatRoute>
                }
              />
              <Route
                path="/scores"
                element={
                  <ProtectedRoute>
                    <ScoresPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/library-chat"
                element={
                  <ProtectedRoute>
                    <LibraryChatPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/synthesis"
                element={
                  <ChatRoute>
                    <SynthesisChatPage />
                  </ChatRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </RecoilRoot>
  )
}

export default App