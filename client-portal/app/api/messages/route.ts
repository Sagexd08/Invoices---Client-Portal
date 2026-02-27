import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-helpers'

export async function GET(req: Request) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const threadId = searchParams.get('threadId')
    if (!threadId) return NextResponse.json({ error: 'threadId required' }, { status: 400 })

    const messages = await prisma.message.findMany({ where: { threadId }, orderBy: { createdAt: 'asc' } })
    const authorIds = Array.from(new Set(messages.map(m => m.authorId)))
    const authors = await prisma.user.findMany({ where: { id: { in: authorIds } }, select: { id: true, name: true, email: true, role: true } })
    const authorMap = Object.fromEntries(authors.map(a => [a.id, a]))

    return NextResponse.json(messages.map(m => ({ ...m, author: authorMap[m.authorId] ?? null })))
}

export async function POST(req: Request) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { threadId, body } = await req.json()
    if (!threadId || !body) return NextResponse.json({ error: 'threadId and body required' }, { status: 400 })

    const message = await prisma.message.create({
        data: { threadId, authorId: user.dbUserId!, body },
    })
    return NextResponse.json({ ...message, author: { id: user.dbUserId, name: user.name, role: user.role } }, { status: 201 })
}
