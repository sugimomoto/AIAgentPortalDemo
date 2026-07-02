'use client'

import { BrandLogo, MicrosoftLogo } from '@/components/icons'

export function LoginScreen({ onLogin, error }: { onLogin: () => void; error?: string | null }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(120% 120% at 50% 0%, #FFFFFF 0%, #EAEEF4 100%)',
      }}
    >
      <div
        style={{
          width: 452,
          background: '#fff',
          border: '1px solid #E2E8F0',
          borderRadius: 20,
          padding: '52px 46px 40px',
          boxShadow: '0 30px 70px -24px rgba(15,30,61,.28)',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <BrandLogo size={60} radius={16} />
        </div>

        <h1 style={{ fontSize: 27, fontWeight: 700, margin: '24px 0 8px', color: '#0F172A' }}>
          AI Agent Portal
        </h1>
        <p style={{ fontSize: 15, color: '#64748B', marginBottom: 34 }}>
          社内ビジネスデータを、あなたの権限で
        </p>

        <button
          type="button"
          onClick={onLogin}
          style={{
            width: '100%',
            height: 50,
            background: '#fff',
            border: '1px solid #8C8C8C',
            borderRadius: 6,
            fontSize: 15,
            fontWeight: 600,
            color: '#3B3B3B',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
        >
          <MicrosoftLogo size={18} />
          Microsoft アカウントでログイン
        </button>

        {error && (
          <p
            role="alert"
            style={{
              fontSize: 13,
              color: '#B91C1C',
              background: '#FEE2E2',
              border: '1px solid #FCA5A5',
              borderRadius: 8,
              padding: '8px 12px',
              marginTop: 16,
              textAlign: 'left',
              wordBreak: 'break-word',
            }}
          >
            {error}
          </p>
        )}

        <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 36 }}>
          Powered by Microsoft Foundry × CData Connect AI
        </p>
      </div>
    </main>
  )
}
