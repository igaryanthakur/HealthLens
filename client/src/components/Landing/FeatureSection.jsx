import { FileText, LineChart, ShieldCheck, Sparkles } from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'Understand every report',
    description:
      'Upload a lab PDF and HealthLens extracts your biomarkers into clean, structured data — no medical degree required.',
  },
  {
    icon: LineChart,
    title: 'Track trends over time',
    description:
      'See how your health evolves across months and years with longitudinal charts that connect every report.',
  },
  {
    icon: Sparkles,
    title: 'Insights, not summaries',
    description:
      'Get clear, actionable guidance tailored to your results — what changed, why it matters, and what to do next.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by design',
    description:
      'Your records stay yours. HealthLens is built around your privacy with secure, encrypted storage.',
  },
]

export default function FeatureSection() {
  return (
    <section className="mx-auto max-w-[1100px] px-6 py-20 md:py-28">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-primary">Built for the long run</p>
        <h2 className="mt-3 text-balance text-3xl font-semibold text-on-surface md:text-4xl">
          A calmer way to understand your health
        </h2>
        <p className="mt-4 text-pretty text-lg leading-relaxed text-on-surface-variant">
          HealthLens turns scattered lab reports into one clear, intelligent picture of your
          wellbeing — designed to be used for years, not just one visit.
        </p>
      </div>

      <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-outline-variant/20 bg-outline-variant/20 sm:grid-cols-2">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <div key={feature.title} className="bg-surface-container-lowest p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon size={20} />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-on-surface">{feature.title}</h3>
              <p className="mt-2 leading-relaxed text-on-surface-variant">
                {feature.description}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
