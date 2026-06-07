import { useState } from 'react'
import { HeartPulse, LogOut } from 'lucide-react'
import UploadZone from './components/UploadZone'
import ProcessingView from './components/ProcessingView'
import Dashboard from './components/Dashboard/Dashboard'
import {
  uploadReport,
  interpretStructured,
  getAuthToken,
  clearAuthToken,
  loginUser,
  registerUser,
} from './lib/api'

const APP_STATE = {
  IDLE: 'IDLE',
  PROCESSING: 'PROCESSING',
  RESOLVED: 'RESOLVED',
}

function normalizeStructured(structured) {
  if (!structured) return structured

  return {
    ...structured,
    measurements: (structured.measurements ?? []).map((m) => ({
      ...m,
      value: m.normalizedValue ?? (m.rawValue != null ? Number(m.rawValue) : null),
      unit: m.unit ?? m.normalizedUnit,
      referenceRange: m.referenceRange,
    })),
  }
}

function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const json =
        mode === 'register'
          ? await registerUser({ name, email, password })
          : await loginUser({ email, password })

      onAuthenticated(json.user)
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md glass-card shadow-ambient rounded-2xl p-8 border border-outline-variant/20">
        <h1 className="text-2xl font-semibold text-primary mb-2">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-on-surface-variant text-sm mb-6">
          Sign in to upload reports and track your health timeline.
        </p>

        {error && (
          <div className="mb-4 bg-error-container text-error rounded-xl p-4 text-sm border border-error/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-on-surface mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-on-surface mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-on-surface mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-outline-variant/30 bg-surface px-4 py-2.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary rounded-xl py-2.5 font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError(null)
            }}
            className="text-primary font-medium hover:underline"
          >
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

function AppHeader({ user, onLogout }) {
  return (
    <header className="bg-surface/90 backdrop-blur-md border-b border-outline-variant/20 px-6 py-4">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <HeartPulse className="text-primary" size={28} />
          <span className="font-semibold text-primary text-lg">HealthLens AI</span>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-on-surface-variant hidden sm:inline">
              {user.name || user.email}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getAuthToken())
  const [user, setUser] = useState(null)
  const [appState, setAppState] = useState(APP_STATE.IDLE)
  const [dashboardData, setDashboardData] = useState(null)
  const [error, setError] = useState(null)

  function handleAuthenticated(nextUser) {
    setUser(nextUser)
    setIsAuthenticated(true)
    setError(null)
  }

  function handleLogout() {
    clearAuthToken()
    setIsAuthenticated(false)
    setUser(null)
    setAppState(APP_STATE.IDLE)
    setDashboardData(null)
    setError(null)
  }

  async function handleFileSelected(file) {
    setError(null)
    setAppState(APP_STATE.PROCESSING)

    try {
      const uploadJson = await uploadReport(file)
      const interpretJson = await interpretStructured(uploadJson.structured)

      setDashboardData({
        success: true,
        data: interpretJson.data,
        structured: normalizeStructured(uploadJson.structured),
      })
      setAppState(APP_STATE.RESOLVED)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setAppState(APP_STATE.IDLE)
    }
  }

  return (
    <>
      <AppHeader user={isAuthenticated ? user : null} onLogout={handleLogout} />

      {!isAuthenticated && <AuthForm onAuthenticated={handleAuthenticated} />}

      {isAuthenticated && appState === APP_STATE.IDLE && (
        <UploadZone onFileSelected={handleFileSelected} error={error} />
      )}

      {isAuthenticated && appState === APP_STATE.PROCESSING && <ProcessingView />}

      {isAuthenticated && appState === APP_STATE.RESOLVED && dashboardData && (
        <Dashboard payload={dashboardData} />
      )}
    </>
  )
}
