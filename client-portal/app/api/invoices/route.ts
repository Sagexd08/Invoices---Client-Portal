import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isCompanyRole } from '@/lib/auth-helpers'
import { generateInvoiceNumber, calcInvoiceTotals, audit } from '@/lib/billing'

export async function GET(req: Request) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const limit = 20

    const where = {
        ...(isCompanyRole(user.role) ? {} : { clientId: user.clientId! }),
        ...(status ? { status } : {}),
    }

    const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
            where,
            include: { client: { select: { name: true, clientId: true } }, lines: true },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
        }),
        prisma.invoice.count({ where }),
    ])

    return NextResponse.json({ invoices, total, page, pages: Math.ceil(total / limit) })
}

export async function POST(req: Request) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isCompanyRole(user.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { clientId, lines, dueDate, currency = 'INR', notes } = await req.json()
    if (!clientId || !lines?.length)
        return NextResponse.json({ error: 'clientId and lines are required' }, { status: 400 })

    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const totals = calcInvoiceTotals(lines)
    const invoiceNumber = await generateInvoiceNumber()

    const invoice = await prisma.invoice.create({
        data: {
            invoiceNumber,
            clientId,
            status: 'pending',
            currency,
            dueDate: dueDate ? new Date(dueDate) : null,
            issuedAt: new Date(),
            ...totals,
            lines: {
                create: lines.map((l: { serviceId?: string; description: string; quantity: number; unitPrice: number; taxRate?: number }) => ({
                    serviceId: l.serviceId ?? null,
                    description: l.description,
                    quantity: l.quantity,
                    unitPrice: l.unitPrice,
                    taxRate: l.taxRate ?? 0,
                    lineTotal: l.quantity * l.unitPrice,
                })),
            },
        },
        include: { lines: true, client: true },
    })

    await audit({ actorId: user.dbUserId!, action: 'invoice.created', entityType: 'Invoice', entityId: invoice.id, changes: { invoiceNumber, totalAmount: totals.totalAmount } })

    return NextResponse.json(invoice, { status: 201 })
}
