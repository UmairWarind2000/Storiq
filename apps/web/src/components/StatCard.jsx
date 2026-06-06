// apps/web/src/components/StatCard.jsx
export default function StatCard({ title, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green:  'bg-green-50  text-green-600',
    amber:  'bg-amber-50  text-amber-600',
    rose:   'bg-rose-50   text-rose-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}