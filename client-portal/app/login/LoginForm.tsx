'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Building2, ShieldCheck, KeyRound, ArrowRight, Loader2, AlertCircle } from 'lucide-react'

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
        <div className="auth-page min-h-screen flex items-center justify-center p-4">
            <div className="auth-card w-full max-w-[440px] bg-bg rounded-2xl border border-border/60 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-primary/50" />

                <div className="p-8">
                    <div className="flex flex-col items-center justify-center text-center mb-8">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 border border-primary/20 shadow-sm">
                            <KeyRound className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-text">Client<span className="text-primary">Portal</span></h1>
                        <p className="text-sm font-medium text-text-3 mt-1 tracking-wide uppercase">Powered by Oxify Labs</p>
                    </div>

                    {/* Tab switcher */}
                    <div className="grid grid-cols-2 bg-bg-2 p-1.5 rounded-xl mb-8 border border-border/40">
                        {(['client', 'admin'] as Tab[]).map(t => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t
                                        ? 'bg-bg text-text shadow py-2 border border-border/50'
                                        : 'text-text-3 hover:text-text-2 hover:bg-bg-3/50'
                                    }`}
                            >
                                {t === 'client' ? <Building2 className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                                {t === 'client' ? 'Client' : 'Admin'}
                            </button>
                        ))}
                    </div>

                    {/* ── CLIENT TAB ── */}
                    {tab === 'client' && (
                        <form onSubmit={handleClientLogin} className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-bg-2/50 border border-border/50 rounded-lg p-4 mb-2">
                                <p className="text-sm text-text-2 m-0 text-center">
                                    Enter the <strong className="text-text font-semibold">Client ID</strong> provided by your account manager to access the portal.
                                </p>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-text" htmlFor="client-id">Client ID</label>
                                <div className="relative">
                                    <input
                                        id="client-id"
                                        type="text"
                                        className="w-full bg-bg border border-border rounded-lg pl-10 pr-4 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase tracking-wider font-mono text-sm placeholder:text-text-3/50 placeholder:normal-case placeholder:tracking-normal font-medium"
                                        placeholder="E.g. CL-2026-00001"
                                        value={clientId}
                                        onChange={e => setClientId(e.target.value.toUpperCase())}
                                        required
                                        autoComplete="off"
                                        spellCheck={false}
                                    />
                                    <Building2 className="w-4 h-4 text-text-3 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                </div>
                                <span className="text-xs text-text-3 font-medium ml-1">Your unique project identifier — no password required.</span>
                            </div>

                            {clientError && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-lg flex items-center gap-2 mt-2 font-medium">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {clientError}
                                </div>
                            )}

                            <button
                                type="submit"
                                id="client-login-btn"
                                className="w-full mt-2 bg-primary text-primary-fg hover:opacity-90 transition-opacity font-semibold py-3 rounded-lg flex items-center justify-center gap-2 shadow-sm"
                                disabled={clientLoading || !clientId.trim()}
                            >
                                {clientLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Verifying…
                                    </>
                                ) : (
                                    <>
                                        Access Portal <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {/* ── ADMIN TAB ── */}
                    {tab === 'admin' && (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                                <p className="text-sm text-text-2 m-0 text-center">
                                    Admin access is restricted to authorized <strong className="text-amber-600 dark:text-amber-500 font-semibold">@oxifylabs.app</strong> personnel only.
                                </p>
                            </div>

                            <button
                                onClick={handleGoogleLogin}
                                disabled={adminLoading}
                                id="google-login-btn"
                                className="w-full bg-bg text-text border border-border hover:bg-bg-2 transition-colors font-medium py-3 rounded-lg flex items-center justify-center gap-3 shadow-sm h-12"
                            >
                                {adminLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-text-3" />
                                ) : (
                                    <>
                                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                                            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.657 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4" />
                                            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                                            <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
                                            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335" />
                                        </svg>
                                        Sign in with Google
                                    </>
                                )}
                            </button>

                            <div className="flex items-start gap-2 text-xs text-text-3 mt-2 bg-bg-2 p-3 rounded-md">
                                <ShieldCheck className="w-4 h-4 shrink-0 text-text-3 mt-0.5" />
                                <p className="m-0 leading-relaxed font-medium">
                                    Secure login via SSO. Other domains will be automatically rejected by the identity provider matrix.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
