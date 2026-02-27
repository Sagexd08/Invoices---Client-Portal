import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCompanyRole } from '@/lib/auth-helpers'
import Link from 'next/link'
import { Users, FileText, CheckCircle, AlertCircle, Activity, CreditCard } from 'lucide-react'

export const metadata: Metadata = { title: 'Dashboard' }

function fmtCurrency(n: number, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)
    if (!session?.user) return null
    const user = session.user

    if (isCompanyRole(user.role)) {
        const [totalClients, pendingAgg, paidAgg, overdueCount, recentInvoices] = await Promise.all([
            prisma.client.count({ where: { status: 'active' } }),
            prisma.invoice.aggregate({
                where: { status: { in: ['pending', 'partially_paid'] } },
                _sum: { totalAmount: true }, _count: true,
            }),
            prisma.payment.aggregate({
                where: { paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
                _sum: { amount: true },
            }),
            prisma.invoice.count({ where: { status: 'overdue' } }),
            prisma.invoice.findMany({
                orderBy: { createdAt: 'desc' }, take: 8,
                include: { client: { select: { name: true } } },
            }),
        ])

        return (
            <div>
                <div className="page-header">
                    <div className="page-header-left">
                        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted mt-1">Business overview & metrics</p>
                    </div>
                    <Link href="/dashboard/invoices/new" className="btn btn-primary shadow-lg hover:shadow-xl transition-shadow">+ New Invoice</Link>
                </div>
                <div className="page-body">
                    <div className="stats-grid mb-8">
                        <div className="stat-card flex flex-col justify-between hover:border-border-2 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                                <div className="stat-label mb-0">Active Clients</div>
                                <Users className="w-5 h-5 text-muted" />
                            </div>
                            <div className="stat-value">{totalClients}</div>
                        </div>
                        <div className="stat-card highlight flex flex-col justify-between hover:shadow-lg transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="stat-label mb-0">Outstanding AR</div>
                                <FileText className="w-5 h-5 text-amber" />
                            </div>
                            <div>
                                <div className="stat-value">{fmtCurrency(pendingAgg._sum.totalAmount ?? 0)}</div>
                                <div className="stat-sub">{pendingAgg._count} pending invoices</div>
                            </div>
                        </div>
                        <div className="stat-card flex flex-col justify-between hover:border-border-2 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                                <div className="stat-label mb-0">Collected This Month</div>
                                <CheckCircle className="w-5 h-5 text-green" />
                            </div>
                            <div className="stat-value" style={{ color: 'var(--green)' }}>{fmtCurrency(paidAgg._sum.amount ?? 0)}</div>
                        </div>
                        <div className="stat-card flex flex-col justify-between hover:border-border-2 transition-colors">
                            <div className="flex items-center justify-between mb-4">
                                <div className="stat-label mb-0">Overdue</div>
                                <AlertCircle className={`w-5 h-5 ${overdueCount > 0 ? 'text-red' : 'text-muted'}`} />
                            </div>
                            <div className="stat-value" style={{ color: overdueCount > 0 ? 'var(--red)' : 'var(--text)' }}>{overdueCount}</div>
                        </div>
                    </div>

                    <div className="table-container">
                        <div className="table-header">
                            <h3>Recent Invoices</h3>
                            <Link href="/dashboard/invoices" className="btn btn-ghost btn-sm">View all →</Link>
                        </div>
                        <table>
                            <thead><tr><th>Invoice</th><th>Client</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                            <tbody>
                                {recentInvoices.map(inv => (
                                    <tr key={inv.id}>
                                        <td><Link href={`/dashboard/invoices/${inv.id}`} className="text-amber font-mono">{inv.invoiceNumber}</Link></td>
                                        <td>{inv.client.name}</td>
                                        <td>{fmtCurrency(inv.totalAmount, inv.currency)}</td>
                                        <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                                        <td className="text-muted">{new Date(inv.createdAt).toLocaleDateString('en-IN')}</td>
                                    </tr>
                                ))}
                                {!recentInvoices.length && (
                                    <tr><td colSpan={5}><div className="empty-state"><div className="empty-icon">◈</div><h3>No invoices yet</h3></div></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        )
    }
    const [outstanding, invoices, openRequestsCount, requests, payments] = await Promise.all([
        prisma.invoice.aggregate({
            where: { clientId: user.clientId!, status: { in: ['pending', 'partially_paid', 'overdue'] } },
            _sum: { totalAmount: true }, _count: true,
        }),
        prisma.invoice.findMany({
            where: { clientId: user.clientId! },
            orderBy: { createdAt: 'desc' }, take: 10,
            select: { id: true, invoiceNumber: true, totalAmount: true, status: true, dueDate: true, currency: true, createdAt: true },
        }),
        prisma.request.count({ where: { clientId: user.clientId!, status: 'open' } }),
        prisma.request.findMany({
            where: { clientId: user.clientId! },
            orderBy: { createdAt: 'desc' }, take: 15
        }),
        prisma.payment.findMany({
            where: { invoice: { clientId: user.clientId! } },
            orderBy: { paidAt: 'desc' }, take: 15,
            include: { invoice: { select: { invoiceNumber: true, currency: true } } }
        })
    ])

    const timeline = [
        ...invoices.map((inv) => ({
            id: `inv-${inv.id}`,
            type: 'invoice',
            date: new Date(inv.createdAt),
            title: `Invoice Issued: ${inv.invoiceNumber}`,
            desc: `Amount: ${fmtCurrency(inv.totalAmount, inv.currency)}`,
            link: `/dashboard/invoices/${inv.id}`,
            dotColor: 'var(--amber)'
        })),
        ...payments.map((p) => ({
            id: `pay-${p.id}`,
            type: 'payment',
            date: new Date(p.paidAt),
            title: `Payment Received`,
            desc: `Paid for ${p.invoice.invoiceNumber}. Thank you!`,
            link: `/dashboard/invoices/${p.invoiceId}`,
            dotColor: 'var(--green)'
        })),
        ...requests.map((req) => ({
            id: `req-${req.id}`,
            type: 'request',
            date: new Date(req.createdAt),
            title: `Work Update: ${req.title}`,
            desc: `Current Status: ${req.status}`,
            link: `/dashboard/requests/${req.id}`,
            dotColor: 'var(--blue)'
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 15)

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Overview</h1>
                    <p>Welcome back, client portal dashboard</p>
                </div>
                <Link href="/dashboard/requests" className="btn btn-primary">Message Team</Link>
            </div>

            <div className="page-body">
                <div className="stats-grid mb-6">
                    <div className="stat-card highlight flex flex-col justify-between hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="stat-label mb-0">Outstanding Balance</div>
                            <CreditCard className="w-5 h-5 text-amber" />
                        </div>
                        <div>
                            <div className="stat-value">{fmtCurrency(outstanding._sum.totalAmount ?? 0, invoices[0]?.currency || 'INR')}</div>
                            <div className="stat-sub">{outstanding._count} invoice{outstanding._count !== 1 ? 's' : ''} due</div>
                        </div>
                    </div>
                    <div className="stat-card flex flex-col justify-between hover:border-border-2 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <div className="stat-label mb-0">Active Work Streams</div>
                            <Activity className="w-5 h-5 text-blue" />
                        </div>
                        <div className="stat-value">{openRequestsCount}</div>
                    </div>
                </div>

                {outstanding._count > 0 && (
                    <div className="card mb-6" style={{ borderColor: 'rgba(245,158,11,.3)', background: 'linear-gradient(135deg, var(--bg-2), rgba(245,158,11,.04))' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                            <div>
                                <h3 style={{ marginBottom: 4 }}>Outstanding {outstanding._count} invoice{outstanding._count !== 1 ? 's' : ''}</h3>
                                <p>Total due: <strong style={{ color: 'var(--amber)' }}>{fmtCurrency(outstanding._sum.totalAmount ?? 0, invoices[0]?.currency || 'INR')}</strong></p>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <Link href="/dashboard/invoices" className="btn btn-primary">Pay via Razorpay</Link>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 24, alignItems: 'start' }}>

                    {/* Left: Interactions Timeline & Work Done */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3>Project & Payment Timeline</h3>
                        </div>

                        {timeline.length === 0 ? (
                            <div className="empty-state" style={{ minHeight: 200 }}>
                                <div className="empty-icon">⏳</div>
                                <h3 style={{ fontSize: '1rem', marginTop: 16 }}>No activity yet</h3>
                                <p style={{ fontSize: '0.875rem' }}>Your invoices, payments, and work updates will appear here.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {timeline.map((item, idx) => (
                                    <div key={item.id} style={{ display: 'flex', gap: 16, position: 'relative' }}>
                                        {idx !== timeline.length - 1 && (
                                            <div style={{ position: 'absolute', left: 5, top: 20, bottom: -16, width: 2, background: 'var(--border-2)' }} />
                                        )}
                                        <div style={{
                                            width: 12, height: 12, borderRadius: '50%', background: 'var(--bg-3)', border: `2px solid ${item.dotColor}`,
                                            marginTop: 4, zIndex: 1
                                        }} />
                                        <div style={{ flex: 1, paddingBottom: 16 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                                <Link href={item.link} className="font-medium hover-text-amber text-sm">{item.title}</Link>
                                                <span className="text-muted text-xs">{item.date.toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-xs text-muted mt-1">{item.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: Invoices Summary */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3>Recent Bills</h3>
                            <Link href="/dashboard/invoices" style={{ fontSize: '0.8125rem', color: 'var(--amber)' }}>View All</Link>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {invoices.slice(0, 5).map(inv => (
                                <Link
                                    href={`/dashboard/invoices/${inv.id}`}
                                    key={inv.id}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', padding: '12px',
                                        background: 'var(--bg-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                                        textDecoration: 'none', color: 'inherit'
                                    }}
                                >
                                    <div>
                                        <div className="font-mono text-amber" style={{ fontSize: '0.8125rem' }}>{inv.invoiceNumber}</div>
                                        <div style={{ fontSize: '0.875rem', marginTop: 4 }}>{fmtCurrency(inv.totalAmount, inv.currency)}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                                        <span className={`badge badge-${inv.status}`}>{inv.status}</span>
                                    </div>
                                </Link>
                            ))}
                            {invoices.length === 0 && (
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-3)' }}>No bills yet.</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
