// apps/web/src/components/RevenueChart.jsx
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatCurrency(val) {
  return `$${val.toLocaleString()}`;
}

export default function RevenueChart({ data = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h3 className="text-sm font-medium text-gray-700 mb-6">Revenue — last 30 days</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            interval={6}
          />
          <YAxis
            tickFormatter={v => `$${v}`}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip
            formatter={(val, name) => [
              name === 'revenue' ? formatCurrency(val) : val,
              name === 'revenue' ? 'Revenue' : 'Orders',
            ]}
            labelFormatter={formatDate}
            contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
            formatter={v => v === 'revenue' ? 'Revenue' : 'Orders'}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="#a78bfa"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 4"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}