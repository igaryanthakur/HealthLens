import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  HeartPulse,
  LayoutDashboard,
  Archive,
  FolderHeart,
  MessageCircle,
  Upload,
  LogOut,
  User,
  Menu,
  X,
} from 'lucide-react'
import { clearAuthToken, getAuthToken } from '../../lib/api'

const PUBLIC_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#impact', label: 'Impact' },
]

const AUTH_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/vault', label: 'Vault', icon: Archive },
  { to: '/repository', label: 'Repository', icon: FolderHeart },
  { to: '/chat', label: 'Assistant', icon: MessageCircle },
]

export default function Navbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isLoggedIn = !!getAuthToken()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    clearAuthToken()
    setMobileOpen(false)
    navigate('/login')
  }

  const isActive = (to) => pathname === to

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="max-w-[1440px] mx-auto px-5 md:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Brand */}
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 shrink-0"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <HeartPulse size={20} />
            </span>
            <span className="font-semibold text-slate-900 text-lg tracking-tight">
              HealthLens<span className="text-primary"> AI</span>
            </span>
          </Link>

          {isLoggedIn ? (
            <>
              {/* Desktop: centered pill nav */}
              <nav className="hidden md:flex items-center gap-1 rounded-full bg-slate-100/80 p-1">
                {AUTH_LINKS.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className={[
                      'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                      isActive(to)
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-slate-500 hover:text-slate-900',
                    ].join(' ')}
                  >
                    <Icon size={16} />
                    {label}
                  </Link>
                ))}
              </nav>

              {/* Desktop: right actions */}
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <Link
                  to="/dashboard?upload=1"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-container transition-colors"
                >
                  <Upload size={16} />
                  Upload
                </Link>
                <Link
                  to="/profile"
                  aria-label="Profile"
                  className={[
                    'flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
                    isActive('/profile')
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-slate-200 text-slate-500 hover:text-primary hover:border-primary/40',
                  ].join(' ')}
                >
                  <User size={18} />
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Log out"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-error hover:border-error/40 transition-colors"
                >
                  <LogOut size={16} />
                </button>
              </div>

              {/* Mobile: toggle */}
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle menu"
                className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </>
          ) : (
            <>
              <nav className="hidden md:flex items-center justify-center gap-6">
                {PUBLIC_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-sm text-slate-500 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm text-slate-600 hover:text-primary transition-colors px-2 py-2"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="text-sm bg-primary text-white rounded-xl px-4 py-2 font-medium hover:bg-primary-container transition-colors"
                >
                  Get Started
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Mobile: expandable menu */}
        {isLoggedIn && mobileOpen && (
          <div className="md:hidden border-t border-slate-200 py-3 space-y-1">
            {AUTH_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={[
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive(to)
                    ? 'bg-primary/5 text-primary'
                    : 'text-slate-600 hover:bg-slate-100',
                ].join(' ')}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
            <Link
              to="/dashboard?upload=1"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl bg-primary px-3 py-2.5 text-sm font-medium text-white"
            >
              <Upload size={18} />
              Upload Report
            </Link>
            <Link
              to="/profile"
              onClick={() => setMobileOpen(false)}
              className={[
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive('/profile')
                  ? 'bg-primary/5 text-primary'
                  : 'text-slate-600 hover:bg-slate-100',
              ].join(' ')}
            >
              <User size={18} />
              Profile
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <LogOut size={18} />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
