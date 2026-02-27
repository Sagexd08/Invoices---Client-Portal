import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isCompanyRole } from '@/lib/auth-helpers'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const invoice = await prisma.invoice.findUnique({
        where: { id: params.id },
        include: { lines: { include: { service: true } }, client: true, payments: true },
    })
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!isCompanyRole(user.role) && invoice.clientId !== user.clientId)
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    return NextResponse.json(invoice)
}

export async function PATCH(req: Request, { params }: Params) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isCompanyRole(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { status, dueDate } = await req.json()
    const invoice = await prisma.invoice.update({
        where: { id: params.id },
        data: {
            ...(status ? { status } : {}),
            ...(dueDate ? { dueDate: new Date(dueDate) } : {}),
        },
    })
    return NextResponse.json(invoice)
}
