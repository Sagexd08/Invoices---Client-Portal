import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isCompanyRole } from '@/lib/auth-helpers'

type Params = { params: { clientId: string } }

export async function GET(_req: Request, { params }: Params) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isCompanyRole(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const client = await prisma.client.findUnique({
        where: { clientId: params.clientId },
        include: {
            invoices: {
                orderBy: { createdAt: 'desc' },
                take: 20,
                include: { payments: true }
            },
            requests: { orderBy: { createdAt: 'desc' }, take: 20 },
            users: { select: { id: true, email: true, name: true, role: true } },
        },
    })
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(client)
}

export async function PATCH(req: Request, { params }: Params) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (user.role !== 'company_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { name, billingAddress, timezone, currency, status } = body

    const client = await prisma.client.update({
        where: { clientId: params.clientId },
        data: {
            ...(name && { name }),
            ...(billingAddress && { billingAddress }),
            ...(timezone && { timezone }),
            ...(currency && { currency }),
            ...(status && { status }),
        },
    })
    return NextResponse.json(client)
}
