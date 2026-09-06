import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, loginGoogle, enterDemoMode, authError, firebaseConfigured } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(location.state?.authError || '')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      nav(location.state?.from?.pathname || '/', { replace: true })
    } catch (err) {
      setError(err?.message || 'Unable to sign in.')
    } finally {
      setBusy(false)
    }
  }

  async function google() {
    setError('')
    setBusy(true)
    try {
      await loginGoogle()
      nav('/', { replace: true })
    } catch (err) {
      setError(err?.message || 'Google sign-in failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your workspace">
      {!firebaseConfigured && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Firebase is not configured yet. You can use Demo Mode now, or add the Firebase values to <code>.env</code>.
        </div>
      )}
      {(error || authError) && <p className="mb-3 text-sm text-red-500">{error || authError}</p>}
      <form onSubmit={submit} className="space-y-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="field" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="field" />
        <button disabled={busy} className="primary w-full disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <button disabled={busy} onClick={google} className="secondary w-full mt-3 disabled:opacity-50">Continue with Google</button>
      <button disabled={busy} onClick={() => { enterDemoMode(); nav('/', { replace: true }) }} className="secondary w-full mt-3 disabled:opacity-50">Enter Demo Mode</button>
      <p className="text-sm text-slate-500 mt-5">No account? <Link className="text-blue-600" to="/signup">Create one</Link></p>
    </AuthShell>
  )
}

function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 dark:bg-[#090D16] p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 shadow-sm">
        <div className="h-10 w-10 rounded-xl bg-blue-600 grid place-items-center text-white font-bold mb-5">W</div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{title}</h1>
        <p className="text-slate-500 mt-1 mb-6">{subtitle}</p>
        {children}
      </div>
    </div>
  )
}
