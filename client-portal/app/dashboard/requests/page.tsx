import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCompanyRole } from '@/lib/auth-helpers'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Requests' }

export default async function RequestsPage({ searchParams }: { searchParams: { status?: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return null
    const user = session.user

    const where = {
        ...(isCompanyRole(user.role) ? {} : { clientId: user.clientId! }),
        ...(searchParams.status ? { status: searchParams.status } : {}),
    }

    const requests = await prisma.request.findMany({
        where,
        include: { client: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
    })

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Requests</h1>
                    <p>{requests.length} total</p>
                </div>
            </div>
            <div className="page-body">
                <div className="flex gap-2 mb-6" style={{ flexWrap: 'wrap' }}>
                    <Link href="/dashboard/requests" className={`btn btn-sm ${!searchParams.status ? 'btn-primary' : 'btn-secondary'}`}>All</Link>
                    {['open', 'submitted', 'approved', 'rejected'].map(s => (
                        <Link key={s} href={`/dashboard/requests?status=${s}`}
                            className={`btn btn-sm ${searchParams.status === s ? 'btn-primary' : 'btn-secondary'}`}>{s}</Link>
                    ))}
                </div>

                <div className="table-container">
                    <table>
                        <thead><tr>
                            <th>Title</th>
                            {isCompanyRole(user.role) && <th>Client</th>}
                            <th>Status</th><th>Due</th><th></th>
                        </tr></thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req.id}>
                                    <td style={{ fontWeight: 500 }}>{req.title}</td>
                                    {isCompanyRole(user.role) && <td>{req.client.name}</td>}
                                    <td><span className={`badge badge-${req.status}`}>{req.status}</span></td>
                                    <td className="text-muted">{req.dueDate ? new Date(req.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <Link href={`/dashboard/requests/${req.id}`} className="btn btn-secondary btn-sm">View</Link>
                                    </td>
                                </tr>
                            ))}
                            {!requests.length && (
                                <tr><td colSpan={5}><div className="empty-state"><div className="empty-icon">◎</div><h3>No requests</h3></div></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
