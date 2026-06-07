import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react'
import ProductPreview from '../components/Landing/ProductPreview'
import FeatureSection from '../components/Landing/FeatureSection'
import HowItWorks from '../components/Landing/HowItWorks'

export default function Landing() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-[1100px] px-6 pt-16 pb-24 text-center md:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-lowest px-3.5 py-1.5 text-sm text-on-surface-variant">
            <Sparkles size={14} className="text-primary" />
            Personal Health Intelligence
          </span>

          <h1 className="mx-auto mt-7 max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-on-surface md:text-6xl">
            Understand your health, one report at a time
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-on-surface-variant">
            HealthLens AI turns your lab reports into a clear, longitudinal picture of your
            wellbeing — with biomarker tracking and insights that grow smarter over time.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-on-primary transition-opacity hover:opacity-90"
            >
              Get started free
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-6 py-3 font-medium text-on-surface transition-colors hover:bg-surface-container-low"
            >
              Sign in
            </Link>
          </div>

          <p className="mt-5 inline-flex items-center gap-1.5 text-sm text-on-surface-variant">
            <ShieldCheck size={15} className="text-primary" />
            Private and encrypted. Your data stays yours.
          </p>
        </div>

        {/* Product preview centerpiece */}
        <div className="mx-auto max-w-[1000px] px-6 pb-20 md:pb-28">
          <ProductPreview />
        </div>
      </section>

      <FeatureSection />
      <HowItWorks />

      {/* Footer */}
      <footer className="border-t border-outline-variant/20">
        <div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
          <p className="text-sm text-on-surface-variant">
            &copy; {new Date().getFullYear()} HealthLens AI
          </p>
          <p className="text-sm text-on-surface-variant">
            Built for understanding, not diagnosing.
          </p>
        </div>
      </footer>
    </div>
  )
}
