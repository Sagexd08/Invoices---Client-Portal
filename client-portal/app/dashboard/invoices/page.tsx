import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCompanyRole } from '@/lib/auth-helpers'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Invoices' }

function fmtCurrency(n: number, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

const STATUSES = ['pending', 'paid', 'overdue', 'draft', 'cancelled', 'refunded']

export default async function InvoicesPage({ searchParams }: { searchParams: { status?: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return null
    const user = session.user

    const where = {
        ...(isCompanyRole(user.role) ? {} : { clientId: user.clientId! }),
        ...(searchParams.status ? { status: searchParams.status } : {}),
    }

    const invoices = await prisma.invoice.findMany({
        where,
        include: { client: { select: { name: true, clientId: true } } },
        orderBy: { createdAt: 'desc' },
    })

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Invoices</h1>
                    <p>{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
                </div>
                {isCompanyRole(user.role) && (
                    <Link href="/dashboard/invoices/new" className="btn btn-primary">+ New Invoice</Link>
                )}
            </div>
            <div className="page-body">
                <div className="flex gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
                    <Link href="/dashboard/invoices" className={`btn btn-sm ${!searchParams.status ? 'btn-primary' : 'btn-secondary'}`}>All</Link>
                    {STATUSES.map(s => (
                        <Link key={s} href={`/dashboard/invoices?status=${s}`}
                            className={`btn btn-sm ${searchParams.status === s ? 'btn-primary' : 'btn-secondary'}`}>{s}</Link>
                    ))}
                </div>

                <div className="table-container">
                    <table>
                        <thead><tr>
                            <th>Invoice #</th>
                            {isCompanyRole(user.role) && <th>Client</th>}
                            <th>Amount</th><th>Status</th><th>Issued</th><th>Due</th><th></th>
                        </tr></thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.id}>
                                    <td><span className="font-mono text-amber">{inv.invoiceNumber}</span></td>
                                    {isCompanyRole(user.role) && <td>{inv.client.name}</td>}
                                    <td><strong>{fmtCurrency(inv.totalAmount, inv.currency)}</strong></td>
                                    <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                                    <td className="text-muted">{inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString('en-IN') : '—'}</td>
                                    <td className="text-muted">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <Link href={`/dashboard/invoices/${inv.id}`} className="btn btn-secondary btn-sm">View</Link>
                                    </td>
                                </tr>
                            ))}
                            {!invoices.length && (
                                <tr><td colSpan={7}>
                                    <div className="empty-state"><div className="empty-icon">◈</div>
                                        <h3>No invoices{searchParams.status ? ` with status "${searchParams.status}"` : ''}</h3>
                                    </div>
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
