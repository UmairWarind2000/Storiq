// apps/web/src/components/ConfidenceBadge.jsx
export default function ConfidenceBadge({ score }) {
  const pct = Math.round((score || 0) * 100);

  const color = pct >= 80
    ? 'bg-green-50 text-green-700'
    : pct >= 60
    ? 'bg-amber-50 text-amber-700'
    : 'bg-red-50 text-red-700';

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      {pct}% confidence
    </span>
  );
}