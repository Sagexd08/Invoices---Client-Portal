import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isCompanyRole } from '@/lib/auth-helpers'

export async function GET(req: Request) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where = {
        ...(isCompanyRole(user.role) ? {} : { clientId: user.clientId! }),
        ...(status ? { status } : {}),
    }

    const requests = await prisma.request.findMany({
        where,
        include: { client: { select: { name: true, clientId: true } } },
        orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(requests)
}

export async function POST(req: Request) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isCompanyRole(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { clientId, title, fieldsJson, dueDate } = await req.json()
    if (!clientId || !title)
        return NextResponse.json({ error: 'clientId and title required' }, { status: 400 })

    const request = await prisma.request.create({
        data: {
            clientId,
            title,
            fieldsJson: fieldsJson ? JSON.stringify(fieldsJson) : null,
            dueDate: dueDate ? new Date(dueDate) : null,
        },
        include: { client: true },
    })
    return NextResponse.json(request, { status: 201 })
}
