import { useEffect, useState } from 'react'
import { Activity } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { fetchReportHistory } from '../../lib/api'

function formatChartDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function HealthTimelineCard({ className = '' }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const json = await fetchReportHistory()
        if (!cancelled) setHistory(json.reports ?? [])
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load health history.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div
      className={`bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-ambient p-6 ${className}`}
    >
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Activity className="text-primary" size={22} />
          <h2 className="text-lg font-semibold text-on-surface">30-Day Health Trend</h2>
        </div>
        <p className="text-sm text-on-surface-variant mt-1 ml-8">
          Vitality score across your uploaded reports
        </p>
      </div>

      {loading && (
        <p className="text-sm text-on-surface-variant text-center py-24">
          Loading health history...
        </p>
      )}

      {!loading && error && (
        <p className="text-sm text-error text-center py-24">{error}</p>
      )}

      {!loading && !error && history.length === 0 && (
        <p className="text-sm text-on-surface-variant text-center py-24">
          Upload a report to start tracking your vitality score over time.
        </p>
      )}

      {!loading && !error && history.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(188, 201, 198, 0.4)" />
            <XAxis
              dataKey="reportDate"
              tickFormatter={formatChartDate}
              tick={{ fill: '#3d4947', fontSize: 12 }}
              axisLine={{ stroke: '#bcc9c6' }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#3d4947', fontSize: 12 }}
              axisLine={{ stroke: '#bcc9c6' }}
            />
            <Tooltip
              labelFormatter={formatChartDate}
              formatter={(value) => [`${value}`, 'Vitality Score']}
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid rgba(188, 201, 198, 0.4)',
                backgroundColor: '#ffffff',
                boxShadow: '0 15px 30px -5px rgba(0, 106, 97, 0.08)',
              }}
            />
            <Line
              type="monotone"
              dataKey="vitalityScore"
              stroke="#00685f"
              strokeWidth={3}
              dot={{ fill: '#00685f', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
