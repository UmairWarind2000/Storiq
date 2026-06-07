// apps/web/src/pages/Contact.jsx
import { Mail, Phone, Building2, MessageSquare, MapPin } from 'lucide-react';
import Layout from '../components/Layout';
import { Card, PageHeader } from '../components/ui';

export default function Contact() {
  return (
    <Layout>
      <PageHeader
        title="Contact us"
        subtitle="Get in touch with the Storiq team"
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>

        {/* Organization */}
        <Card style={{ padding: '24px' }} className="fade-up delay-1">
          <div style={{
            width: 40, height: 40,
            background: 'var(--bg-subtle)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
          }}>
            <Building2 size={18} color="var(--text-secondary)" strokeWidth={1.8} />
          </div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
            Organization
          </p>
          <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            Storiq
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            E-commerce Analytics & Autopilot SaaS
          </p>
        </Card>

        {/* Email */}
        <Card style={{ padding: '24px' }} className="fade-up delay-2">
          <div style={{
            width: 40, height: 40,
            background: 'var(--blue-bg)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
          }}>
            <Mail size={18} color="var(--blue)" strokeWidth={1.8} />
          </div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
            Email address
          </p>
          <a
            href="mailto:umairwarind360@gmail.com"
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--blue)',
              textDecoration: 'none',
              letterSpacing: '-0.2px',
            }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            umairwarind360@gmail.com
          </a>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            We reply within 24 hours
          </p>
        </Card>

        {/* Phone */}
        <Card style={{ padding: '24px' }} className="fade-up delay-3">
          <div style={{
            width: 40, height: 40,
            background: 'var(--green-bg)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
          }}>
            <Phone size={18} color="var(--green)" strokeWidth={1.8} />
          </div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 6 }}>
            Phone number
          </p>
          <a
            href="tel:+923021296089"
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text-primary)',
              textDecoration: 'none',
              letterSpacing: '-0.3px',
              fontFamily: 'DM Mono, monospace',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--green)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
          >
            0302 129 6089
          </a>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Mon–Fri, 9 AM – 6 PM PKT
          </p>
        </Card>
      </div>

      {/* Message card */}
      <Card className="fade-up delay-4" style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <div style={{
            width: 48, height: 48,
            background: 'var(--accent)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <MessageSquare size={22} color="white" strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 6 }}>
              Have a question or need support?
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 16 }}>
              Whether you need help connecting your Shopify store, understanding your analytics, or have a feature request — we are here to help. Send us an email and we will get back to you as soon as possible.
            </p>
            <a
              href="mailto:umairwarind360@gmail.com?subject=Storiq Support Request"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--accent)',
                color: 'white',
                textDecoration: 'none',
                padding: '9px 18px',
                borderRadius: 9,
                fontSize: 13.5,
                fontWeight: 500,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <Mail size={14} />
              Send us an email
            </a>
          </div>
        </div>
      </Card>

      {/* Location note */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        marginTop: 20,
        padding: '12px 16px',
        background: 'var(--bg-subtle)',
        borderRadius: 8,
        border: '1px solid var(--border)',
      }} className="fade-up">
        <MapPin size={14} color="var(--text-muted)" />
        <p style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
          Based in Pakistan · Serving Shopify merchants worldwide
        </p>
      </div>
    </Layout>
  );
}