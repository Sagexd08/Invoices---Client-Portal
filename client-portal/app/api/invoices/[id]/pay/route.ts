import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { razorpay } from '@/lib/razorpay'
import { getAuthUser } from '@/lib/auth-helpers'
import { audit } from '@/lib/billing'

type Params = { params: { id: string } }

export async function POST(_req: Request, { params }: Params) {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const invoice = await prisma.invoice.findUnique({
        where: { id: params.id },
        include: { client: true },
    })
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (user.clientId && invoice.clientId !== user.clientId)
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (invoice.status === 'paid')
        return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 })

    const amountInPaise = Math.round(invoice.totalAmount * 100)
    const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: invoice.currency,
        receipt: invoice.invoiceNumber,
        notes: { invoiceId: invoice.id, clientId: invoice.clientId },
    })

    await prisma.invoice.update({ where: { id: invoice.id }, data: { razorpayOrderId: order.id } })
    await audit({ actorId: user.dbUserId!, action: 'invoice.payment_initiated', entityType: 'Invoice', entityId: invoice.id, changes: { razorpayOrderId: order.id } })

    return NextResponse.json({
        orderId: order.id,
        amount: amountInPaise,
        currency: invoice.currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.client.name,
    })
}
