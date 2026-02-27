import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Invoices · Admin' }

const STATUS_COLORS: Record<string, string> = {
    draft: 'pending',
    pending: 'pending',
    partially_paid: 'pending',
    paid: 'approved',
    overdue: 'rejected',
    cancelled: 'rejected',
    refunded: 'rejected',
}

function fmtCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

export default async function AdminInvoicesPage({
    searchParams,
}: {
    searchParams: { status?: string; page?: string }
}) {
    const status = searchParams.status
    const page = Math.max(1, Number(searchParams.page ?? 1))
    const limit = 20

    const where = status ? { status } : {}

    const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
            where,
            include: { client: { select: { name: true, clientId: true } } },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.invoice.count({ where }),
    ])

    const pages = Math.ceil(total / limit)

    const STATUS_FILTERS = ['', 'pending', 'paid', 'overdue', 'partially_paid', 'draft', 'cancelled']

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Invoices</h1>
                    <p>{total} invoice{total !== 1 ? 's' : ''}{status ? ` · ${status}` : ''}</p>
                </div>
                <Link href="/admin/invoices/new" className="btn btn-primary">+ New Invoice</Link>
            </div>

            <div className="page-body">
                {/* Status Filter */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                    {STATUS_FILTERS.map(s => (
                        <Link
                            key={s || 'all'}
                            href={s ? `/admin/invoices?status=${s}` : '/admin/invoices'}
                            className={`btn btn-sm ${status === s || (!status && !s) ? 'btn-primary' : 'btn-ghost'}`}
                        >
                            {s || 'All'}
                        </Link>
                    ))}
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Client</th>
                                <th>Status</th>
                                <th>Total</th>
                                <th>Due Date</th>
                                <th>Issued</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.id}>
                                    <td>
                                        <span className="font-mono" style={{ fontWeight: 600 }}>{inv.invoiceNumber}</span>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{inv.client.name}</div>
                                        <div className="text-muted" style={{ fontSize: '0.8125rem' }}>{inv.client.clientId}</div>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${STATUS_COLORS[inv.status] ?? 'pending'}`}>
                                            {inv.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 600 }}>
                                        {fmtCurrency(inv.totalAmount, inv.currency)}
                                    </td>
                                    <td className="text-muted">
                                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '—'}
                                    </td>
                                    <td className="text-muted">
                                        {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString('en-IN') : '—'}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <Link href={`/dashboard/invoices/${inv.id}`} className="btn btn-secondary btn-sm">View</Link>
                                    </td>
                                </tr>
                            ))}
                            {invoices.length === 0 && (
                                <tr>
                                    <td colSpan={7}>
                                        <div className="empty-state">
                                            <div className="empty-icon">◈</div>
                                            <h3>No invoices{status ? ` with status "${status}"` : ''}</h3>
                                            <Link href="/admin/invoices/new" className="btn btn-primary">+ New Invoice</Link>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pages > 1 && (
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
                        {page > 1 && (
                            <Link href={`/admin/invoices?${status ? `status=${status}&` : ''}page=${page - 1}`} className="btn btn-secondary btn-sm">← Prev</Link>
                        )}
                        <span style={{ padding: '6px 12px', fontSize: '0.875rem', color: 'var(--text-3)' }}>
                            Page {page} of {pages}
                        </span>
                        {page < pages && (
                            <Link href={`/admin/invoices?${status ? `status=${status}&` : ''}page=${page + 1}`} className="btn btn-secondary btn-sm">Next →</Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
