import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isCompanyRole } from '@/lib/auth-helpers'

type Params = { params: { id: string } }

export async function POST(req: Request, { params }: Params) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const request = await prisma.request.findUnique({ where: { id: params.id } })
    if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (user.clientId && request.clientId !== user.clientId)
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { storagePath } = await req.json()
    if (!storagePath) return NextResponse.json({ error: 'storagePath required' }, { status: 400 })

    const attachment = await prisma.attachment.create({
        data: { ownerType: 'request', ownerId: params.id, storagePath, virusStatus: 'pending' },
    })
    return NextResponse.json(attachment, { status: 201 })
}

export async function GET(_req: Request, { params }: Params) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const attachments = await prisma.attachment.findMany({
        where: { ownerType: 'request', ownerId: params.id },
        orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(attachments)
}
