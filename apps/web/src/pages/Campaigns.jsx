// apps/web/src/pages/Campaigns.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Megaphone, Zap, Check, X, Clock,
  TrendingUp, Calendar, RefreshCw,
} from 'lucide-react';
import apiClient from '../lib/apiClient';
import Layout    from '../components/Layout';
import { Card, Badge, Spinner, PageHeader, EmptyState } from '../components/ui';

const STATUS_CONFIG = {
  pending_approval: { label: 'Pending',   variant: 'amber', icon: Clock       },
  approved:         { label: 'Approved',  variant: 'blue',  icon: Check       },
  active:           { label: 'Active',    variant: 'green', icon: TrendingUp  },
  completed:        { label: 'Done',      variant: 'default', icon: Check     },
  rejected:         { label: 'Rejected',  variant: 'red',   icon: X           },
};

export default function Campaigns() {
  const queryClient  = useQueryClient();
  const [approvingId, setApprovingId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn:  () => apiClient.get('/api/campaigns').then(r => r.data),
  });

  const detect = useMutation({
    mutationFn: () => apiClient.post('/api/campaigns/detect'),
    onSuccess:  () => queryClient.invalidateQueries(['campaigns']),
  });

  const approve = useMutation({
    mutationFn: id => apiClient.post(`/api/campaigns/${id}/approve`),
    onSuccess:  () => { queryClient.invalidateQueries(['campaigns']); setApprovingId(null); },
    onError:    err => { alert(err.response?.data?.error || 'Approval failed'); setApprovingId(null); },
  });

  const reject = useMutation({
    mutationFn: id => apiClient.post(`/api/campaigns/${id}/reject`),
    onSuccess:  () => queryClient.invalidateQueries(['campaigns']),
  });

  const { grouped = {}, campaigns = [] } = data || {};
  const pending   = grouped.pending   || [];
  const active    = grouped.active    || [];
  const history   = [...(grouped.completed || []), ...(grouped.rejected || [])];

  const totalRevenue = active.reduce((s, c) => s + (c.revenueGenerated || 0), 0);

  return (
    <Layout>
      <PageHeader
        title="Campaigns"
        subtitle="AI-detected discount opportunities for slow-moving products"
        action={
          <button
            onClick={() => detect.mutate()}
            disabled={detect.isPending}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: 9,
              padding: '9px 16px',
              cursor: detect.isPending ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              fontSize: 13.5,
              fontWeight: 500,
              opacity: detect.isPending ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {detect.isPending ? <Spinner size={14} /> : <Zap size={14} />}
            {detect.isPending ? 'Detecting…' : 'Run AI detection'}
          </button>
        }
      />

      {/* Summary strip */}
      {campaigns.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }} className="fade-up">
          {[
            { label: 'Pending review', value: pending.length,  variant: 'amber' },
            { label: 'Active now',     value: active.length,   variant: 'green' },
            { label: 'Revenue driven', value: `$${totalRevenue.toFixed(0)}`, variant: 'default' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '12px 18px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>{s.label}</span>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', fontFamily: 'DM Mono, monospace' }}>
                {s.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '40px 0' }}>
          <Spinner /> <span style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>Loading campaigns…</span>
        </div>
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <section style={{ marginBottom: 32 }} className="fade-up delay-1">
          <SectionLabel label="Pending approval" count={pending.length} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}
            className="lg:grid-cols-3 grid-cols-1">
            {pending.map(c => (
              <CampaignCard
                key={c._id}
                campaign={c}
                onApprove={id => { setApprovingId(id); approve.mutate(id); }}
                onReject={id => reject.mutate(id)}
                approving={approvingId === c._id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Active */}
      {active.length > 0 && (
        <section style={{ marginBottom: 32 }} className="fade-up delay-2">
          <SectionLabel label="Active campaigns" count={active.length} variant="green" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}
            className="lg:grid-cols-3 grid-cols-1">
            {active.map(c => (
              <CampaignCard key={c._id} campaign={c} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!isLoading && campaigns.length === 0 && (
        <Card className="fade-up">
          <EmptyState
            icon={Megaphone}
            title="No campaigns yet"
            description="Click 'Run AI detection' to let Storiq find slow-moving products and recommend discount strategies."
            action={
              <button
                onClick={() => detect.mutate()}
                style={{
                  background: 'var(--accent)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 9,
                  padding: '9px 20px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 13.5,
                  fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 7,
                }}
              >
                <Zap size={14} /> Run AI detection
              </button>
            }
          />
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <section className="fade-up delay-3">
          <SectionLabel label="History" count={history.length} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}
            className="lg:grid-cols-3 grid-cols-1">
            {history.map(c => <CampaignCard key={c._id} campaign={c} />)}
          </div>
        </section>
      )}

      <style>{`
        @media (max-width:1024px) {
          .lg\\:grid-cols-3 { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width:640px) {
          .grid-cols-1 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </Layout>
  );
}

function SectionLabel({ label, count, variant = 'default' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
      <Badge variant={variant}>{count}</Badge>
    </div>
  );
}

function CampaignCard({ campaign, onApprove, onReject, approving }) {
  const status = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.pending_approval;
  const StatusIcon = status.icon;
  const isPending  = campaign.status === 'pending_approval';
  const confidence = Math.round((campaign.confidenceScore || 0) * 100);

  return (
    <Card style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {campaign.productTitle}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {campaign.discountPct}% off · {campaign.durationDays} days
          </p>
        </div>
        <Badge variant={status.variant}>
          <StatusIcon size={9} />
          {status.label}
        </Badge>
      </div>

      {/* Confidence bar */}
      {campaign.confidenceScore != null && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>AI confidence</span>
            <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'DM Mono, monospace', color: confidence >= 80 ? 'var(--green)' : confidence >= 60 ? 'var(--amber)' : 'var(--red)' }}>
              {confidence}%
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--bg-subtle)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${confidence}%`,
              background: confidence >= 80 ? 'var(--green)' : confidence >= 60 ? 'var(--amber)' : 'var(--red)',
              borderRadius: 2,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      )}

      {/* Reasoning */}
      {campaign.reasoning && (
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {campaign.reasoning}
        </p>
      )}

      {/* Dates */}
      <div style={{ display: 'flex', gap: 12 }}>
        {campaign.startsAt && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={11} color="var(--text-muted)" />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {new Date(campaign.startsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        )}
        {campaign.revenueGenerated > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
            <TrendingUp size={11} color="var(--green)" />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', fontFamily: 'DM Mono, monospace' }}>
              ${campaign.revenueGenerated.toFixed(0)}
            </span>
          </div>
        )}
      </div>

      {/* Discount code if active */}
      {campaign.status === 'active' && (
        <div style={{
          background: 'var(--bg-subtle)',
          borderRadius: 6,
          padding: '6px 10px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Code</span>
          <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: 'var(--text-primary)', fontWeight: 500 }}>
            STORIQ-{campaign._id.slice(-6).toUpperCase()}
          </span>
        </div>
      )}

      {/* Approve / Reject buttons */}
      {isPending && onApprove && (
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
          <button
            onClick={() => onApprove(campaign._id)}
            disabled={approving}
            style={{
              flex: 1,
              background: 'var(--accent)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '8px',
              cursor: approving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              fontSize: 12.5,
              fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              opacity: approving ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {approving ? <Spinner size={12} /> : <Check size={12} />}
            {approving ? 'Approving…' : 'Approve'}
          </button>
          <button
            onClick={() => onReject(campaign._id)}
            style={{
              width: 36,
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <X size={13} />
          </button>
        </div>
      )}
    </Card>
  );
}