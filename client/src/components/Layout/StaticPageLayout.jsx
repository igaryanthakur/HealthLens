import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function StaticSection({ title, children }) {
  return (
    <section className="mb-10">
      {title && (
        <h2 className="text-xl font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">
          {title}
        </h2>
      )}
      <div className="space-y-4 text-slate-600 leading-relaxed">{children}</div>
    </section>
  )
}

export function StaticList({ items }) {
  return (
    <ul className="list-disc pl-5 space-y-2 marker:text-teal-600">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

export default function StaticPageLayout({
  title,
  subtitle,
  badge,
  children,
  backTo = '/',
  backLabel = 'Back to home',
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-5 md:px-8 py-10 md:py-14">
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800 mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            {backLabel}
          </Link>
          {badge && (
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 mb-3">
              {badge}
            </p>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-4 text-lg text-slate-600 leading-relaxed max-w-2xl">{subtitle}</p>
          )}
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-5 md:px-8 py-10 md:py-14">{children}</article>
    </div>
  )
}
