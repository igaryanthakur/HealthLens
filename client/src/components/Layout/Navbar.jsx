import { Link, useNavigate } from 'react-router-dom'
import { HeartPulse, LogOut, User } from 'lucide-react'
import { clearAuthToken, getAuthToken } from '../../lib/api'

const PUBLIC_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#impact', label: 'Impact' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const isLoggedIn = !!getAuthToken()

  function handleLogout() {
    clearAuthToken()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 w-full z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant/20">
      <div className="max-w-[1440px] mx-auto px-6 py-4 grid grid-cols-3 items-center gap-4">
        <Link to="/" className="flex items-center gap-2 justify-self-start">
          <HeartPulse className="text-primary" size={28} />
          <span className="font-semibold text-primary text-lg">HealthLens AI</span>
        </Link>

        <nav className="hidden md:flex items-center justify-center gap-6">
          {isLoggedIn ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/vault"
                className="text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                Vault
              </Link>
              <Link
                to="/chat"
                className="text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                Assistant
              </Link>
            </>
          ) : (
            PUBLIC_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                {link.label}
              </a>
            ))
          )}
        </nav>

        <div className="flex items-center justify-end gap-3">
          {isLoggedIn ? (
            <>
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors"
                aria-label="Profile"
              >
                <User size={20} />
                <span className="hidden lg:inline">Profile</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="text-sm bg-primary text-on-primary rounded-lg px-4 py-2 font-medium hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
