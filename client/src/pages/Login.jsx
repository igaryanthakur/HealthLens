import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Shield,
} from 'lucide-react'
import { loginUser } from '../lib/api'
import AuthBrandPanel from '../components/Auth/AuthBrandPanel'
import AuthBackHome from '../components/Auth/AuthBackHome'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <main className="flex w-full min-h-screen">
      <AuthBrandPanel />

      <section className="w-full lg:w-1/2 flex items-center justify-center p-margin-mobile md:p-margin-desktop bg-background">
        <div className="w-full max-w-md">
          <AuthBackHome />

          <div className="lg:hidden flex items-center justify-center gap-xs mb-xl">
            <Shield className="text-primary text-3xl" />
            <span className="font-headline-md text-headline-md font-bold text-on-surface">
              HealthLens AI
            </span>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl p-md md:p-lg shadow-ambient border border-outline-variant/30">
            <div className="mb-xl text-center md:text-left">
              <h2 className="font-headline-lg text-headline-lg md:font-headline-lg md:text-headline-lg text-on-surface mb-xs">
                Welcome back
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Enter your credentials to access your Health Vault
              </p>
            </div>

            {error && (
              <div className="mb-lg bg-error-container text-error rounded-xl p-md text-sm border border-error/20">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-lg">
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface ml-1" htmlFor="email">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-md top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    className="w-full pl-xl pr-md py-md bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-md text-body-md outline-none"
                    id="email"
                    name="email"
                    placeholder="alex.rivers@vault.com"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface ml-1" htmlFor="password">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-md top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors" size={20} />
                  <input
                    className="w-full pl-xl pr-[48px] py-md bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-body-md text-body-md outline-none"
                    id="password"
                    name="password"
                    placeholder="••••••••••••"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="absolute right-md top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                className="w-full bg-primary hover:bg-primary-container text-white font-label-md text-label-md py-md rounded-xl shadow-md active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-xs disabled:opacity-60"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <span>Access Health Vault</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-xl text-center">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Don&apos;t have an account?
                <Link
                  className="text-primary font-bold hover:underline transition-all ml-1"
                  to="/register"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          <footer className="mt-lg flex justify-center gap-md text-outline font-label-sm text-label-sm">
            <Link className="hover:text-primary transition-colors" to="/privacy">
              Privacy Policy
            </Link>
            <span className="text-outline-variant">•</span>
            <Link className="hover:text-primary transition-colors" to="/terms">
              Terms of Service
            </Link>
            <span className="text-outline-variant">•</span>
            <Link className="hover:text-primary transition-colors" to="/contact">
              Support
            </Link>
          </footer>
        </div>
      </section>
    </main>
  )
}
