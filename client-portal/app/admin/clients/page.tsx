import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Admin · Clients' }

export default async function AdminClientsPage() {
    const clients = await prisma.client.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { invoices: true } } },
    })

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Clients</h1>
                    <p>Manage all client accounts</p>
                </div>
                <Link href="/admin/clients/new" className="btn btn-primary">+ New Client</Link>
            </div>

            <div className="page-body">
                <div className="table-container">
                    <table>
                        <thead><tr>
                            <th>Client ID (Login Code)</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Invoices</th>
                            <th>Created</th>
                            <th></th>
                        </tr></thead>
                        <tbody>
                            {clients.map(c => (
                                <tr key={c.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span className="font-mono text-amber" style={{ fontSize: '1rem', fontWeight: 600 }}>{c.clientId}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{c.name}</td>
                                    <td><span className={`badge badge-${c.status === 'active' ? 'approved' : 'rejected'}`}>{c.status}</span></td>
                                    <td>{c._count.invoices}</td>
                                    <td className="text-muted">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <Link href={`/admin/clients/${c.clientId}`} className="btn btn-secondary btn-sm">Manage</Link>
                                    </td>
                                </tr>
                            ))}
                            {clients.length === 0 && (
                                <tr><td colSpan={6}>
                                    <div className="empty-state">
                                        <div className="empty-icon">◉</div>
                                        <h3>No clients yet</h3>
                                        <p>Create your first client to generate a Client ID.</p>
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
