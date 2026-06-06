// apps/web/src/components/CampaignCard.jsx
import ConfidenceBadge from './ConfidenceBadge';

const STATUS_STYLES = {
  pending_approval: 'bg-amber-50  text-amber-700  border-amber-100',
  approved:         'bg-blue-50   text-blue-700   border-blue-100',
  active:           'bg-green-50  text-green-700  border-green-100',
  completed:        'bg-gray-50   text-gray-600   border-gray-100',
  rejected:         'bg-red-50    text-red-600    border-red-100',
};

const STATUS_LABELS = {
  pending_approval: 'Pending approval',
  approved:         'Approved',
  active:           'Active',
  completed:        'Completed',
  rejected:         'Rejected',
};

export default function CampaignCard({ campaign, onApprove, onReject, approving }) {
  const isPending = campaign.status === 'pending_approval';
  const statusStyle = STATUS_STYLES[campaign.status] || STATUS_STYLES.pending_approval;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-gray-900">{campaign.productTitle}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {campaign.discountPct}% off · {campaign.durationDays} days
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full border ${statusStyle}`}>
          {STATUS_LABELS[campaign.status]}
        </span>
      </div>

      {/* Confidence + reasoning */}
      <div className="mb-4 space-y-2">
        {campaign.confidenceScore && (
          <ConfidenceBadge score={campaign.confidenceScore} />
        )}
        {campaign.reasoning && (
          <p className="text-xs text-gray-500 leading-relaxed">{campaign.reasoning}</p>
        )}
      </div>

      {/* Dates */}
      <div className="flex gap-4 mb-4">
        {campaign.startsAt && (
          <div>
            <p className="text-xs text-gray-400">Starts</p>
            <p className="text-xs text-gray-700">
              {new Date(campaign.startsAt).toLocaleDateString()}
            </p>
          </div>
        )}
        {campaign.endsAt && (
          <div>
            <p className="text-xs text-gray-400">Ends</p>
            <p className="text-xs text-gray-700">
              {new Date(campaign.endsAt).toLocaleDateString()}
            </p>
          </div>
        )}
        {campaign.revenueGenerated > 0 && (
          <div>
            <p className="text-xs text-gray-400">Revenue</p>
            <p className="text-xs font-medium text-green-600">
              ${campaign.revenueGenerated.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* Shopify discount code */}
      {campaign.status === 'active' && campaign.shopifyDiscountCodeId && (
        <div className="bg-gray-50 rounded-lg px-3 py-2 mb-4">
          <p className="text-xs text-gray-400">Discount code</p>
          <p className="text-xs font-mono text-gray-700">
            STORIQ-{campaign._id.slice(-6).toUpperCase()}
          </p>
        </div>
      )}

      {/* Action buttons — only for pending campaigns */}
      {isPending && (
        <div className="flex gap-2">
          <button
            onClick={() => onApprove(campaign._id)}
            disabled={approving}
            className="flex-1 bg-indigo-600 text-white text-xs font-medium py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {approving ? 'Approving...' : 'Approve & Launch'}
          </button>
          <button
            onClick={() => onReject(campaign._id)}
            disabled={approving}
            className="flex-1 border border-gray-200 text-gray-500 text-xs font-medium py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}