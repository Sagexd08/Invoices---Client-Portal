import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Audit Log · Admin' }

export default async function AdminAuditPage({
    searchParams,
}: {
    searchParams: { page?: string }
}) {
    const page = Math.max(1, Number(searchParams.page ?? 1))
    const limit = 20

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.auditLog.count(),
    ])

    // Enrich with actor info
    const actorIds = Array.from(new Set(logs.map(l => l.actorId)))
    const actors = await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, email: true, name: true },
    })
    const actorMap = Object.fromEntries(actors.map(a => [a.id, a]))

    const pages = Math.ceil(total / limit)

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <h1>Audit Log</h1>
                    <p>{total} event{total !== 1 ? 's' : ''} recorded</p>
                </div>
            </div>

            <div className="page-body">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Actor</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>Changes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => {
                                const actor = actorMap[log.actorId]
                                let changes: Record<string, unknown> | null = null
                                try { changes = log.changesJson ? JSON.parse(log.changesJson) : null } catch { /* ignore */ }

                                return (
                                    <tr key={log.id}>
                                        <td className="text-muted" style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                                            {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td>
                                            {actor ? (
                                                <div>
                                                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{actor.name ?? actor.email}</div>
                                                    {actor.name && <div className="text-muted" style={{ fontSize: '0.75rem' }}>{actor.email}</div>}
                                                </div>
                                            ) : (
                                                <span className="text-muted font-mono" style={{ fontSize: '0.75rem' }}>{log.actorId.slice(0, 12)}…</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className="font-mono" style={{ fontSize: '0.8125rem', color: 'var(--amber)' }}>{log.action}</span>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '0.875rem' }}>{log.entityType}</div>
                                            <div className="text-muted font-mono" style={{ fontSize: '0.75rem' }}>{log.entityId.slice(0, 12)}…</div>
                                        </td>
                                        <td>
                                            {changes ? (
                                                <details>
                                                    <summary style={{ cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-3)' }}>View</summary>
                                                    <pre style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--text-2)', whiteSpace: 'pre-wrap', maxWidth: 300 }}>
                                                        {JSON.stringify(changes, null, 2)}
                                                    </pre>
                                                </details>
                                            ) : (
                                                <span className="text-muted">—</span>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={5}>
                                        <div className="empty-state">
                                            <div className="empty-icon">◑</div>
                                            <h3>No audit events yet</h3>
                                            <p>Actions taken in the admin panel will appear here.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pages > 1 && (
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 24 }}>
                        {page > 1 && (
                            <Link href={`/admin/audit?page=${page - 1}`} className="btn btn-secondary btn-sm">← Prev</Link>
                        )}
                        <span style={{ padding: '6px 12px', fontSize: '0.875rem', color: 'var(--text-3)' }}>
                            Page {page} of {pages}
                        </span>
                        {page < pages && (
                            <Link href={`/admin/audit?page=${page + 1}`} className="btn btn-secondary btn-sm">Next →</Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
