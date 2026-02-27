'use client'
import { useState, useEffect } from 'react'

type Service = {
    id: string
    sku: string
    name: string
    description: string | null
    price: number
    taxRate: number
    isActive: boolean
}

export default function AdminServicesPage() {
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const [sku, setSku] = useState('')
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [price, setPrice] = useState('')
    const [taxRate, setTaxRate] = useState('18')

    function fmt(n: number) {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)
    }

    async function load() {
        const res = await fetch('/api/services')
        if (res.ok) setServices(await res.json())
        setLoading(false)
    }

    useEffect(() => { load() }, [])

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)
        setError('')
        const res = await fetch('/api/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sku: sku.toUpperCase(), name, description, price: Number(price), taxRate: Number(taxRate) }),
        })
        if (!res.ok) {
            const d = await res.json()
            setError(d.error || 'Failed to create service')
        } else {
            setSku(''); setName(''); setDescription(''); setPrice(''); setTaxRate('18')
            setShowForm(false)
            await load()
        }
        setSaving(false)
    }

    async function toggleActive(svc: Service) {
        await fetch(`/api/services/${svc.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !svc.isActive }),
        })
        await load()
    }

    if (loading) return <div className="p-8">Loading services...</div>

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Service Catalog</h1>
                    <p>{services.filter(s => s.isActive).length} active services</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
                    {showForm ? 'Cancel' : '+ Add Service'}
                </button>
            </div>

            <div className="page-body">
                {showForm && (
                    <form onSubmit={handleCreate} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
                        <h3>New Service</h3>
                        {error && <div className="form-error">⚠ {error}</div>}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">SKU <span className="required">*</span></label>
                                <input className="input" value={sku} onChange={e => setSku(e.target.value)} placeholder="e.g. WEB-DEV" required style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Service Name <span className="required">*</span></label>
                                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Web Development" required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <input className="input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional short description" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">Unit Price (INR) <span className="required">*</span></label>
                                <input type="number" className="input" min={0} step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tax Rate (%)</label>
                                <input type="number" className="input" min={0} max={100} value={taxRate} onChange={e => setTaxRate(e.target.value)} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving…' : 'Create Service'}</button>
                        </div>
                    </form>
                )}

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Price</th>
                                <th>Tax</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map(svc => (
                                <tr key={svc.id} style={{ opacity: svc.isActive ? 1 : 0.5 }}>
                                    <td><span className="font-mono text-amber">{svc.sku}</span></td>
                                    <td style={{ fontWeight: 500 }}>{svc.name}</td>
                                    <td className="text-muted">{svc.description || '—'}</td>
                                    <td style={{ fontFamily: 'monospace' }}>{fmt(svc.price)}</td>
                                    <td className="text-muted">{svc.taxRate}%</td>
                                    <td>
                                        <span className={`badge badge-${svc.isActive ? 'approved' : 'rejected'}`}>
                                            {svc.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => toggleActive(svc)}
                                        >
                                            {svc.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {services.length === 0 && (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="empty-state">
                                            <div className="empty-icon">◆</div>
                                            <h3>No services yet</h3>
                                            <p>Add services to use as invoice line items.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
