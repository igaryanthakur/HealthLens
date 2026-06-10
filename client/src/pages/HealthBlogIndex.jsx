import { Link } from 'react-router-dom'
import { ArrowRight, Calendar } from 'lucide-react'
import StaticPageLayout from '../components/Layout/StaticPageLayout'

const POSTS = [
  {
    slug: 'regular-health-checkups',
    path: '/blog/regular-health-checkups',
    category: 'Preventive Healthcare',
    title: 'Why Regular Check-Ups Are Essential for Maintaining Good Health',
    excerpt:
      'Five reasons preventive visits matter — from catching inherited risks early to controlling chronic conditions and reducing long-term medical costs.',
    date: 'June 10, 2026',
    readTime: '6 min read',
  },
]

export default function HealthBlogIndex() {
  return (
    <StaticPageLayout
      badge="Health Blog"
      title="Health Blog"
      subtitle="Practical articles on preventive care, understanding lab reports, and building a longitudinal view of your health."
    >
      <div className="space-y-6">
        {POSTS.map((post) => (
          <article
            key={post.slug}
            className="group rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm hover:border-teal-200 hover:shadow-md transition-all"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 mb-2">
              {post.category}
            </p>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
              <Link to={post.path}>{post.title}</Link>
            </h2>
            <p className="mt-3 text-slate-600 leading-relaxed">{post.excerpt}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Calendar size={14} />
                {post.date}
              </span>
              <span>{post.readTime}</span>
            </div>
            <Link
              to={post.path}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              Read article
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </article>
        ))}
      </div>

      <p className="mt-12 text-sm text-slate-500 text-center">
        More articles coming after evaluation. Suggestions?{' '}
        <Link to="/contact" className="text-teal-700 hover:underline">
          Contact the team
        </Link>
        .
      </p>
    </StaticPageLayout>
  )
}
