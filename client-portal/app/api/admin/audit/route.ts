import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isCompanyRole } from '@/lib/auth-helpers'

export async function GET(req: Request) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isCompanyRole(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit = 20

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.auditLog.count(),
    ])

    // Enrich with actor emails
    const actorIds = Array.from(new Set(logs.map(l => l.actorId)))
    const actors = await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, email: true, name: true },
    })
    const actorMap = Object.fromEntries(actors.map(a => [a.id, a]))

    const enriched = logs.map(l => ({ ...l, actor: actorMap[l.actorId] ?? null }))

    return NextResponse.json({ logs: enriched, total, page, pages: Math.ceil(total / limit) })
}
