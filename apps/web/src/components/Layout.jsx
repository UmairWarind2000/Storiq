// apps/web/src/components/Layout.jsx
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Megaphone, Bell, CreditCard,
  LogOut, Menu, X, Zap, ChevronRight,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

const NAV = [
  { label: 'Dashboard',  path: '/dashboard',  icon: LayoutDashboard },
  { label: 'Campaigns',  path: '/campaigns',  icon: Megaphone       },
  { label: 'Alerts',     path: '/alerts',     icon: Bell            },
  { label: 'Billing',    path: '/billing',    icon: CreditCard      },
];

export default function Layout({ children }) {
  const location = useNavigate ? useLocation() : { pathname: '' };
  const navigate  = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn:  () => apiClient.get('/api/auth/me').then(r => r.data),
    retry: false,
  });

  function handleLogout() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  const isPro = me?.plan === 'pro';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Sidebar */}
      <aside style={{
        width: 232,
        flexShrink: 0,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 40,
        transform: open ? 'translateX(0)' : undefined,
      }} className="hidden lg:flex">
        <SidebarContent
          location={location}
          navigate={navigate}
          me={me}
          isPro={isPro}
          onLogout={handleLogout}
        />
      </aside>

      {/* Mobile sidebar overlay */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 39 }}
          onClick={() => setOpen(false)}
        />
      )}
      <aside style={{
        width: 232,
        flexShrink: 0,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 40,
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.2s ease',
      }} className="lg:hidden">
        <button
          onClick={() => setOpen(false)}
          style={{ position: 'absolute', top: 16, right: 16, color: 'var(--text-muted)' }}
        >
          <X size={18} />
        </button>
        <SidebarContent
          location={location}
          navigate={navigate}
          me={me}
          isPro={isPro}
          onLogout={handleLogout}
        />
      </aside>

      {/* Main area */}
      <div style={{ marginLeft: 232, flex: 1, minWidth: 0 }} className="lg:ml-[232px] ml-0">

        {/* Mobile topbar */}
        <div style={{
          height: 52,
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 12,
        }} className="lg:hidden flex">
          <button onClick={() => setOpen(true)} style={{ color: 'var(--text-secondary)' }}>
            <Menu size={18} />
          </button>
          <span style={{ fontWeight: 600, letterSpacing: '-0.3px' }}>Storiq</span>
        </div>

        <div style={{ padding: '32px 32px' }} className="lg:p-8 p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function SidebarContent({ location, navigate, me, isPro, onLogout }) {
  return (
    <>
      {/* Logo */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28,
            background: 'var(--accent)',
            borderRadius: 7,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={14} color="white" fill="white" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.4px' }}>Storiq</span>
        </div>
        {me && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {me.shopName || me.tenantId}
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 4,
              background: isPro ? 'var(--accent)' : 'var(--bg-subtle)',
              color: isPro ? 'white' : 'var(--text-secondary)',
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 20,
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
            }}>
              {isPro ? <Zap size={9} fill="white" /> : null}
              {isPro ? 'Pro' : 'Free'}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        <p style={{
          fontSize: 10, fontWeight: 600,
          color: 'var(--text-muted)',
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          padding: '4px 10px 8px',
        }}>Menu</p>
        {NAV.map(({ label, path, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                background: active ? 'var(--bg-subtle)' : 'transparent',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontFamily: 'inherit',
                fontSize: 13.5,
                fontWeight: active ? 500 : 400,
                textAlign: 'left',
                marginBottom: 1,
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-subtle)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
              {label}
              {active && (
                <ChevronRight size={12} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 10px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontFamily: 'inherit',
            fontSize: 13.5,
            textAlign: 'left',
            transition: 'all 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-subtle)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <LogOut size={15} strokeWidth={1.8} />
          Sign out
        </button>
      </div>
    </>
  );
}