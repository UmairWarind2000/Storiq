// apps/web/src/components/RestockAlerts.jsx
export default function RestockAlerts({ alerts }) {
  const { critical = [], warning = [], watch = [] } = alerts || {};
  const total = critical.length + warning.length + watch.length;

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Restock alerts</h3>
        <p className="text-sm text-gray-400">All products are well stocked</p>
      </div>
    );
  }

  const URGENCY = [
    { label: 'Critical',  items: critical, bg: 'bg-red-50',   text: 'text-red-700',   dot: 'bg-red-400',   days: '≤ 7 days'  },
    { label: 'Warning',   items: warning,  bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400', days: '8–14 days' },
    { label: 'Watch',     items: watch,    bg: 'bg-blue-50',  text: 'text-blue-700',  dot: 'bg-blue-300',  days: '15–30 days' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700">Restock alerts</h3>
        <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
          {total} products
        </span>
      </div>

      <div className="space-y-4">
        {URGENCY.filter(g => g.items.length > 0).map(group => (
          <div key={group.label}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${group.dot}`} />
              <span className={`text-xs font-medium ${group.text}`}>
                {group.label} — {group.days}
              </span>
            </div>
            <div className="space-y-2">
              {group.items.map(product => (
                <div
                  key={product._id}
                  className={`${group.bg} rounded-lg px-3 py-2 flex items-center justify-between`}
                >
                  <div>
                    <p className={`text-xs font-medium ${group.text}`}>{product.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {product.inventory} units · {product.velocityPerDay?.toFixed(1)}/day
                    </p>
                  </div>
                  <span className={`text-xs font-medium ${group.text}`}>
                    {product.daysUntilStockout}d left
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}