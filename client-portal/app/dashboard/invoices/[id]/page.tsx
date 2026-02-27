import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCompanyRole } from '@/lib/auth-helpers'
import PayButton from './PayButton'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Invoice' }

function fmtCurrency(n: number, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)
}

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return null
    const user = session.user

    const invoice = await prisma.invoice.findUnique({
        where: { id: params.id },
        include: { client: true, lines: { include: { service: true } }, payments: true },
    })

    if (!invoice) return notFound()
    if (!isCompanyRole(user.role) && invoice.clientId !== user.clientId) return notFound()

    const canPay = !isCompanyRole(user.role) && ['pending', 'partially_paid', 'overdue'].includes(invoice.status)

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <Link href="/dashboard/invoices" style={{ color: 'var(--text-3)', fontSize: '0.875rem', display: 'block', marginBottom: 6 }}>← Invoices</Link>
                    <h1 className="font-mono">{invoice.invoiceNumber}</h1>
                    <p>{invoice.client.name}</p>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span className={`badge badge-${invoice.status}`}>{invoice.status}</span>
                    {canPay && (
                        <PayButton
                            invoiceId={invoice.id}
                            amount={invoice.totalAmount}
                            currency={invoice.currency}
                            invoiceNumber={invoice.invoiceNumber}
                        />
                    )}
                </div>
            </div>

            <div className="page-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                    <div className="card">
                        <div className="stat-label mb-4">Invoice Details</div>
                        <table style={{ width: '100%' }}>
                            <tbody>
                                {[
                                    ['Invoice #', <span className="font-mono text-amber">{invoice.invoiceNumber}</span>],
                                    ['Issued', invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString('en-IN') : '—'],
                                    ['Due Date', invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : '—'],
                                    ['Currency', invoice.currency],
                                ].map(([label, value]) => (
                                    <tr key={label as string} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '8px 0', color: 'var(--text-3)', fontSize: '0.8125rem', width: '40%' }}>{label}</td>
                                        <td style={{ padding: '8px 0', fontSize: '0.875rem' }}>{value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="card">
                        <div className="stat-label mb-4">Bill To</div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 4 }}>{invoice.client.name}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--amber)', fontFamily: 'monospace' }}>{invoice.client.clientId}</div>
                        {invoice.client.billingAddress && (
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)', marginTop: 8, whiteSpace: 'pre-line' }}>{invoice.client.billingAddress}</div>
                        )}
                    </div>
                </div>

                {/* Line Items */}
                <div className="table-container mb-6">
                    <div className="table-header"><h3>Line Items</h3></div>
                    <table>
                        <thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Tax</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
                        <tbody>
                            {invoice.lines.map(line => (
                                <tr key={line.id}>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{line.description}</div>
                                        {line.service && <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>{line.service.sku}</div>}
                                    </td>
                                    <td>{line.quantity}</td>
                                    <td>{fmtCurrency(line.unitPrice, invoice.currency)}</td>
                                    <td>{line.taxRate}%</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmtCurrency(line.lineTotal, invoice.currency)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
                    <div className="card" style={{ minWidth: 280 }}>
                        {([['Subtotal', invoice.subtotal], ['Tax', invoice.taxAmount]] as const).map(([l, v]) => (
                            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                                <span style={{ color: 'var(--text-3)' }}>{l}</span>
                                <span>{fmtCurrency(v as number, invoice.currency)}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontWeight: 700, fontSize: '1.125rem' }}>
                            <span>Total</span>
                            <span style={{ color: 'var(--amber)' }}>{fmtCurrency(invoice.totalAmount, invoice.currency)}</span>
                        </div>
                    </div>
                </div>

                {/* Payment History */}
                {invoice.payments.length > 0 && (
                    <div className="table-container">
                        <div className="table-header"><h3>Payment History</h3></div>
                        <table>
                            <thead><tr><th>Payment ID</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                            <tbody>
                                {invoice.payments.map(p => (
                                    <tr key={p.id}>
                                        <td className="font-mono text-muted">{p.razorpayPaymentId ?? p.id.slice(0, 8)}</td>
                                        <td>{fmtCurrency(p.amount, invoice.currency)}</td>
                                        <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                                        <td className="text-muted">{new Date(p.paidAt).toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
