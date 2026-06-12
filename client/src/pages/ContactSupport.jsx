import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone, Users } from 'lucide-react'
import StaticPageLayout, { StaticSection } from '../components/Layout/StaticPageLayout'

const FOUNDERS = [
  {
    name: 'Aryan Thakur',
    role: 'Co-Founder & Full-Stack Lead',
    phone: '81XXXXXX81',
    email: 'aryan@gmail.com',
    bio: 'Leads product architecture, backend extraction pipeline, and the HealthLens evaluation roadmap.',
  },
  {
    name: 'Kishor Nadar',
    role: 'Co-Founder',
    phone: '82XXXXXX82',
    email: 'kishor.nadar@gmail.com',
    bio: 'Contributes to platform strategy, integrations, and demo reliability for university evaluation.',
  },
  {
    name: 'Palraj Thevar',
    role: 'Co-Founder',
    phone: '83XXXXXX83',
    email: 'palraj.thevar@gmail.com',
    bio: 'Supports frontend experience, user flows, and health intelligence storytelling across the product.',
  },
]

function FounderCard({ founder }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-lg shrink-0">
          {founder.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-slate-900">{founder.name}</h3>
          <p className="text-sm text-teal-700 font-medium mt-0.5">{founder.role}</p>
          <p className="text-sm text-slate-600 mt-3 leading-relaxed">{founder.bio}</p>
          <div className="mt-4 space-y-2 text-sm">
            <a
              href={`tel:${founder.phone}`}
              className="flex items-center gap-2 text-slate-700 hover:text-teal-700 transition-colors"
            >
              <Phone size={15} className="text-slate-400 shrink-0" />
              {founder.phone}
            </a>
            <a
              href={`mailto:${founder.email}`}
              className="flex items-center gap-2 text-slate-700 hover:text-teal-700 transition-colors break-all"
            >
              <Mail size={15} className="text-slate-400 shrink-0" />
              {founder.email}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ContactSupport() {
  return (
    <StaticPageLayout
      badge="Company"
      title="Contact Support"
      subtitle="Reach the HealthLens AI founding team for product questions, demo support, or partnership enquiries."
    >
      <StaticSection title="HealthLens AI">
        <p>
          HealthLens is a Personal Health Intelligence System built by a university project team.
          We help patients turn scattered PDFs and prescriptions into structured health memory,
          longitudinal insights, and doctor-ready summaries.
        </p>
        <div className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-3 flex items-start gap-3 text-sm text-slate-700">
          <MapPin size={18} className="text-teal-600 shrink-0 mt-0.5" />
          <p>
            <strong>Project team:</strong> HealthLens AI — academic / demonstration deployment.
            For evaluation demos, see{' '}
            <Link to="/login" className="text-teal-700 hover:underline">
              demo login
            </Link>{' '}
            credentials in our repository documentation.
          </p>
        </div>
      </StaticSection>

      <StaticSection title="Founders">
        <div className="flex items-center gap-2 text-slate-700 mb-4">
          <Users size={18} className="text-teal-600" />
          <p className="text-sm font-medium">Direct contact — typical response within 1–2 business days</p>
        </div>
        <div className="space-y-4 not-prose">
          {FOUNDERS.map((f) => (
            <FounderCard key={f.email} founder={f} />
          ))}
        </div>
      </StaticSection>

      <StaticSection title="What we can help with">
        <ul className="grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
          {[
            'Demo account and seed data questions',
            'Bug reports and platform feedback',
            'University evaluation / viva demonstrations',
            'Privacy and terms clarifications',
            'Open-source and documentation enquiries',
            'Partnership or research collaboration (exploratory)',
          ].map((item) => (
            <li
              key={item}
              className="rounded-lg bg-white border border-slate-100 px-4 py-3 shadow-sm"
            >
              {item}
            </li>
          ))}
        </ul>
      </StaticSection>

      <StaticSection title="Before you write">
        <p>
          For technical setup (MongoDB, Gemini API, seed script), see{' '}
          <code className="text-sm bg-slate-100 px-1 rounded">README.md</code> in the repository
          root and <code className="text-sm bg-slate-100 px-1 rounded">docs/DEMO.md</code>. HealthLens
          does not provide clinical advice via support channels.
        </p>
      </StaticSection>
    </StaticPageLayout>
  )
}
