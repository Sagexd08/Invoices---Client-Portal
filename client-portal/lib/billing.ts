import { prisma } from '@/lib/prisma'

const CURRENT_YEAR = new Date().getFullYear()

export async function generateInvoiceNumber(): Promise<string> {
    const prefix = `INV-${CURRENT_YEAR}-`
    const latest = await prisma.invoice.findFirst({
        where: { invoiceNumber: { startsWith: prefix } },
        orderBy: { invoiceNumber: 'desc' },
    })
    const next = latest
        ? parseInt(latest.invoiceNumber.replace(prefix, ''), 10) + 1
        : 1
    return `${prefix}${String(next).padStart(5, '0')}`
}

export async function generateClientId(): Promise<string> {
    const prefix = `CL-${CURRENT_YEAR}-`
    const latest = await prisma.client.findFirst({
        where: { clientId: { startsWith: prefix } },
        orderBy: { clientId: 'desc' },
    })
    const next = latest
        ? parseInt(latest.clientId.replace(prefix, ''), 10) + 1
        : 1
    return `${prefix}${String(next).padStart(5, '0')}`
}

/** Calculates invoice totals from line items */
export function calcInvoiceTotals(
    lines: { quantity: number; unitPrice: number; taxRate: number }[]
) {
    const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0)
    const taxAmount = lines.reduce(
        (sum, l) => sum + l.quantity * l.unitPrice * (l.taxRate / 100),
        0
    )
    return {
        subtotal: Math.round(subtotal * 100) / 100,
        taxAmount: Math.round(taxAmount * 100) / 100,
        totalAmount: Math.round((subtotal + taxAmount) * 100) / 100,
    }
}

/** Logs an action to the audit log */
export async function audit(params: {
    actorId: string
    action: string
    entityType: string
    entityId: string
    changes?: Record<string, unknown>
}) {
    return prisma.auditLog.create({
        data: {
            actorId: params.actorId,
            action: params.action,
            entityType: params.entityType,
            entityId: params.entityId,
            changesJson: params.changes ? JSON.stringify(params.changes) : null,
        },
    })
}
