import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isCompanyRole } from '@/lib/auth-helpers'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isCompanyRole(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const request = await prisma.request.findUnique({
        where: { id: params.id },
        include: { client: true },
    })
    if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const attachments = await prisma.attachment.findMany({
        where: { ownerType: 'request', ownerId: request.id },
        orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ ...request, attachments })
}

export async function PATCH(req: Request, { params }: Params) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { status } = await req.json()
    const allowed = isCompanyRole(user.role) ? ['approved', 'rejected'] : ['submitted']
    if (!allowed.includes(status))
        return NextResponse.json({ error: `Cannot set status "${status}"` }, { status: 400 })

    const request = await prisma.request.update({ where: { id: params.id }, data: { status } })
    return NextResponse.json(request)
}
