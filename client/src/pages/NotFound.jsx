import { Link } from 'react-router-dom'
import { Home, LayoutDashboard } from 'lucide-react'
import { getAuthToken } from '../lib/api'

export default function NotFound() {
  const isLoggedIn = !!getAuthToken()

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">404</p>
      <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">Page not found</h1>
      <p className="text-sm text-slate-500 mt-2 max-w-md">
        This page does not exist. Use the links below to return to HealthLens AI.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-teal-700 hover:border-teal-200 transition-colors"
        >
          <Home size={16} />
          Home
        </Link>
        {isLoggedIn ? (
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
          >
            <LayoutDashboard size={16} />
            Dashboard
          </Link>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
          >
            Log in
          </Link>
        )}
      </div>
    </div>
  )
}
