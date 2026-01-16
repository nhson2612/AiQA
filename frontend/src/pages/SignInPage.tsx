import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useRecoilValue } from 'recoil'
import { authErrorAtom } from '@/atoms/authAtom'
import { Alert } from '@/components/common/Alert'

export const SignInPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signin, isSigningIn } = useAuth()
  const error = useRecoilValue(authErrorAtom)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    signin({ email, password }, {
      onSuccess: () => {
        navigate('/documents')
      },
    } as any)
  }

  return (
    <>
      <style>{`
        .bg-grid-pattern {
            background-color: #fcfcfc;
            background-image: 
                linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                linear-gradient(to bottom, #e5e7eb 1px, transparent 1px);
            background-size: 40px 40px;
        }
        .angular-graphic {
            clip-path: polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%, 40% 50%);
            background: #fe512a;
        }
        .input-underline {
            border: none;
            border-bottom: 1px solid #d1d5db;
            background: transparent;
            transition: border-color 0.2s;
        }
        .input-underline:focus {
            border-bottom: 2px solid #fe512a;
            box-shadow: none;
            outline: none;
        }
      `}</style>
      <div className="bg-grid-pattern font-sans text-slate-900 min-h-screen flex items-center justify-center overflow-hidden relative">
        <div className="fixed inset-0 z-0 pointer-events-none flex justify-end">
          <div className="w-1/2 h-full angular-graphic opacity-100 hidden lg:block"></div>
          <div className="absolute top-20 right-20 text-white/20 font-mono text-8xl font-black select-none hidden lg:block">
            QA_ENGINE_V2
          </div>
        </div>
        <main className="relative z-10 w-full max-w-6xl px-6 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="w-full lg:w-1/2 flex flex-col items-start">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 bg-brand-orange flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-3xl font-bold">terminal</span>
              </div>
              <h1 className="text-4xl font-black tracking-tighter uppercase font-mono">AiQA</h1>
            </div>
            <div className="space-y-4 max-w-md">
              <h2 className="text-6xl font-black leading-none tracking-tight text-slate-900">
                PRECISION<br /><span className="text-brand-orange">SYSTEMS</span>
              </h2>
              <p className="text-slate-500 font-mono text-sm border-l-2 border-brand-orange pl-4 py-2">
                ESTABLISHING SECURE PROTOCOL...<br />
                STATUS: READY_FOR_AUTHENTICATION
              </p>
            </div>
          </div>
          <div
            className="w-full max-w-md bg-white border border-slate-200 p-8 sm:p-12 shadow-[20px_20px_0px_0px_rgba(0,0,0,0.05)]">
            <div className="mb-10">
              <h3 className="text-2xl font-bold tracking-tight uppercase mb-1">User Login</h3>
              <div className="w-12 h-1 bg-brand-orange mb-6"></div>
              {error && (
                  <div className="mb-4">
                    <Alert type="error">{error}</Alert>
                  </div>
              )}
            </div>
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Account
                  Identifier</label>
                <div className="relative">
                  <input
                    className="w-full h-12 input-underline px-0 text-slate-900 font-mono placeholder:text-slate-300"
                    placeholder="user@system.ai"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Access
                    Key</label>
                  <a className="text-[10px] font-bold text-slate-400 hover:text-brand-orange transition-colors uppercase font-mono"
                    href="#">Recover</a>
                </div>
                <div className="relative">
                  <input
                    className="w-full h-12 input-underline px-0 text-slate-900 font-mono placeholder:text-slate-300"
                    placeholder="••••••••••••"
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input className="h-4 w-4 border border-slate-300 text-brand-orange focus:ring-0 focus:ring-offset-0 rounded-none"
                  id="remember" type="checkbox" />
                <label className="ml-3 text-xs font-bold uppercase tracking-tight text-slate-500 font-mono"
                  htmlFor="remember">Persistent Session</label>
              </div>
              <button
                className="group relative w-full h-14 bg-brand-orange text-white font-bold text-sm uppercase tracking-[0.2em] transition-all hover:brightness-110 active:translate-y-px flex items-center justify-center gap-3 overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                type="submit"
                disabled={isSigningIn}
              >
                <span>{isSigningIn ? 'Authenticating...' : 'Execute Sign-In'}</span>
                {!isSigningIn && <span
                  className="material-symbols-outlined text-xl transition-transform group-hover:translate-x-1">arrow_right_alt</span>}
              </button>
            </form>
            <div className="mt-12 flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-slate-100"></div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono">Third Party
                  Auth</span>
                <div className="h-[1px] flex-1 bg-slate-100"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  className="flex items-center justify-center gap-2 h-12 border border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-colors">
                  Google
                </button>
                <button
                  className="flex items-center justify-center gap-2 h-12 border border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-colors">
                  GitHub
                </button>
              </div>
            </div>
            <div className="mt-10 pt-8 border-t border-slate-100 flex justify-center">
              <Link to="/auth/signup"
                className="text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-brand-orange transition-colors font-mono">
                Register New Node
              </Link>
            </div>
          </div>
        </main>
        <div
          className="fixed bottom-8 left-8 flex flex-col font-mono text-[10px] text-slate-400 uppercase tracking-[0.2em] pointer-events-none">
          <span>AiQA Deployment 2026.01</span>
          <span className="text-brand-orange/50">Core-V8.2.1 // System_Secure</span>
        </div>
      </div>
    </>
  )
}