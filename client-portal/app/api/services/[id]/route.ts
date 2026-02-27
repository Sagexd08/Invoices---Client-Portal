import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isCompanyRole } from '@/lib/auth-helpers'

type Params = { params: { id: string } }

export async function PATCH(req: Request, { params }: Params) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isCompanyRole(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { name, description, price, taxRate, isActive } = body

    const service = await prisma.service.update({
        where: { id: params.id },
        data: {
            ...(name !== undefined && { name }),
            ...(description !== undefined && { description }),
            ...(price !== undefined && { price: Number(price) }),
            ...(taxRate !== undefined && { taxRate: Number(taxRate) }),
            ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        },
    })
    return NextResponse.json(service)
}

export async function DELETE(_req: Request, { params }: Params) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isCompanyRole(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await prisma.service.update({
        where: { id: params.id },
        data: { isActive: false },
    })
    return NextResponse.json({ ok: true })
}
