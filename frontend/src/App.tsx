import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navbar } from './components/common/Navbar'
import { AuthGuard } from './components/auth/AuthGuard'
import { HomePage } from './pages/HomePage'
import { SignInPage } from './pages/SignInPage'
import { SignUpPage } from './pages/SignUpPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { DocumentDetailPage } from './pages/DocumentDetailPage'
import { ScoresPage } from './pages/ScoresPage'
import { LibraryChatPage } from './pages/LibraryChatPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <RecoilRoot>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/auth/signin" element={<SignInPage />} />
              <Route path="/auth/signup" element={<SignUpPage />} />
              <Route
                path="/documents"
                element={
                  <AuthGuard>
                    <DocumentsPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/documents/:id"
                element={
                  <AuthGuard>
                    <DocumentDetailPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/scores"
                element={
                  <AuthGuard>
                    <ScoresPage />
                  </AuthGuard>
                }
              />
              <Route
                path="/library-chat"
                element={
                  <AuthGuard>
                    <LibraryChatPage />
                  </AuthGuard>
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
