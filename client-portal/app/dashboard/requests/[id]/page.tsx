import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCompanyRole } from '@/lib/auth-helpers'
import MessageThread from '@/components/MessageThread'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Request' }

export default async function RequestDetailPage({ params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return null
    const user = session.user

    const request = await prisma.request.findUnique({
        where: { id: params.id },
        include: { client: true },
    })
    if (!request) return notFound()
    if (!isCompanyRole(user.role) && request.clientId !== user.clientId) return notFound()

    const attachments = await prisma.attachment.findMany({
        where: { ownerType: 'request', ownerId: request.id },
        orderBy: { createdAt: 'asc' },
    })

    const messages = await prisma.message.findMany({
        where: { threadId: request.id },
        orderBy: { createdAt: 'asc' },
    })
    const authorIds = Array.from(new Set(messages.map(m => m.authorId)))
    const authors = await prisma.user.findMany({
        where: { id: { in: authorIds } },
        select: { id: true, name: true, email: true, role: true },
    })
    const authorMap = Object.fromEntries(authors.map(a => [a.id, a]))
    const enrichedMessages = messages.map(m => ({ ...m, author: authorMap[m.authorId] ?? null }))

    return (
        <div>
            <div className="page-header">
                <div className="page-header-left">
                    <Link href="/dashboard/requests" style={{ color: 'var(--text-3)', fontSize: '0.875rem', display: 'block', marginBottom: 6 }}>← Requests</Link>
                    <h1>{request.title}</h1>
                    <p>{request.client.name}</p>
                </div>
                <span className={`badge badge-${request.status}`}>{request.status}</span>
            </div>

            <div className="page-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
                    <MessageThread
                        threadId={request.id}
                        initialMessages={enrichedMessages}
                        currentUserId={user.dbUserId!}
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="card">
                            <h3 style={{ marginBottom: 12 }}>Attachments</h3>
                            {!attachments.length
                                ? <p style={{ fontSize: '0.875rem' }}>No files yet</p>
                                : attachments.map(a => (
                                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--bg-3)', borderRadius: 'var(--radius-sm)', marginTop: 6 }}>
                                        <span style={{ fontSize: '0.8125rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {a.storagePath.split('/').pop()}
                                        </span>
                                        <span className={`badge badge-${a.virusStatus === 'clean' ? 'approved' : a.virusStatus === 'infected' ? 'rejected' : 'draft'}`}>{a.virusStatus}</span>
                                    </div>
                                ))
                            }
                        </div>

                        <div className="card">
                            <h3 style={{ marginBottom: 12 }}>Details</h3>
                            {[
                                ['Status', <span className={`badge badge-${request.status}`}>{request.status}</span>],
                                ['Due', request.dueDate ? new Date(request.dueDate).toLocaleDateString('en-IN') : '—'],
                                ['Created', new Date(request.createdAt).toLocaleDateString('en-IN')],
                            ].map(([l, v]) => (
                                <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                                    <span style={{ color: 'var(--text-3)' }}>{l}</span><span>{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
