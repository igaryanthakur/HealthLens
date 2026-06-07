import { Link, useNavigate } from 'react-router-dom'
import { HeartPulse, LogOut } from 'lucide-react'
import { clearAuthToken, getAuthToken } from '../../lib/api'

export default function Navbar() {
  const navigate = useNavigate()
  const isLoggedIn = !!getAuthToken()

  function handleLogout() {
    clearAuthToken()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant/20">
      <div className="max-w-[1440px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <HeartPulse className="text-primary" size={28} />
          <span className="font-semibold text-primary text-lg">HealthLens AI</span>
        </Link>

        <nav className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                className="text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-on-surface-variant hover:text-primary transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm bg-primary text-on-primary rounded-lg px-4 py-2 font-medium hover:opacity-90 transition-opacity"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
