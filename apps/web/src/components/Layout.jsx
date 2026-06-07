// apps/web/src/components/Layout.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Megaphone, Bell, CreditCard,
  LogOut, Menu, X, Zap, ChevronRight, Mail,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../lib/apiClient';

const NAV = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Campaigns', path: '/campaigns', icon: Megaphone       },
  { label: 'Alerts',    path: '/alerts',    icon: Bell            },
  { label: 'Billing',   path: '/billing',   icon: CreditCard      },
  { label: 'Contact',   path: '/contact',   icon: Mail            },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile]     = useState(false);

  // Detect screen size
  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 1024);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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

      {/* ── Desktop sidebar — always visible on lg+ ── */}
      {!isMobile && (
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
        }}>
          <SidebarContent
            location={location}
            navigate={navigate}
            me={me}
            isPro={isPro}
            onLogout={handleLogout}
          />
        </aside>
      )}

      {/* ── Mobile sidebar overlay ── */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 49,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {isMobile && (
        <aside style={{
          width: 232,
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          zIndex: 50,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: mobileOpen ? '4px 0 24px rgba(0,0,0,0.12)' : 'none',
        }}>
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'absolute', top: 14, right: 14,
              background: 'var(--bg-subtle)',
              border: 'none', cursor: 'pointer',
              borderRadius: 6, padding: 6,
              color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={15} />
          </button>
          <SidebarContent
            location={location}
            navigate={navigate}
            me={me}
            isPro={isPro}
            onLogout={handleLogout}
          />
        </aside>
      )}

      {/* ── Main content area ── */}
      <div style={{
        marginLeft: isMobile ? 0 : 232,
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Mobile topbar */}
        {isMobile && (
          <div style={{
            height: 52,
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: 12,
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}>
            <button
              onClick={() => setMobileOpen(true)}
              style={{
                background: 'none', border: 'none',
                cursor: 'pointer', padding: 4,
                color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center',
                borderRadius: 6,
              }}
            >
              <Menu size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 24, height: 24,
                background: 'var(--accent)',
                borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap size={12} color="white" fill="white" />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>Storiq</span>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span style={{
                fontSize: 10, fontWeight: 600,
                background: isPro ? 'var(--accent)' : 'var(--bg-subtle)',
                color: isPro ? 'white' : 'var(--text-muted)',
                padding: '2px 8px', borderRadius: 20,
                textTransform: 'uppercase', letterSpacing: '0.3px',
              }}>
                {isPro ? 'Pro' : 'Free'}
              </span>
            </div>
          </div>
        )}

        {/* Page content */}
        <div style={{
          flex: 1,
          padding: isMobile ? '20px 16px' : '32px 40px',
          maxWidth: 1200,
          width: '100%',
        }}>
          {children}
        </div>

        {/* Footer */}
        <Footer />
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
            <p style={{
              fontSize: 12, color: 'var(--text-muted)',
              lineHeight: 1.4, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {me.shopName || me.tenantId}
            </p>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              marginTop: 4,
              background: isPro ? 'var(--accent)' : 'var(--bg-subtle)',
              color: isPro ? 'white' : 'var(--text-secondary)',
              fontSize: 10, fontWeight: 600,
              padding: '2px 8px', borderRadius: 20,
              letterSpacing: '0.3px', textTransform: 'uppercase',
            }}>
              {isPro && <Zap size={9} fill="white" />}
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
          letterSpacing: '0.8px', textTransform: 'uppercase',
          padding: '4px 10px 8px',
        }}>
          Menu
        </p>

        {NAV.map(({ label, path, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              style={{
                width: '100%',
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px',
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

      {/* Logout */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 10px',
            borderRadius: 8, border: 'none',
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

function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '20px 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
      background: 'var(--bg-card)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 20, height: 20,
          background: 'var(--accent)',
          borderRadius: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Zap size={10} color="white" fill="white" />
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Storiq</span>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        © {new Date().getFullYear()} Storiq. All rights reserved.
      </p>

      <div style={{ display: 'flex', gap: 16 }}>
        <a
          href="/contact"
          style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          Contact
        </a>
        <a
          href="/billing"
          style={{ fontSize: 12, color: 'var(--text-muted)', textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          Pricing
        </a>
      </div>
    </footer>
  );
};