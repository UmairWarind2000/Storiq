// apps/web/src/pages/Alerts.jsx
import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingCart, AlertTriangle, CheckCircle } from 'lucide-react';
import apiClient from '../lib/apiClient';
import Layout    from '../components/Layout';
import { Card, Badge, PageHeader, EmptyState } from '../components/ui';

export default function Alerts() {
  const { data: restock }   = useQuery({ queryKey: ['alerts'],      queryFn: () => apiClient.get('/api/alerts/restock').then(r => r.data) });
  const { data: cartStats } = useQuery({ queryKey: ['cart-stats'],  queryFn: () => apiClient.get('/api/alerts/abandoned-carts').then(r => r.data) });

  const critical = restock?.critical || [];
  const warning  = restock?.warning  || [];
  const watch    = restock?.watch    || [];
  const total    = critical.length + warning.length + watch.length;

  return (
    <Layout>
      <PageHeader title="Alerts" subtitle="Restock warnings and abandoned cart activity" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
        className="lg:grid-cols-2 grid-cols-1">

        {/* Restock */}
        <Card className="fade-up" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{
              width: 32, height: 32,
              background: total > 0 ? 'var(--red-bg)' : 'var(--green-bg)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Package size={15} color={total > 0 ? 'var(--red)' : 'var(--green)'} strokeWidth={1.8} />
            </div>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 500 }}>Inventory alerts</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {total > 0 ? `${total} products need attention` : 'All products well stocked'}
              </p>
            </div>
          </div>

          {total === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 0' }}>
              <CheckCircle size={16} color="var(--green)" />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                No restock needed right now
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {critical.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--red)' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Critical — 7 days or less</span>
                  </div>
                  {critical.map(p => <InventoryRow key={p._id} product={p} variant="red" />)}
                </div>
              )}
              {warning.length > 0 && (
                <div style={{ marginTop: critical.length ? 12 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--amber)' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Warning — 8 to 14 days</span>
                  </div>
                  {warning.map(p => <InventoryRow key={p._id} product={p} variant="amber" />)}
                </div>
              )}
              {watch.length > 0 && (
                <div style={{ marginTop: warning.length ? 12 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Watch — 15 to 30 days</span>
                  </div>
                  {watch.map(p => <InventoryRow key={p._id} product={p} variant="blue" />)}
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Abandoned cart stats */}
        <Card className="fade-up delay-1" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{
              width: 32, height: 32,
              background: 'var(--blue-bg)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShoppingCart size={15} color="var(--blue)" strokeWidth={1.8} />
            </div>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 500 }}>Abandoned carts</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 7 days</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Total carts',    value: cartStats?.total       || 0, color: 'var(--text-primary)' },
              { label: 'Converted',      value: cartStats?.converted   || 0, color: 'var(--green)'        },
              { label: 'Recovery sent',  value: cartStats?.emailSent   || 0, color: 'var(--blue)'         },
              { label: 'Recovery rate',  value: `${cartStats?.recoveryRate || 0}%`, color: 'var(--amber)' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--bg-subtle)',
                borderRadius: 9,
                padding: '12px 14px',
              }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</p>
                <p style={{ fontSize: 20, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: s.color }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          <div style={{
            background: 'var(--bg-subtle)',
            borderRadius: 8,
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <AlertTriangle size={13} color="var(--text-muted)" />
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Recovery emails are sent automatically 1 hour after cart abandonment via AI personalization.
            </p>
          </div>
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

function InventoryRow({ product, variant }) {
  const colors = {
    red:   { bg: 'var(--red-bg)',   text: 'var(--red)'   },
    amber: { bg: 'var(--amber-bg)', text: 'var(--amber)' },
    blue:  { bg: 'var(--blue-bg)',  text: 'var(--blue)'  },
  };
  const c = colors[variant];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: c.bg,
      borderRadius: 7,
      padding: '8px 12px',
      marginBottom: 4,
    }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 1 }}>
          {product.title}
        </p>
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
          {product.inventory} units · {product.velocityPerDay?.toFixed(1)}/day
        </p>
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: c.text, fontFamily: 'DM Mono, monospace', whiteSpace: 'nowrap', marginLeft: 8 }}>
        {product.daysUntilStockout}d
      </span>
    </div>
  );
}