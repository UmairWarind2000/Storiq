// apps/web/src/components/CartStats.jsx
export default function CartStats({ stats }) {
  const { total = 0, converted = 0, emailSent = 0, recoveryRate = 0 } = stats || {};

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h3 className="text-sm font-medium text-gray-700 mb-4">Abandoned carts (7d)</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-2xl font-semibold text-gray-900">{total}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total carts</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-green-600">{converted}</p>
          <p className="text-xs text-gray-400 mt-0.5">Converted</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-indigo-600">{emailSent}</p>
          <p className="text-xs text-gray-400 mt-0.5">Emails sent</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-amber-600">{recoveryRate}%</p>
          <p className="text-xs text-gray-400 mt-0.5">Recovery rate</p>
        </div>
      </div>
    </div>
  );
}