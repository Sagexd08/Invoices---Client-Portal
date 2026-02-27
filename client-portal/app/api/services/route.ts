import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isCompanyRole } from '@/lib/auth-helpers'
import { isCompanyUser } from '@/lib/rbac'

export async function GET() {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const services = await prisma.service.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
    })
    return NextResponse.json(services)
}

export async function POST(req: Request) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isCompanyRole(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { name, description, price, taxRate, sku } = await req.json()
    if (!name || !price || !sku)
        return NextResponse.json({ error: 'name, price, and sku are required' }, { status: 400 })

    const service = await prisma.service.create({
        data: { name, description, price: Number(price), taxRate: Number(taxRate ?? 0), sku },
    })
    return NextResponse.json(service, { status: 201 })
}
