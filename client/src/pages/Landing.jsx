import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Brain,
  FileText,
  Heart,
  HeartPulse,
  LayoutDashboard,
  LayoutGrid,
  LineChart,
  Sparkles,
  Upload,
} from 'lucide-react'
import { getAuthToken } from '../lib/api'

const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    icon: Upload,
    title: 'Upload',
    description: 'Upload your medical report as a PDF or image file.',
  },
  {
    step: 2,
    icon: FileText,
    title: 'OCR Extraction',
    description: 'Deterministic parsing extracts structured biomarkers and vitals.',
  },
  {
    step: 3,
    icon: Brain,
    title: 'AI Analysis',
    description: 'Gemini interprets your results with profile-aware health insights.',
  },
  {
    step: 4,
    icon: LayoutGrid,
    title: 'Get Insights',
    description: 'View trends, recommendations, and your personal health timeline.',
  },
]

export default function Landing() {
  const isLoggedIn = !!getAuthToken()
  const uploadHref = isLoggedIn ? '/dashboard' : '/register'

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="max-w-[1440px] mx-auto px-6 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              <Sparkles size={16} />
              AI-Powered Precision
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-semibold text-on-surface leading-tight mb-6">
              Understand Medical Reports Instantly with AI
            </h1>

            <p className="text-lg text-on-surface-variant mb-8 max-w-xl">
              Upload your lab reports and receive structured summaries, longitudinal health
              trends, and actionable recommendations — your Personal Health Intelligence System.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                to={uploadHref}
                className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-xl px-6 py-3 font-medium hover:opacity-90 transition-opacity"
              >
                <Upload size={18} />
                Upload Report
              </Link>
              <a
                href="/#how-it-works"
                className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
              >
                View Demo
                <ArrowRight size={18} />
              </a>
            </div>
          </div>

          <div className="w-full aspect-video bg-surface-container-high rounded-xl shadow-ambient border border-white/40 flex items-center justify-center">
            <LayoutDashboard className="text-primary/40" size={64} />
          </div>
        </div>
      </section>

      {/* Features Bento */}
      <section id="features" className="max-w-[1440px] mx-auto px-6 py-16 md:py-20 scroll-mt-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-on-surface mb-4">
            Smarter Insights, Better Care
          </h2>
          <p className="text-on-surface-variant max-w-2xl mx-auto">
            HealthLens transforms complex medical reports into clear, actionable intelligence
            you can track over time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="md:col-span-2 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-ambient p-6 md:p-8">
            <h3 className="text-xl font-semibold text-on-surface mb-3">AI Report Analysis</h3>
            <p className="text-on-surface-variant mb-6 max-w-lg">
              Upload any lab report and get instant structured extraction of biomarkers,
              reference ranges, and clinical flags — powered by deterministic OCR, not guesswork.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-medium bg-surface-container-low text-primary px-3 py-1.5 rounded-full border border-primary/20">
                OCR Extraction
              </span>
              <span className="text-xs font-medium bg-surface-container-low text-primary px-3 py-1.5 rounded-full border border-primary/20">
                Named Entity Recognition
              </span>
            </div>
          </div>

          <div className="bg-primary text-on-primary rounded-2xl shadow-ambient p-6 md:p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-3">Smart Health Timeline</h3>
              <p className="text-on-primary/80 text-sm mb-6">
                Track your vitality score and biomarker trends across every report you upload.
              </p>
            </div>
            <Link
              to={uploadHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-on-primary hover:underline"
            >
              Explore timeline
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-ambient p-6 flex flex-col justify-between">
            <LineChart className="text-primary mb-4" size={32} />
            <div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">Trend Analytics</h3>
              <p className="text-sm text-on-surface-variant">
                Visualize how your key biomarkers change over weeks and months.
              </p>
            </div>
          </div>

          <div className="md:col-span-2 bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-ambient p-6 md:p-8">
            <h3 className="text-xl font-semibold text-on-surface mb-3">AI Recommendations</h3>
            <p className="text-on-surface-variant mb-6">
              Receive personalized, explainable health tips based on your results and profile.
            </p>
            <div className="bg-surface-container-low rounded-xl border border-primary/20 p-4 max-w-md">
              <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                Insight: Hydration
              </p>
              <p className="text-sm text-on-surface">
                Increase water intake and prioritize light activity today for better recovery
                and sleep quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-[1440px] mx-auto px-6 py-16 md:py-20 scroll-mt-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-on-surface mb-4">
            How It Works
          </h2>
          <p className="text-on-surface-variant max-w-xl mx-auto">
            From upload to insight in four simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {HOW_IT_WORKS_STEPS.map(({ step, icon: Icon, title, description }) => (
            <div key={step} className="text-center">
              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-container-low border border-outline-variant/20 mb-4">
                <Icon className="text-primary" size={24} />
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary text-on-primary text-xs font-bold flex items-center justify-center">
                  {step}
                </span>
              </div>
              <h3 className="font-semibold text-on-surface mb-2">{title}</h3>
              <p className="text-sm text-on-surface-variant">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Impact */}
      <section id="impact" className="max-w-[1440px] mx-auto px-6 py-16 md:py-20 scroll-mt-20">
        <div className="bg-primary rounded-3xl shadow-ambient overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
          <div className="relative grid lg:grid-cols-2 gap-8 items-center p-8 md:p-12 lg:p-16">
            <div>
              <span className="inline-block text-xs font-semibold tracking-widest text-on-primary/70 uppercase mb-4">
                Social Impact
              </span>
              <h2 className="text-2xl md:text-3xl font-semibold text-on-primary mb-4">
                Improving healthcare accessibility for everyone
              </h2>
              <p className="text-on-primary/80 mb-8 max-w-lg">
                HealthLens bridges the gap between complex medical jargon and everyday
                understanding, empowering patients to take an active role in their health journey.
              </p>
              <div className="flex flex-wrap gap-8">
                <div>
                  <p className="text-3xl font-bold text-on-primary">50k+</p>
                  <p className="text-sm text-on-primary/70">Reports Analyzed</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-on-primary">85%</p>
                  <p className="text-sm text-on-primary/70">Improved Literacy</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48 md:w-56 md:h-56">
                <div className="absolute inset-0 rounded-full bg-on-primary/10 animate-pulse" />
                <div className="absolute inset-4 rounded-full bg-on-primary/20 flex items-center justify-center">
                  <Heart className="text-on-primary" size={64} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1440px] mx-auto px-6 py-16 md:py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-semibold text-on-surface mb-4">
          Ready to take control of your health?
        </h2>
        <p className="text-on-surface-variant mb-8 max-w-xl mx-auto">
          Join HealthLens AI and start building your personal health intelligence today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to={uploadHref}
            className="inline-flex items-center gap-2 bg-primary text-on-primary rounded-xl px-8 py-3 font-medium hover:opacity-90 transition-opacity"
          >
            Get Started for Free
            <ArrowRight size={18} />
          </Link>
          <a
            href="/#features"
            className="inline-flex items-center gap-2 bg-surface-container-lowest text-primary border border-outline-variant/30 rounded-xl px-8 py-3 font-medium hover:bg-surface-container-low transition-colors"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant/20 bg-surface-container-lowest">
        <div className="max-w-[1440px] mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="text-primary" size={22} />
            <span className="font-semibold text-primary">HealthLens AI</span>
          </div>
          <p className="text-xs text-on-surface-variant">
            &copy; {new Date().getFullYear()} HealthLens AI. All rights reserved.
          </p>
          <nav className="flex items-center gap-6">
            {['Privacy', 'Terms', 'Support', 'Contact'].map((label) => (
              <a
                key={label}
                href="#"
                className="text-xs text-on-surface-variant hover:text-primary transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  )
}
