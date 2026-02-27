'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewClientPage() {
    const [name, setName] = useState('')
    const [billingAddress, setBillingAddress] = useState('')
    const [currency, setCurrency] = useState('INR')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const res = await fetch('/api/admin/clients', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, billingAddress, currency, timezone: 'Asia/Kolkata' }),
        })

        if (!res.ok) {
            const data = await res.json()
            setError(data.error || 'Failed to create client')
            setLoading(false)
            return
        }

        const client = await res.json()
        router.push(`/admin/clients/${client.clientId}`)
        router.refresh()
    }

    return (
        <div style={{ maxWidth: 640 }}>
            <div className="page-header">
                <div className="page-header-left">
                    <Link href="/admin/clients" style={{ color: 'var(--text-3)', fontSize: '0.875rem', display: 'block', marginBottom: 6 }}>← Back to Clients</Link>
                    <h1>New Client</h1>
                    <p>A unique Client ID will be automatically generated upon creation.</p>
                </div>
            </div>

            <div className="page-body">
                <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {error && <div className="form-error">⚠ {error}</div>}

                    <div className="form-group">
                        <label className="form-label">Company / Client Name <span className="required">*</span></label>
                        <input
                            required
                            className="input"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Acme Corporation"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Billing Currency</label>
                        <select className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
                            <option value="INR">INR - Indian Rupee</option>
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Billing Address & Tax Info</label>
                        <textarea
                            className="input"
                            style={{ minHeight: 100, resize: 'vertical' }}
                            value={billingAddress}
                            onChange={e => setBillingAddress(e.target.value)}
                            placeholder="123 Business Rd&#10;City, State 12345&#10;GSTIN: 22AAAAA0000A1Z5"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                        <Link href="/admin/clients" className="btn btn-secondary">Cancel</Link>
                        <button type="submit" disabled={loading || !name.trim()} className="btn btn-primary">
                            {loading ? 'Generating ID...' : 'Create & Generate ID'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
