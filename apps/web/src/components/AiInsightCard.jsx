// apps/web/src/components/AiInsightCard.jsx
export default function AiInsightCard({ aiSummary, onRefresh, loading }) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-indigo-600">AI is analyzing your store...</span>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-indigo-100 rounded animate-pulse w-full" />
          <div className="h-4 bg-indigo-100 rounded animate-pulse w-4/5" />
          <div className="h-4 bg-indigo-100 rounded animate-pulse w-3/5" />
        </div>
      </div>
    );
  }

  if (!aiSummary) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-indigo-400 rounded-full" />
          <span className="text-sm font-medium text-indigo-600">AI Summary</span>
          {aiSummary.fromCache && (
            <span className="text-xs text-indigo-400">cached</span>
          )}
        </div>
        <button
          onClick={onRefresh}
          className="text-xs text-indigo-400 hover:text-indigo-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      <p className="text-gray-700 text-sm leading-relaxed mb-4">
        {aiSummary.summary}
      </p>

      {aiSummary.topInsight && (
        <div className="bg-white rounded-xl p-4 border border-indigo-100 mb-3">
          <p className="text-xs font-medium text-indigo-500 mb-1">Top insight</p>
          <p className="text-sm text-gray-800">{aiSummary.topInsight}</p>
        </div>
      )}

      {aiSummary.alerts?.length > 0 && (
        <div className="space-y-2">
          {aiSummary.alerts.map((alert, i) => (
            <div key={i} className="flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2">
              <span className="text-amber-500 text-xs mt-0.5">⚠</span>
              <p className="text-xs text-amber-800">{alert}</p>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-indigo-300 mt-4">
        Generated {new Date(aiSummary.generatedAt).toLocaleString()}
      </p>
    </div>
  );
}