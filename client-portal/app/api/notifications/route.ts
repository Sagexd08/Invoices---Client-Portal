import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isCompanyRole } from '@/lib/auth-helpers'

export async function GET() {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const where = isCompanyRole(user.role)
        ? {}
        : { entityId: { in: await getClientEntityIds(user.clientId!) } }

    const recent = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 20,
    })
    return NextResponse.json({ events: recent })
}

async function getClientEntityIds(clientId: string): Promise<string[]> {
    const [invoices, requests] = await Promise.all([
        prisma.invoice.findMany({ where: { clientId }, select: { id: true } }),
        prisma.request.findMany({ where: { clientId }, select: { id: true } }),
    ])
    return [clientId, ...invoices.map(i => i.id), ...requests.map(r => r.id)]
}
