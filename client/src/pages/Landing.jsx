import { Link } from 'react-router-dom'
import { HeartPulse, ArrowRight } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center p-6">
      <div className="max-w-3xl w-full text-center">
        <div className="glass-card shadow-ambient rounded-2xl p-10 md:p-14 border border-outline-variant/20">
          <HeartPulse className="mx-auto text-primary mb-6" size={48} />

          <h1 className="text-4xl md:text-5xl font-semibold text-primary mb-4">
            Empathetic Precision
          </h1>

          <p className="text-lg text-on-surface-variant mb-3 max-w-xl mx-auto">
            HealthLens AI is your Personal Health Intelligence System — understand, organize,
            and analyze your medical records over time.
          </p>

          <p className="text-sm text-on-surface-variant mb-8 max-w-lg mx-auto">
            Extract structured biomarkers, track longitudinal trends, and receive actionable
            insights — not just another report summary.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-xl px-6 py-3 font-medium hover:opacity-90 transition-opacity"
            >
              Get Started
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
