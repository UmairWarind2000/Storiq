// apps/web/src/pages/Dashboard.jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp, ShoppingCart, DollarSign, Zap,
  ArrowUpRight, ArrowDownRight, RefreshCw,
  Package, AlertTriangle, Sparkles,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import apiClient from '../lib/apiClient';
import Layout    from '../components/Layout';
import { Card, Badge, Spinner, PageHeader } from '../components/ui';

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
}

function fmtDate(str) {
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Custom tooltip for chart
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{fmtDate(label)}</p>
      {payload.map(p => (
        <p key={p.name} style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>
          {p.name === 'revenue' ? fmt(p.value) : `${p.value} orders`}
        </p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey:        ['dashboard'],
    queryFn:         () => apiClient.get('/api/dashboard').then(r => r.data),
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: alertsData } = useQuery({
    queryKey: ['alerts'],
    queryFn:  () => apiClient.get('/api/alerts/restock').then(r => r.data),
  });

  const refreshAi = useMutation({
    mutationFn: () => apiClient.post('/api/dashboard/refresh-ai'),
    onSuccess:  () => queryClient.invalidateQueries(['dashboard']),
  });

  const { metrics, revenueChart = [], topProducts = [], aiSummary } = data || {};

  const growth = metrics?.revenue7d && metrics?.revenue30d
    ? (((metrics.revenue7d / 7) / (metrics.revenue30d / 30) - 1) * 100).toFixed(1)
    : null;

  const STATS = [
    {
      label:   'Revenue (30d)',
      value:   fmt(metrics?.revenue30d),
      sub:     `${metrics?.orders30d || 0} orders`,
      icon:    DollarSign,
      delay:   'delay-1',
    },
    {
      label:   'This week',
      value:   fmt(metrics?.revenue7d),
      sub:     growth ? `${growth > 0 ? '+' : ''}${growth}% vs avg` : '7-day total',
      icon:    TrendingUp,
      trend:   growth ? parseFloat(growth) : null,
      delay:   'delay-2',
    },
    {
      label:   'Avg order',
      value:   fmt(metrics?.avgOrderValue),
      sub:     'per transaction',
      icon:    ShoppingCart,
      delay:   'delay-3',
    },
    {
      label:   'Campaigns',
      value:   metrics?.activeCampaigns || 0,
      sub:     'active discounts',
      icon:    Zap,
      delay:   'delay-4',
    },
  ];

  if (isLoading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12 }}>
          <Spinner size={18} />
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Loading your dashboard…</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Dashboard"
        subtitle={`Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} — here's your store overview`}
      />

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}
        className="grid-cols-2 lg:grid-cols-4">
        {STATS.map(stat => (
          <Card key={stat.label} style={{ padding: '18px 20px' }} className={`fade-up ${stat.delay}`}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 400 }}>{stat.label}</span>
              <div style={{
                width: 30, height: 30,
                background: 'var(--bg-subtle)',
                borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <stat.icon size={14} color="var(--text-secondary)" strokeWidth={1.8} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', fontFamily: 'DM Mono, monospace', marginBottom: 4 }}>
              {stat.value}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {stat.trend != null && (
                stat.trend >= 0
                  ? <ArrowUpRight size={12} color="var(--green)" />
                  : <ArrowDownRight size={12} color="var(--red)" />
              )}
              <span style={{ fontSize: 12, color: stat.trend != null ? (stat.trend >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--text-muted)' }}>
                {stat.sub}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart + AI summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 24 }}
        className="lg:grid-cols-[1fr_340px] grid-cols-1">

        {/* Revenue chart */}
        <Card className="fade-up delay-3" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 2 }}>Revenue</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last 30 days</p>
            </div>
          </div>
          {revenueChart.length === 0 ? (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No sales data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={revenueChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtDate}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'DM Sans' }}
                  tickLine={false}
                  axisLine={false}
                  interval={6}
                />
                <YAxis
                  tickFormatter={v => `$${(v/1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'DM Sans' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--accent)', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* AI summary */}
        <Card className="fade-up delay-4" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Sparkles size={14} color="var(--text-secondary)" strokeWidth={1.8} />
              <span style={{ fontSize: 13.5, fontWeight: 500 }}>AI Summary</span>
            </div>
            <button
              onClick={() => refreshAi.mutate()}
              disabled={refreshAi.isPending}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', padding: 4, borderRadius: 6,
                display: 'flex', alignItems: 'center',
                transition: 'color 0.15s',
              }}
              title="Refresh AI summary"
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <RefreshCw size={13} style={{ animation: refreshAi.isPending ? 'spin 0.7s linear infinite' : 'none' }} />
            </button>
          </div>

          {!aiSummary ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[100, 85, 70].map((w, i) => (
                <div key={i} style={{
                  height: 12,
                  background: 'var(--bg-subtle)',
                  borderRadius: 4,
                  width: `${w}%`,
                  animation: 'pulse 1.5s ease infinite',
                  animationDelay: `${i * 0.15}s`,
                }} />
              ))}
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                Analysis generates nightly
              </p>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {aiSummary.summary}
              </p>

              {aiSummary.topInsight && (
                <div style={{
                  background: 'var(--bg-subtle)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  borderLeft: '2px solid var(--accent)',
                }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Top insight
                  </p>
                  <p style={{ fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.55 }}>
                    {aiSummary.topInsight}
                  </p>
                </div>
              )}

              {aiSummary.alerts?.map((alert, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                  background: 'var(--amber-bg)',
                  borderRadius: 7,
                  padding: '8px 10px',
                }}>
                  <AlertTriangle size={12} color="var(--amber)" style={{ marginTop: 1, flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: 'var(--amber)', lineHeight: 1.5 }}>{alert}</p>
                </div>
              ))}

              {aiSummary.generatedAt && (
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 'auto' }}>
                  Updated {new Date(aiSummary.generatedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Bottom row — top products + restock */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
        className="lg:grid-cols-2 grid-cols-1">

        {/* Top products */}
        <Card className="fade-up delay-5" style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 13.5, fontWeight: 500, marginBottom: 16 }}>Top products</p>
          {topProducts.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '16px 0' }}>No products yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {topProducts.map((p, i) => (
                <div key={p._id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '9px 0',
                  borderBottom: i < topProducts.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: 'var(--text-muted)',
                    fontFamily: 'DM Mono, monospace',
                    minWidth: 16,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.title}
                    </p>
                    <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                      {p.unitsSold7d} sold this week · {p.inventory} in stock
                    </p>
                  </div>
                  <Badge variant="default">
                    <span style={{ fontFamily: 'DM Mono, monospace' }}>{p.velocityPerDay?.toFixed(1)}</span>/day
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Restock alerts */}
        <Card className="fade-up delay-6" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>
            <Package size={14} color="var(--text-secondary)" strokeWidth={1.8} />
            <p style={{ fontSize: 13.5, fontWeight: 500 }}>Restock alerts</p>
          </div>
          {!alertsData || alertsData.lowStock?.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '24px 0', gap: 8,
            }}>
              <div style={{
                width: 36, height: 36,
                background: 'var(--green-bg)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Package size={16} color="var(--green)" strokeWidth={1.8} />
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>All products well stocked</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alertsData.critical?.map(p => <RestockRow key={p._id} product={p} variant="red" />)}
              {alertsData.warning?.map(p  => <RestockRow key={p._id} product={p} variant="amber" />)}
              {alertsData.watch?.map(p    => <RestockRow key={p._id} product={p} variant="blue" />)}
            </div>
          )}
        </Card>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @media (max-width:1024px) {
          .grid-cols-2 { grid-template-columns: 1fr 1fr !important; }
          .lg\\:grid-cols-4 { grid-template-columns: 1fr 1fr !important; }
          .lg\\:grid-cols-\\[1fr_340px\\] { grid-template-columns: 1fr !important; }
          .lg\\:grid-cols-2 { grid-template-columns: 1fr !important; }
        }
        @media (max-width:640px) {
          .grid-cols-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </Layout>
  );
}

function RestockRow({ product, variant }) {
  const colors = {
    red:   { bg: 'var(--red-bg)',   color: 'var(--red)'   },
    amber: { bg: 'var(--amber-bg)', color: 'var(--amber)' },
    blue:  { bg: 'var(--blue-bg)',  color: 'var(--blue)'  },
  };
  const c = colors[variant];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: c.bg,
      borderRadius: 8,
      padding: '8px 12px',
    }}>
      <div>
        <p style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 1 }}>
          {product.title}
        </p>
        <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
          {product.inventory} units · {product.velocityPerDay?.toFixed(1)}/day
        </p>
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: c.color, fontFamily: 'DM Mono, monospace', whiteSpace: 'nowrap', marginLeft: 8 }}>
        {product.daysUntilStockout}d left
      </span>
    </div>
  );
}