import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

const steps = [
  {
    step: '01',
    title: 'Upload your report',
    description: 'Drop in a lab PDF or photo. HealthLens reads it instantly, no manual entry.',
  },
  {
    step: '02',
    title: 'We structure the data',
    description: 'Biomarkers are extracted, normalized, and organized into a clean profile.',
  },
  {
    step: '03',
    title: 'See your intelligence',
    description: 'Track trends, get AI insights, and watch your vitality score grow over time.',
  },
]

export default function HowItWorks() {
  return (
    <section className="border-y border-outline-variant/20 bg-surface-container-low/40">
      <div className="mx-auto max-w-[1100px] px-6 py-20 md:py-28">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-primary">How it works</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold text-on-surface md:text-4xl">
            From a confusing PDF to clarity in seconds
          </h2>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="relative">
              <span className="text-sm font-semibold text-primary">{item.step}</span>
              <h3 className="mt-3 text-xl font-semibold text-on-surface">{item.title}</h3>
              <p className="mt-2 leading-relaxed text-on-surface-variant">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start gap-4 rounded-3xl bg-primary p-8 text-on-primary sm:flex-row sm:items-center sm:justify-between md:p-10">
          <div>
            <h3 className="text-2xl font-semibold text-balance">
              Start building your health timeline
            </h3>
            <p className="mt-2 text-on-primary/80">
              Free to begin. Your first report analyzed in under a minute.
            </p>
          </div>
          <Link
            to="/register"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-surface-container-lowest px-6 py-3 font-medium text-primary transition-opacity hover:opacity-90"
          >
            Get started
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
