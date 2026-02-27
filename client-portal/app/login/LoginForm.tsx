'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type Tab = 'client' | 'admin'

export default function LoginForm() {
    const [tab, setTab] = useState<Tab>('client')
    const router = useRouter()

    const [clientId, setClientId] = useState('')
    const [clientError, setClientError] = useState('')
    const [clientLoading, setClientLoading] = useState(false)
    const [adminLoading, setAdminLoading] = useState(false)

    async function handleClientLogin(e: React.FormEvent) {
        e.preventDefault()
        setClientError('')
        setClientLoading(true)

        const result = await signIn('client-id', {
            clientId: clientId.trim(),
            redirect: false,
        })

        if (result?.error) {
            setClientError('Invalid Client ID. Please check and try again.')
            setClientLoading(false)
        } else {
            router.push('/dashboard')
            router.refresh()
        }
    }

    async function handleGoogleLogin() {
        setAdminLoading(true)
        await signIn('google', { callbackUrl: '/admin' })
    }

    return (
        <div className="auth-page">
            <div className="auth-card" style={{ maxWidth: 440 }}>
                <div className="auth-logo">
                    <div className="auth-logo-mark">Client<em>Portal</em></div>
                    <p className="auth-tagline">Powered by Oxify Labs</p>
                </div>

                {/* Tab switcher */}
                <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr',
                    background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)',
                    padding: 3, marginBottom: 28,
                }}>
                    {(['client', 'admin'] as Tab[]).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            style={{
                                padding: '8px 0', borderRadius: 5, border: 'none', cursor: 'pointer',
                                fontSize: '0.875rem', fontWeight: 600, fontFamily: 'inherit',
                                background: tab === t ? 'var(--bg-2)' : 'transparent',
                                color: tab === t ? 'var(--text)' : 'var(--text-3)',
                                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,.3)' : 'none',
                                transition: 'all 150ms ease',
                            }}
                        >
                            {t === 'client' ? '🏢 Client' : '🔑 Admin'}
                        </button>
                    ))}
                </div>

                {/* ── CLIENT TAB ── */}
                {tab === 'client' && (
                    <form onSubmit={handleClientLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', margin: 0 }}>
                            Enter the <strong style={{ color: 'var(--text)' }}>Client ID</strong> provided by your account manager to access the portal.
                        </p>

                        <div className="form-group">
                            <label className="form-label" htmlFor="client-id">Client ID</label>
                            <input
                                id="client-id"
                                type="text"
                                className="input"
                                placeholder="CL-2026-00001"
                                value={clientId}
                                onChange={e => setClientId(e.target.value.toUpperCase())}
                                required
                                autoComplete="off"
                                spellCheck={false}
                                style={{ fontFamily: "'SF Mono', 'Fira Code', monospace", letterSpacing: '0.06em', fontSize: '1rem' }}
                            />
                            <span className="form-hint">Your unique project identifier — no password needed</span>
                        </div>

                        {clientError && <div className="form-error">⚠ {clientError}</div>}

                        <button
                            type="submit"
                            id="client-login-btn"
                            className="btn btn-primary w-full btn-lg"
                            disabled={clientLoading || !clientId.trim()}
                        >
                            {clientLoading ? 'Verifying…' : 'Access My Portal →'}
                        </button>
                    </form>
                )}

                {/* ── ADMIN TAB ── */}
                {tab === 'admin' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', margin: 0 }}>
                            Admin access is restricted to <strong style={{ color: 'var(--amber)' }}>@oxifylabs.app</strong> accounts only.
                        </p>

                        <button
                            onClick={handleGoogleLogin}
                            disabled={adminLoading}
                            id="google-login-btn"
                            className="btn btn-secondary btn-lg w-full"
                            style={{ gap: 12 }}
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.657 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4" />
                                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
                                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335" />
                            </svg>
                            {adminLoading ? 'Redirecting…' : 'Sign in with Google'}
                        </button>

                        <div style={{ padding: '12px 14px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-3)', margin: 0 }}>
                                🔒 Only <code style={{ color: 'var(--amber)' }}>@oxifylabs.app</code> Google Workspace accounts can access admin. Other accounts are automatically rejected.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
