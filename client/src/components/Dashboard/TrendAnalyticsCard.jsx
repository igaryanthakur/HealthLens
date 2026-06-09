import { useMemo, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { buildMetricSeries, listAvailableMetrics } from '../../lib/trends'

function formatChartDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function TrendAnalyticsCard({ history = [], className = '' }) {
  const series = useMemo(() => buildMetricSeries(history), [history])
  const metricKeys = useMemo(() => listAvailableMetrics(series), [series])
  const [selected, setSelected] = useState(null)

  const activeKey = selected && series[selected] ? selected : metricKeys[0]
  const active = activeKey ? series[activeKey] : null
  const points = active?.points ?? []

  return (
    <div
      className={`bg-white rounded-3xl shadow-sm border border-slate-100 p-6 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-teal-700" size={20} />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Trend Analytics</h2>
            <p className="text-sm text-slate-500">
              Track any biomarker across your reports
            </p>
          </div>
        </div>

        {metricKeys.length > 0 && (
          <select
            value={activeKey}
            onChange={(e) => setSelected(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
          >
            {metricKeys.map((key) => (
              <option key={key} value={key}>
                {series[key].label}
                {series[key].unit ? ` (${series[key].unit})` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {metricKeys.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-16">
          No biomarker measurements yet. Upload lab reports to track trends over time.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={points}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(188, 201, 198, 0.4)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatChartDate}
              tick={{ fill: '#3d4947', fontSize: 12 }}
              axisLine={{ stroke: '#bcc9c6' }}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fill: '#3d4947', fontSize: 12 }}
              axisLine={{ stroke: '#bcc9c6' }}
            />
            <Tooltip
              labelFormatter={formatChartDate}
              formatter={(value) => [
                `${value}${active?.unit ? ` ${active.unit}` : ''}`,
                active?.label ?? 'Value',
              ]}
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid rgba(188, 201, 198, 0.4)',
                backgroundColor: '#ffffff',
                boxShadow: '0 15px 30px -5px rgba(0, 106, 97, 0.08)',
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0f766e"
              strokeWidth={3}
              dot={{ fill: '#0f766e', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {metricKeys.length > 0 && points.length === 1 && (
        <p className="text-xs text-slate-400 text-center mt-3">
          Only one data point so far for {active?.label}. Upload more reports to see a trend line.
        </p>
      )}
    </div>
  )
}
