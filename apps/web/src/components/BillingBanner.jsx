// apps/web/src/components/BillingBanner.jsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

export default function BillingBanner() {
  const [loading, setLoading] = useState(false);

  const { data } = useQuery({
    queryKey: ['billing-status'],
    queryFn:  () => apiClient.get('/api/billing/status').then(r => r.data),
  });

  const checkout = useMutation({
    mutationFn: () => apiClient.post('/api/billing/checkout', { plan: 'pro' }),
    onSuccess:  (res) => {
      window.location.href = res.data.url;
    },
    onError: (err) => {
      alert(err.response?.data?.error || 'Checkout failed');
      setLoading(false);
    },
  });

  const portal = useMutation({
    mutationFn: () => apiClient.post('/api/billing/portal'),
    onSuccess:  (res) => {
      window.location.href = res.data.url;
    },
  });

  if (!data || data.plan === 'pro') return null;

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">
            You are on the Free plan
          </span>
          <span className="text-indigo-200 text-sm ml-2">
            Upgrade to Pro to unlock campaign approvals, restock alerts, and abandoned cart recovery
          </span>
        </div>
        <button
          onClick={() => checkout.mutate()}
          disabled={checkout.isPending}
          className="bg-white text-indigo-600 text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-indigo-50 disabled:opacity-70 transition-colors whitespace-nowrap ml-4"
        >
          {checkout.isPending ? 'Loading...' : 'Upgrade to Pro — $29/mo'}
        </button>
      </div>
    </div>
  );
}