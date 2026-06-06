// apps/web/src/components/TopProducts.jsx
export default function TopProducts({ products = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h3 className="text-sm font-medium text-gray-700 mb-4">Top products</h3>
      {products.length === 0 ? (
        <p className="text-sm text-gray-400">No sales data yet</p>
      ) : (
        <div className="space-y-3">
          {products.map((p, i) => (
            <div key={p._id} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{p.title}</p>
                <p className="text-xs text-gray-400">
                  {p.unitsSold7d} sold this week · {p.inventory} in stock
                </p>
              </div>
              <span className="text-xs font-medium text-indigo-600 whitespace-nowrap">
                {p.velocityPerDay?.toFixed(1)}/day
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}