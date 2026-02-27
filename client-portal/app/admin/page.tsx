import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Users, FileText, CheckCircle, AlertCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Admin · Dashboard' }

function fmtCurrency(n: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

export default async function AdminDashboardPage() {
    const [
        totalClients, activeClients, suspendedClients,
        pendingAgg, paidThisMonth, overdueCount,
        recentClients,
    ] = await Promise.all([
        prisma.client.count(),
        prisma.client.count({ where: { status: 'active' } }),
        prisma.client.count({ where: { status: 'suspended' } }),
        prisma.invoice.aggregate({
            where: { status: { in: ['pending', 'partially_paid'] } },
            _sum: { totalAmount: true }, _count: true,
        }),
        prisma.payment.aggregate({
            where: { paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
            _sum: { amount: true },
        }),
        prisma.invoice.count({ where: { status: 'overdue' } }),
        prisma.client.findMany({
            orderBy: { createdAt: 'desc' }, take: 10,
            include: { _count: { select: { invoices: true } } },
        }),
    ])

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted mt-1">Oxify Labs — Client Portal Overview</p>
                </div>
                <Link href="/admin/clients/new" className="btn btn-primary shadow-lg hover:shadow-xl transition-shadow">+ New Client</Link>
            </div>
            <div className="page-body">
                <div className="stats-grid mb-8">
                    <div className="stat-card flex flex-col justify-between hover:border-border-2 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <div className="stat-label mb-0">Total Clients</div>
                            <Users className="w-5 h-5 text-muted" />
                        </div>
                        <div>
                            <div className="stat-value">{totalClients}</div>
                            <div className="stat-sub">{activeClients} active · {suspendedClients} suspended</div>
                        </div>
                    </div>
                    <div className="stat-card highlight flex flex-col justify-between hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="stat-label mb-0">Outstanding AR</div>
                            <FileText className="w-5 h-5 text-amber" />
                        </div>
                        <div>
                            <div className="stat-value">{fmtCurrency(pendingAgg._sum.totalAmount ?? 0)}</div>
                            <div className="stat-sub">{pendingAgg._count} invoices pending</div>
                        </div>
                    </div>
                    <div className="stat-card flex flex-col justify-between hover:border-border-2 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <div className="stat-label mb-0">Collected This Month</div>
                            <CheckCircle className="w-5 h-5 text-green" />
                        </div>
                        <div className="stat-value" style={{ color: 'var(--green)' }}>{fmtCurrency(paidThisMonth._sum.amount ?? 0)}</div>
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
                        <h3>Clients</h3>
                        <Link href="/admin/clients" className="btn btn-ghost btn-sm">View all →</Link>
                    </div>
                    <table>
                        <thead><tr>
                            <th>Client ID</th><th>Name</th><th>Status</th><th>Invoices</th><th>Created</th><th></th>
                        </tr></thead>
                        <tbody>
                            {recentClients.map(c => (
                                <tr key={c.id}>
                                    <td><span className="font-mono text-amber">{c.clientId}</span></td>
                                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                                    <td><span className={`badge badge-${c.status === 'active' ? 'approved' : 'rejected'}`}>{c.status}</span></td>
                                    <td>{c._count.invoices}</td>
                                    <td className="text-muted">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <Link href={`/admin/clients/${c.clientId}`} className="btn btn-secondary btn-sm">Manage</Link>
                                    </td>
                                </tr>
                            ))}
                            {recentClients.length === 0 && (
                                <tr><td colSpan={6}>
                                    <div className="empty-state">
                                        <div className="empty-icon">◉</div>
                                        <h3>No clients yet</h3>
                                        <p>Create your first client to get started.</p>
                                        <Link href="/admin/clients/new" className="btn btn-primary">+ New Client</Link>
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
