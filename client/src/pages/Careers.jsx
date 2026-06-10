import { Link } from 'react-router-dom'
import { Briefcase, Heart, Rocket, Users } from 'lucide-react'
import StaticPageLayout, { StaticSection } from '../components/Layout/StaticPageLayout'

const VALUES = [
  {
    icon: Heart,
    title: 'Patient-first intelligence',
    text: 'We build tools that help people understand their health over time — not one-off PDF summaries.',
  },
  {
    icon: Rocket,
    title: 'Engineering rigor',
    text: 'Deterministic extraction, 191 automated tests, and honest AI fallbacks are core to how we ship.',
  },
  {
    icon: Users,
    title: 'Small team, high ownership',
    text: 'Founders wear many hats: product, full-stack, demo reliability, and evaluation storytelling.',
  },
]

export default function Careers() {
  return (
    <StaticPageLayout
      badge="Company"
      title="Careers"
      subtitle="We're not hiring right now — but we're always interested in people who care about health technology done right."
    >
      <div className="rounded-2xl bg-teal-50 border border-teal-100 px-6 py-5 mb-10">
        <div className="flex items-start gap-3">
          <Briefcase className="text-teal-700 shrink-0 mt-0.5" size={22} />
          <div>
            <p className="font-semibold text-teal-900">Current status: Not hiring</p>
            <p className="text-sm text-teal-800 mt-1 leading-relaxed">
              HealthLens AI is in an academic evaluation and freeze phase. We are not accepting
              applications for paid roles at this time. Thank you for your interest.
            </p>
          </div>
        </div>
      </div>

      <StaticSection title="About the team">
        <p>
          HealthLens AI was built by <strong>Aryan Thakur</strong>, <strong>Kishor Nadar</strong>,
          and <strong>Palraj Thevar</strong> as a Personal Health Intelligence System for a major
          university project. The platform spans document upload, deterministic clinical extraction,
          MongoDB persistence, longitudinal dashboards, a personal health repository, doctor
          summary export, and a bounded AI assistant.
        </p>
        <p>
          Our north star: scattered medical documents → structured health memory → trends and
          insights → safer doctor handoffs.
        </p>
      </StaticSection>

      <StaticSection title="What we value">
        <div className="grid gap-4 sm:grid-cols-1">
          {VALUES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="flex gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Icon size={20} className="text-teal-700" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </StaticSection>

      <StaticSection title="Future opportunities">
        <p>
          After evaluation, we may explore internships, research collaborations, or open-source
          contributions in areas such as:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-600 marker:text-teal-600">
          <li>Clinical NLP and OCR quality for Indian lab report layouts</li>
          <li>Longitudinal analytics and explainable AI safety</li>
          <li>React UX for health literacy and accessibility</li>
          <li>DevOps, testing, and demo reliability for health SaaS</li>
        </ul>
        <p className="mt-4">
          None of these are open roles today. If you want to stay in touch, say hello via{' '}
          <Link to="/contact" className="text-teal-700 hover:underline font-medium">
            Contact Support
          </Link>
          .
        </p>
      </StaticSection>

      <StaticSection title="Open source">
        <p>
          HealthLens is documented for public repository release. Contributors should read{' '}
          <code className="text-sm bg-slate-100 px-1.5 py-0.5 rounded">README.md</code> and{' '}
          <code className="text-sm bg-slate-100 px-1.5 py-0.5 rounded">PROJECT_CONTEXT.md</code>{' '}
          before proposing changes. We welcome thoughtful issues and PRs that respect the freeze
          policy during evaluation season.
        </p>
      </StaticSection>
    </StaticPageLayout>
  )
}
