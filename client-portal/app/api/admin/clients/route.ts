import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isCompanyRole } from '@/lib/auth-helpers'
import { generateClientId, audit } from '@/lib/billing'

export async function GET() {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isCompanyRole(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const clients = await prisma.client.findMany({
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { invoices: true } } },
    })
    return NextResponse.json(clients)
}

export async function POST(req: Request) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'company_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { name, billingAddress, timezone, currency = 'INR' } = await req.json()
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

    const clientId = await generateClientId()
    const client = await prisma.client.create({
        data: { clientId, name, billingAddress, timezone, currency },
    })

    await audit({ actorId: user.dbUserId!, action: 'client.created', entityType: 'Client', entityId: client.id, changes: { clientId, name } })
    return NextResponse.json(client, { status: 201 })
}
