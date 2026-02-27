'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Client = { id: string; clientId: string; name: string; currency: string }
type Service = { id: string; sku: string; name: string; price: number; taxRate: number }
type LineItem = { serviceId: string; description: string; quantity: number; unitPrice: number; taxRate: number }

export default function NewInvoicePage() {
    const [clients, setClients] = useState<Client[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [clientId, setClientId] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [lines, setLines] = useState<LineItem[]>([
        { serviceId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0 },
    ])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    useEffect(() => {
        fetch('/api/admin/clients').then(r => r.json()).then(setClients)
        fetch('/api/services').then(r => r.json()).then(setServices)
    }, [])

    function updateLine(index: number, field: keyof LineItem, value: string | number) {
        setLines(prev => prev.map((l, i) => i === index ? { ...l, [field]: value } : l))
    }

    function applyService(index: number, svcId: string) {
        const svc = services.find(s => s.id === svcId)
        if (svc) {
            setLines(prev => prev.map((l, i) =>
                i === index ? { ...l, serviceId: svc.id, description: svc.name, unitPrice: svc.price, taxRate: svc.taxRate } : l
            ))
        } else {
            updateLine(index, 'serviceId', svcId)
        }
    }

    function addLine() {
        setLines(prev => [...prev, { serviceId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0 }])
    }

    function removeLine(index: number) {
        setLines(prev => prev.filter((_, i) => i !== index))
    }

    const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0)
    const taxTotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice * (l.taxRate / 100), 0)
    const total = subtotal + taxTotal

    const selectedClient = clients.find(c => c.id === clientId)
    const currency = selectedClient?.currency ?? 'INR'

    function fmt(n: number) {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!clientId) { setError('Please select a client'); return }
        if (lines.some(l => !l.description)) { setError('All line items need a description'); return }
        setLoading(true)
        setError('')

        const res = await fetch('/api/invoices', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                clientId,
                dueDate: dueDate || undefined,
                currency,
                lines: lines.map(l => ({
                    serviceId: l.serviceId || null,
                    description: l.description,
                    quantity: Number(l.quantity),
                    unitPrice: Number(l.unitPrice),
                    taxRate: Number(l.taxRate),
                })),
            }),
        })

        if (!res.ok) {
            const data = await res.json()
            setError(data.error || 'Failed to create invoice')
            setLoading(false)
            return
        }

        const inv = await res.json()
        router.push(`/dashboard/invoices/${inv.id}`)
    }

    return (
        <div style={{ maxWidth: 800 }}>
            <div className="page-header">
                <div className="page-header-left">
                    <Link href="/admin/invoices" style={{ color: 'var(--text-3)', fontSize: '0.875rem', display: 'block', marginBottom: 6 }}>← Back to Invoices</Link>
                    <h1>New Invoice</h1>
                    <p>Invoice number will be auto-generated on creation.</p>
                </div>
            </div>

            <div className="page-body">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {error && <div className="form-error">⚠ {error}</div>}

                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <h3>Invoice Details</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">Client <span className="required">*</span></label>
                                <select className="input" value={clientId} onChange={e => setClientId(e.target.value)} required>
                                    <option value="">Select client…</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.clientId})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Due Date</label>
                                <input type="date" className="input" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Line Items</h3>
                            <button type="button" onClick={addLine} className="btn btn-ghost btn-sm">+ Add Line</button>
                        </div>

                        {lines.map((line, i) => (
                            <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 80px 100px 80px 32px', gap: 10, alignItems: 'end', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Service</label>
                                    <select className="input" value={line.serviceId} onChange={e => applyService(i, e.target.value)} style={{ fontSize: '0.8125rem' }}>
                                        <option value="">Manual entry</option>
                                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Description *</label>
                                    <input className="input" value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} required style={{ fontSize: '0.8125rem' }} />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Qty</label>
                                    <input type="number" className="input" min={1} value={line.quantity} onChange={e => updateLine(i, 'quantity', Number(e.target.value))} style={{ fontSize: '0.8125rem' }} />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Unit Price</label>
                                    <input type="number" className="input" min={0} step="0.01" value={line.unitPrice} onChange={e => updateLine(i, 'unitPrice', Number(e.target.value))} style={{ fontSize: '0.8125rem' }} />
                                </div>
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Tax %</label>
                                    <input type="number" className="input" min={0} max={100} value={line.taxRate} onChange={e => updateLine(i, 'taxRate', Number(e.target.value))} style={{ fontSize: '0.8125rem' }} />
                                </div>
                                <button type="button" onClick={() => removeLine(i)} disabled={lines.length === 1} style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '1rem', alignSelf: 'center', marginTop: 16 }}>×</button>
                            </div>
                        ))}

                        {/* Totals */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', marginTop: 8 }}>
                            <div style={{ display: 'flex', gap: 48, fontSize: '0.875rem', color: 'var(--text-3)' }}>
                                <span>Subtotal</span>
                                <span style={{ minWidth: 100, textAlign: 'right', fontFamily: 'monospace' }}>{fmt(subtotal)}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 48, fontSize: '0.875rem', color: 'var(--text-3)' }}>
                                <span>Tax</span>
                                <span style={{ minWidth: 100, textAlign: 'right', fontFamily: 'monospace' }}>{fmt(taxTotal)}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 48, fontSize: '1rem', fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                                <span>Total</span>
                                <span style={{ minWidth: 100, textAlign: 'right', fontFamily: 'monospace' }}>{fmt(total)}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <Link href="/admin/invoices" className="btn btn-secondary">Cancel</Link>
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? 'Creating…' : 'Create Invoice'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
