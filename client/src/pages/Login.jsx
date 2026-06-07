import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { loginUser } from '../lib/api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await loginUser({ email, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md glass-card shadow-ambient rounded-2xl p-8 border border-outline-variant/20">
        <h1 className="text-2xl font-semibold text-primary mb-2">Welcome back</h1>
        <p className="text-on-surface-variant text-sm mb-6">
          Sign in to upload reports and track your health timeline.
        </p>

        {error && (
          <div className="mb-4 bg-error-container text-error rounded-xl p-4 text-sm border border-error/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            {loading ? 'Please wait...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}
