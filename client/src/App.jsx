import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import Navbar from './components/Layout/Navbar'
import Footer from './components/Layout/Footer'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Chat from './pages/Chat'
import { getAuthToken } from './lib/api'

const Vault = lazy(() => import('./pages/Vault'))

function RouteLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  )
}

function ProtectedRoute({ children }) {
  if (!getAuthToken()) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppContent() {
  const { pathname } = useLocation()
  const hideGlobalFooter = ['/', '/login', '/register', '/chat'].includes(pathname)
  const hideNavbar = ['/login', '/register'].includes(pathname)

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vault"
          element={
            <ProtectedRoute>
              <Suspense fallback={<RouteLoader />}>
                <Vault />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
      </Routes>
      {!hideGlobalFooter && <Footer />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
