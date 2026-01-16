import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useRecoilValue } from 'recoil'
import { authErrorAtom } from '@/atoms/authAtom'
import { Alert } from '@/components/common/Alert'

export const SignUpPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const { signup, isSigningUp } = useAuth()
  const error = useRecoilValue(authErrorAtom)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }

    signup({ email, password }, {
      onSuccess: () => {
        navigate('/documents')
      },
    } as any)
  }

  const displayError = localError || error

  return (
    <>
      <style>{`
        .grid-bg {
            background-image: linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
            background-size: 20px 20px;
        }
        .diagonal-accent {
            clip-path: polygon(0 0, 100% 0, 100% 100%);
        }
      `}</style>
      <div className="bg-background-light dark:bg-background-dark font-display antialiased overflow-x-hidden min-h-screen relative">
        {/* Background Elements */}
        <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none"></div>
        <div className="fixed top-0 right-0 w-64 h-64 bg-primary diagonal-accent opacity-100 z-0"></div>
        
        <div className="relative z-10 flex flex-col min-h-screen">
          {/* TopNavBar */}
          <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 dark:border-gray-800 px-10 py-4 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
            <Link to="/" className="flex items-center gap-4 text-gray-900 dark:text-white">
              <div className="size-6 text-primary">
                <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M24 4H42V17.3333V30.6667H24V44H6V30.6667V17.3333H24V4Z" fillRule="evenodd"></path>
                </svg>
              </div>
              <h2 className="text-xl font-black tracking-tighter uppercase italic">AiQA</h2>
            </Link>
            <div className="flex flex-1 justify-end gap-8 items-center">
              <div className="hidden md:flex items-center gap-9">
                <Link to="/" className="text-gray-600 dark:text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">Product</Link>
                <Link to="/" className="text-gray-600 dark:text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">Solutions</Link>
                <Link to="/" className="text-gray-600 dark:text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors">Pricing</Link>
              </div>
              <div className="flex gap-4">
                <Link to="/auth/signin">
                  <button className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-none h-10 px-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors">
                    Login
                  </button>
                </Link>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
            <div className="w-full max-w-[480px]">
              {/* HeadlineText */}
              <div className="mb-8">
                <h1 className="text-gray-900 dark:text-white tracking-tighter text-4xl font-black leading-none text-left uppercase">
                  AiQA / <span className="text-primary">Registration</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 font-medium uppercase tracking-tight">Access the next generation of automated QA.</p>
              </div>

              {/* Registration Card */}
              <div className="bg-white dark:bg-gray-900 border-2 border-primary p-8 shadow-[8px_8px_0px_0px_rgba(254,81,42,0.1)]">
                {displayError && (
                  <div className="mb-6">
                    <Alert type="error">{displayError}</Alert>
                  </div>
                )}
                <form className="space-y-6" onSubmit={handleSubmit}>
                  {/* TextField: Email */}
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-900 dark:text-white text-xs font-bold uppercase tracking-widest">Email Address</label>
                    <div className="relative">
                      <input
                        className="form-input flex w-full rounded-none text-gray-900 dark:text-white focus:outline-0 focus:ring-0 border-2 border-gray-200 dark:border-gray-700 bg-transparent focus:border-primary h-14 placeholder:text-gray-400 p-4 text-base font-medium transition-all"
                        placeholder="user@aiqa.tech"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  {/* TextField: Password */}
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-900 dark:text-white text-xs font-bold uppercase tracking-widest">Password</label>
                    <div className="flex w-full items-stretch relative">
                      <input
                        className="form-input flex w-full rounded-none text-gray-900 dark:text-white focus:outline-0 focus:ring-0 border-2 border-gray-200 dark:border-gray-700 bg-transparent focus:border-primary h-14 placeholder:text-gray-400 p-4 border-r-0 text-base font-medium transition-all"
                        placeholder="••••••••••••"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <div 
                        className="flex border-2 border-gray-200 dark:border-gray-700 bg-transparent items-center justify-center px-4 border-l-0 text-gray-400 hover:text-primary cursor-pointer"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                      </div>
                    </div>
                  </div>

                  {/* TextField: Confirm Password */}
                  <div className="flex flex-col gap-2">
                    <label className="text-gray-900 dark:text-white text-xs font-bold uppercase tracking-widest">Confirm Password</label>
                    <div className="flex w-full items-stretch relative">
                      <input
                        className="form-input flex w-full rounded-none text-gray-900 dark:text-white focus:outline-0 focus:ring-0 border-2 border-gray-200 dark:border-gray-700 bg-transparent focus:border-primary h-14 placeholder:text-gray-400 p-4 border-r-0 text-base font-medium transition-all"
                        placeholder="••••••••••••"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <div 
                        className="flex border-2 border-gray-200 dark:border-gray-700 bg-transparent items-center justify-center px-4 border-l-0 text-gray-400 hover:text-primary cursor-pointer"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    className="w-full flex items-center justify-center bg-primary hover:bg-primary/90 text-white h-16 px-6 rounded-none transition-all group overflow-hidden relative disabled:opacity-70 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={isSigningUp}
                  >
                    <span className="relative z-10 text-sm font-black uppercase tracking-[0.2em]">{isSigningUp ? 'Creating Account...' : 'Create Account'}</span>
                    {!isSigningUp && <div className="absolute inset-0 bg-black/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>}
                  </button>
                </form>

                {/* Footer Link */}
                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                  <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-tight">Already registered?</p>
                  <Link to="/auth/signin" className="text-primary text-xs font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
                    Login here
                  </Link>
                </div>
              </div>

              {/* Secondary Accents */}
              <div className="mt-8 flex justify-between items-center opacity-40 grayscale">
                <div className="h-[2px] flex-1 bg-gray-300 dark:bg-gray-700"></div>
                <div className="mx-4 text-[10px] font-black tracking-widest text-gray-400 uppercase">System Status: Online</div>
                <div className="h-[2px] flex-1 bg-gray-300 dark:bg-gray-700"></div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="p-10 text-center">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-[0.3em]">
              © 2026 AiQA Technologies / All Rights Reserved
            </p>
          </footer>
        </div>

        {/* Decorative Corner Element */}
        <div className="fixed bottom-0 left-0 p-8 z-0">
          <div className="w-24 h-24 border-l-2 border-b-2 border-primary/20"></div>
        </div>
      </div>
    </>
  )
}