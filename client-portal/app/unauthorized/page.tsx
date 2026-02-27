import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Access Denied' }

export default function UnauthorizedPage() {
    return (
        <div style={{
            minHeight: '100vh', display: 'grid', placeItems: 'center',
            background: 'var(--bg)', padding: 24,
            fontFamily: 'Inter, system-ui, sans-serif',
        }}>
            <div style={{ textAlign: 'center', maxWidth: 400 }}>
                <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
                <h1 style={{ color: 'var(--text)', marginBottom: 8 }}>Access Denied</h1>
                <p style={{ color: 'var(--text-2)', marginBottom: 24 }}>
                    Admin access requires an <strong style={{ color: 'var(--amber)' }}>@oxifylabs.app</strong> Google account.
                    Sign in with the correct account or contact your administrator.
                </p>
                <a href="/login" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px', background: 'var(--bg-2)', border: '1px solid var(--border-2)',
                    borderRadius: 8, color: 'var(--text)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
                }}>
                    ← Back to Login
                </a>
            </div>
        </div>
    )
}
