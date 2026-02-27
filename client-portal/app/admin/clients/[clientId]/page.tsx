'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ClientDetailPage({ params }: { params: { clientId: string } }) {
    const [client, setClient] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    const [name, setName] = useState('')
    const [billingAddress, setBillingAddress] = useState('')
    const [status, setStatus] = useState('active')

    const router = useRouter()

    useEffect(() => {
        fetch(`/api/admin/clients/${params.clientId}`)
            .then(res => {
                if (!res.ok) throw new Error('Not found')
                return res.json()
            })
            .then(data => {
                setClient(data)
                setName(data.name)
                setBillingAddress(data.billingAddress || '')
                setStatus(data.status)
                setLoading(false)
            })
            .catch(() => {
                router.push('/admin/clients')
            })
    }, [params.clientId, router])

    async function handleSave(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        await fetch(`/api/admin/clients/${params.clientId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, billingAddress, status }),
        })
        setSaving(false)
        router.refresh()
    }

    function handleCopy() {
        navigator.clipboard.writeText(client.clientId)
        alert('Client ID copied to clipboard!')
    }

    if (loading) return <div className="p-8">Loading client...</div>
    const timeline = [
        ...client.invoices.map((inv: any) => ({
            id: `inv-${inv.id}`,
            type: 'invoice',
            date: new Date(inv.createdAt),
            title: `Invoice Issued: ${inv.invoiceNumber}`,
            desc: `Total amount: ${inv.currency} ${inv.totalAmount}`,
            status: inv.status,
            link: `/dashboard/invoices/${inv.id}`
        })),
        ...client.invoices.flatMap((inv: any) => (inv.payments || []).map((p: any) => ({
            id: `pay-${p.id}`,
            type: 'payment',
            date: new Date(p.paidAt),
            title: `Payment Received`,
            desc: `For invoice ${inv.invoiceNumber} (${inv.currency} ${p.amount})`,
            status: p.status,
            link: `/dashboard/invoices/${inv.id}`
        }))),
        ...(client.requests || []).map((req: any) => ({
            id: `req-${req.id}`,
            type: 'request',
            date: new Date(req.createdAt),
            title: `Work Requested: ${req.title}`,
            desc: `Status: ${req.status}`,
            status: req.status,
            link: `/dashboard/requests/${req.id}`
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime())

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <Link href="/admin/clients" style={{ color: 'var(--text-3)', fontSize: '0.875rem', display: 'block', marginBottom: 6 }}>← Back to Clients</Link>
                    <h1>{client.name}</h1>
                    <p>Manage client details and timeline</p>
                </div>
                <span className={`badge badge-${status === 'active' ? 'approved' : 'rejected'}`}>{status}</span>
            </div>

            <div className="page-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 24, alignItems: 'start' }}>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <form onSubmit={handleSave} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <h3>Client Details</h3>

                            <div className="form-group">
                                <label className="form-label">Client Name</label>
                                <input value={name} onChange={e => setName(e.target.value)} className="input" required />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Billing Address</label>
                                <textarea value={billingAddress} onChange={e => setBillingAddress(e.target.value)} className="input" style={{ minHeight: 80 }} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Account Status</label>
                                <select value={status} onChange={e => setStatus(e.target.value)} className="input">
                                    <option value="active">Active - Can log in</option>
                                    <option value="suspended">Suspended - Cannot log in</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                                <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
                            </div>
                        </form>

                        <div className="card">
                            <h3 style={{ marginBottom: 16 }}>Activity Timeline</h3>
                            {timeline.length === 0 ? (
                                <p className="text-muted text-sm">No activity yet. Create an invoice or request to see the timeline.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {timeline.map((item, idx) => (
                                        <div key={item.id} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                                            {idx !== timeline.length - 1 && (
                                                <div style={{ position: 'absolute', left: 5, top: 20, bottom: -16, width: 2, background: 'var(--border-2)' }} />
                                            )}
                                            <div style={{
                                                width: 12, height: 12, borderRadius: '50%', background: 'var(--bg-3)', border: '2px solid var(--amber)',
                                                marginTop: 4, zIndex: 1
                                            }} />
                                            <div style={{ flex: 1, paddingBottom: 16 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                                    <Link href={item.link} className="font-medium hover-text-amber">{item.title}</Link>
                                                    <span className="text-muted text-xs">{item.date.toLocaleDateString()}</span>
                                                </div>
                                                <div className="text-sm text-muted">{item.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {/* LOGIN CODE CARD */}
                        <div className="card" style={{ background: 'var(--bg-3)', borderColor: 'var(--amber)' }}>
                            <div className="stat-label mb-2" style={{ color: 'var(--amber)' }}>Client Login ID</div>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-3)', marginBottom: 16 }}>
                                Give this ID to the client. They will use it to securely log in to the portal without a password.
                            </p>

                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                background: 'var(--bg-2)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-2)'
                            }}>
                                <span className="font-mono" style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)' }}>
                                    {client.clientId}
                                </span>
                                <button type="button" onClick={handleCopy} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px' }}>Copy</button>
                            </div>
                        </div>

                        <div className="card">
                            <h3 style={{ marginBottom: 16 }}>Overview</h3>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>Created</span>
                                <span style={{ fontSize: '0.875rem' }}>{new Date(client.createdAt).toLocaleDateString('en-IN')}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                                <span style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>Invoices</span>
                                <span style={{ fontSize: '0.875rem' }}>{client.invoices.length} total</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-3)', fontSize: '0.875rem' }}>Work Requests</span>
                                <span style={{ fontSize: '0.875rem' }}>{client.requests?.length || 0} total</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
