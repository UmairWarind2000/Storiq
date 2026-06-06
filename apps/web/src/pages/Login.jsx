// apps/web/src/pages/Login.jsx
import { useState } from 'react';
import { Zap, ArrowRight, Store } from 'lucide-react';

export default function Login() {
  const [shop, setShop] = useState('');
  const [loading, setLoading] = useState(false);

  function handleConnect() {
    if (!shop) return;
    const domain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/shopify?shop=${domain}`;
  }

  async function handleDevLogin() {
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/auth/dev-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: 'demo-store.myshopify.com' }),
      });
      const data = await res.json();
      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard';
    } catch {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
    }}>

      {/* Left panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 64px',
        maxWidth: 520,
      }} className="fade-up">

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 56 }}>
          <div style={{
            width: 32, height: 32,
            background: 'var(--accent)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={16} color="white" fill="white" />
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.4px' }}>Storiq</span>
        </div>

        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: '-0.8px',
          lineHeight: 1.2,
          marginBottom: 10,
          color: 'var(--text-primary)',
        }}>
          Your store's<br />autopilot
        </h1>
        <p style={{
          fontSize: 15,
          color: 'var(--text-secondary)',
          marginBottom: 40,
          lineHeight: 1.6,
        }}>
          AI-powered analytics, campaigns, and recovery — all running automatically in the background.
        </p>

        {/* Demo notice */}
        <div style={{
          background: 'var(--bg-subtle)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 24,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
        }}>
          <div style={{
            width: 6, height: 6,
            background: 'var(--green)',
            borderRadius: '50%',
            marginTop: 5,
            flexShrink: 0,
          }} />
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
              Live demo available
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Click the demo button below to instantly explore the dashboard with 30 days of sample data.
            </p>
          </div>
        </div>

        {/* Shop input */}
        <div style={{ marginBottom: 10 }}>
          <label style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            display: 'block',
            marginBottom: 6,
          }}>
            Shopify store URL
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 9,
              padding: '0 12px',
              gap: 8,
              transition: 'border-color 0.15s',
            }}
              onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <Store size={14} color="var(--text-muted)" />
              <input
                type="text"
                value={shop}
                onChange={e => setShop(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConnect()}
                placeholder="your-store.myshopify.com"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontFamily: 'inherit',
                  fontSize: 13.5,
                  color: 'var(--text-primary)',
                  padding: '10px 0',
                }}
              />
            </div>
            <button
              onClick={handleConnect}
              style={{
                background: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: 9,
                padding: '0 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13.5,
                fontWeight: 500,
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Connect <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          margin: '16px 0',
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Demo button */}
        <button
          onClick={handleDevLogin}
          disabled={loading}
          style={{
            width: '100%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 9,
            padding: '10px 16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            fontSize: 13.5,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            transition: 'all 0.15s',
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          {loading ? (
            <>
              <div style={{
                width: 14, height: 14,
                border: '2px solid var(--border)',
                borderTopColor: 'var(--text-secondary)',
                borderRadius: '50%',
                animation: 'spin 0.7s linear infinite',
              }} />
              Loading demo...
            </>
          ) : (
            <>
              <Zap size={14} />
              View live demo — no signup needed
            </>
          )}
        </button>

        <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 20, lineHeight: 1.6 }}>
          By connecting your store you agree to our terms of service. Your data is encrypted and never sold.
        </p>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1,
        background: 'var(--accent)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 56px',
        position: 'relative',
        overflow: 'hidden',
      }} className="hidden lg:flex fade-in">

        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ marginBottom: 40 }}>
            {[
              { label: 'Revenue recovered', value: '$12,480', sub: 'via cart recovery this month', color: '#4ade80' },
              { label: 'Campaigns running', value: '3 active', sub: 'AI-generated discounts', color: '#60a5fa' },
              { label: 'Restock alerts', value: '2 urgent', sub: 'Running Sneakers · 5 days left', color: '#fbbf24' },
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: '16px 20px',
                marginBottom: 10,
                animation: `fadeUp 0.4s ease both`,
                animationDelay: `${0.1 + i * 0.08}s`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>
                    {stat.label}
                  </span>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: stat.color }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'white', letterSpacing: '-0.5px', fontFamily: 'DM Mono, monospace' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
            Storiq runs 24/7 so you don't have to. Connect once, let AI handle the rest.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}