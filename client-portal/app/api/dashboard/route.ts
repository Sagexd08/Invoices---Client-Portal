import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, isCompanyRole } from '@/lib/auth-helpers'

export async function GET() {
    const user = await getAuthUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const isCompany = isCompanyRole(user.role)

    if (isCompany) {
        const [totalClients, pendingInvoices, paidThisMonth, overdueInvoices] = await Promise.all([
            prisma.client.count({ where: { status: 'active' } }),
            prisma.invoice.aggregate({
                where: { status: { in: ['pending', 'partially_paid'] } },
                _sum: { totalAmount: true }, _count: true,
            }),
            prisma.payment.aggregate({
                where: { paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } },
                _sum: { amount: true },
            }),
            prisma.invoice.count({ where: { status: 'overdue' } }),
        ])
        return NextResponse.json({
            role: 'company',
            totalClients,
            pendingAmount: pendingInvoices._sum.totalAmount ?? 0,
            pendingCount: pendingInvoices._count,
            collectedThisMonth: paidThisMonth._sum.amount ?? 0,
            overdueInvoices,
        })
    }

    const [outstanding, recent, openRequests] = await Promise.all([
        prisma.invoice.aggregate({
            where: { clientId: user.clientId!, status: { in: ['pending', 'partially_paid', 'overdue'] } },
            _sum: { totalAmount: true }, _count: true,
        }),
        prisma.invoice.findMany({
            where: { clientId: user.clientId! },
            orderBy: { createdAt: 'desc' }, take: 5,
            select: { id: true, invoiceNumber: true, totalAmount: true, status: true, dueDate: true },
        }),
        prisma.request.count({ where: { clientId: user.clientId!, status: 'open' } }),
    ])
    return NextResponse.json({
        role: 'client',
        outstandingAmount: outstanding._sum.totalAmount ?? 0,
        outstandingCount: outstanding._count,
        recentInvoices: recent,
        openRequests,
    })
}
