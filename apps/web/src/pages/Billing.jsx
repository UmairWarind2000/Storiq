// apps/web/src/pages/Billing.jsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { Zap, Check, CreditCard, ExternalLink } from 'lucide-react';
import apiClient from '../lib/apiClient';
import Layout    from '../components/Layout';
import { Card, PageHeader } from '../components/ui';

const FREE_FEATURES = [
  'AI sales dashboard',
  'Revenue charts',
  'Campaign detection',
  'Restock alerts (view only)',
];

const PRO_FEATURES = [
  'Everything in Free',
  'Campaign approval & launch',
  'Auto-approve high-confidence campaigns',
  'Restock email alerts',
  'Abandoned cart recovery emails',
  'Stripe billing portal access',
];

export default function Billing() {
  const { data }    = useQuery({ queryKey: ['billing-status'], queryFn: () => apiClient.get('/api/billing/status').then(r => r.data) });
  const { data: me} = useQuery({ queryKey: ['me'],             queryFn: () => apiClient.get('/api/auth/me').then(r => r.data), retry: false });

  const checkout = useMutation({
    mutationFn: () => apiClient.post('/api/billing/checkout', { plan: 'pro' }),
    onSuccess:  res => { window.location.href = res.data.url; },
    onError:    err => alert(err.response?.data?.error || 'Checkout failed'),
  });

  const portal = useMutation({
    mutationFn: () => apiClient.post('/api/billing/portal'),
    onSuccess:  res => { window.location.href = res.data.url; },
  });

  const isPro = data?.plan === 'pro';

  return (
    <Layout>
      <PageHeader title="Billing" subtitle="Manage your Storiq subscription" />

      {/* Current plan */}
      <Card className="fade-up" style={{ padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40,
              background: isPro ? 'var(--accent)' : 'var(--bg-subtle)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isPro
                ? <Zap size={18} color="white" fill="white" />
                : <CreditCard size={18} color="var(--text-muted)" strokeWidth={1.8} />
              }
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600 }}>
                {isPro ? 'Storiq Pro' : 'Free plan'}
              </p>
              <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                {isPro ? '$29/month · billed monthly' : 'Limited features'}
              </p>
            </div>
          </div>

          {isPro && (
            <button
              onClick={() => portal.mutate()}
              disabled={portal.isPending}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 14px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
                color: 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              Manage subscription <ExternalLink size={12} />
            </button>
          )}
        </div>
      </Card>

      {/* Plan comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
        className="lg:grid-cols-2 grid-cols-1">

        {/* Free */}
        <Card className="fade-up delay-1" style={{ padding: '24px', opacity: isPro ? 0.6 : 1 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
            Free
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
            <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-1px', fontFamily: 'DM Mono, monospace' }}>$0</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/month</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {FREE_FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 16, height: 16,
                  background: 'var(--bg-subtle)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Check size={9} color="var(--text-secondary)" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{f}</span>
              </div>
            ))}
          </div>
          <div style={{
            background: 'var(--bg-subtle)',
            borderRadius: 8,
            padding: '9px',
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}>
            {isPro ? 'Previous plan' : 'Current plan'}
          </div>
        </Card>

        {/* Pro */}
        <Card className="fade-up delay-2" style={{
          padding: '24px',
          border: isPro ? '1px solid var(--border)' : '1.5px solid var(--accent)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {!isPro && (
            <div style={{
              position: 'absolute', top: 14, right: 14,
              background: 'var(--accent)',
              color: 'white',
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 20,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              Recommended
            </div>
          )}

          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 8 }}>
            Pro
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
            <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-1px', fontFamily: 'DM Mono, monospace' }}>$29</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/month</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {PRO_FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 16, height: 16,
                  background: 'var(--accent)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Check size={9} color="white" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{f}</span>
              </div>
            ))}
          </div>

          {!isPro ? (
            <button
              onClick={() => checkout.mutate()}
              disabled={checkout.isPending}
              style={{
                width: '100%',
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '10px',
                cursor: checkout.isPending ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                fontSize: 13.5,
                fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                opacity: checkout.isPending ? 0.7 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              <Zap size={14} fill="white" />
              {checkout.isPending ? 'Redirecting…' : 'Upgrade to Pro'}
            </button>
          ) : (
            <div style={{
              background: 'var(--accent)',
              borderRadius: 8,
              padding: '9px',
              textAlign: 'center',
              fontSize: 13,
              color: 'white',
              fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Check size={13} /> Current plan
            </div>
          )}
        </Card>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .lg\\:grid-cols-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </Layout>
  );
}