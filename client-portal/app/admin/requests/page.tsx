import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Requests · Admin' }

const STATUS_COLORS: Record<string, string> = {
    open: 'pending',
    submitted: 'pending',
    approved: 'approved',
    rejected: 'rejected',
}

export default async function AdminRequestsPage({
    searchParams,
}: {
    searchParams: { status?: string }
}) {
    const status = searchParams.status
    const where = status ? { status } : {}

    const requests = await prisma.request.findMany({
        where,
        include: { client: { select: { name: true, clientId: true } } },
        orderBy: { createdAt: 'desc' },
    })

    const STATUS_FILTERS = ['', 'open', 'submitted', 'approved', 'rejected']

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Client Requests</h1>
                    <p>{requests.length} request{requests.length !== 1 ? 's' : ''}{status ? ` · ${status}` : ''}</p>
                </div>
            </div>

            <div className="page-body">
                {/* Status Filter */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                    {STATUS_FILTERS.map(s => (
                        <Link
                            key={s || 'all'}
                            href={s ? `/admin/requests?status=${s}` : '/admin/requests'}
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
                                <th>Title</th>
                                <th>Client</th>
                                <th>Status</th>
                                <th>Due Date</th>
                                <th>Created</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req.id}>
                                    <td style={{ fontWeight: 500 }}>{req.title}</td>
                                    <td>
                                        <div>{req.client.name}</div>
                                        <div className="text-muted" style={{ fontSize: '0.8125rem' }}>{req.client.clientId}</div>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${STATUS_COLORS[req.status] ?? 'pending'}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="text-muted">
                                        {req.dueDate ? new Date(req.dueDate).toLocaleDateString('en-IN') : '—'}
                                    </td>
                                    <td className="text-muted">
                                        {new Date(req.createdAt).toLocaleDateString('en-IN')}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <Link href={`/dashboard/requests/${req.id}`} className="btn btn-secondary btn-sm">View</Link>
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan={6}>
                                        <div className="empty-state">
                                            <div className="empty-icon">◎</div>
                                            <h3>No requests{status ? ` with status "${status}"` : ''}</h3>
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
