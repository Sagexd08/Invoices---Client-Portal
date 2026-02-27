import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createHmac } from 'crypto'
import { audit } from '@/lib/billing'
export async function POST(req: Request) {
    const body = await req.text()
    const signature = req.headers.get('x-razorpay-signature') ?? ''
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? ''
    const expected = createHmac('sha256', secret).update(body).digest('hex')
    if (expected !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)

    if (event.event === 'payment.captured') {
        const payment = event.payload.payment.entity
        const orderId: string = payment.order_id
        const paymentId: string = payment.id
        const amountPaise: number = payment.amount

        // Find invoice by Razorpay order ID
        const invoice = await prisma.invoice.findFirst({
            where: { razorpayOrderId: orderId },
        })
        if (!invoice) {
            console.error('Webhook: invoice not found for order', orderId)
            return NextResponse.json({ received: true })
        }

        // Idempotency – skip if already recorded
        const existing = await prisma.payment.findFirst({
            where: { razorpayPaymentId: paymentId },
        })
        if (existing) return NextResponse.json({ received: true })

        await prisma.$transaction([
            prisma.payment.create({
                data: {
                    invoiceId: invoice.id,
                    razorpayOrderId: orderId,
                    razorpayPaymentId: paymentId,
                    amount: amountPaise / 100,
                    status: 'succeeded',
                },
            }),
            prisma.invoice.update({
                where: { id: invoice.id },
                data: { status: 'paid' },
            }),
        ])

        await audit({
            actorId: 'razorpay-webhook',
            action: 'invoice.paid',
            entityType: 'Invoice',
            entityId: invoice.id,
            changes: { razorpayPaymentId: paymentId, amount: amountPaise / 100 },
        })
    }

    if (event.event === 'payment.failed') {
        const payment = event.payload.payment.entity
        const orderId: string = payment.order_id
        const invoice = await prisma.invoice.findFirst({ where: { razorpayOrderId: orderId } })
        if (invoice) {
            await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'pending' } })
        }
    }

    if (event.event === 'refund.created') {
        const refund = event.payload.refund.entity
        const paymentRecord = await prisma.payment.findFirst({
            where: { razorpayPaymentId: refund.payment_id },
        })
        if (paymentRecord) {
            await prisma.invoice.update({
                where: { id: paymentRecord.invoiceId },
                data: { status: 'refunded' },
            })
        }
    }

    return NextResponse.json({ received: true })
}
