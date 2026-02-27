import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isCompanyRole } from '@/lib/auth-helpers'
import Link from 'next/link'
import { FileText, Plus, ArrowRight, Wallet, Receipt, SearchX, CheckCircle2, Clock, Ban, AlertCircle, HelpCircle, ArchiveRestore } from 'lucide-react'

export const metadata: Metadata = { title: 'Invoices' }

function fmtCurrency(n: number, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

const STATUSES = ['pending', 'paid', 'overdue', 'draft', 'cancelled', 'refunded']

function getStatusIcon(status: string) {
    switch (status) {
        case 'paid': return <CheckCircle2 className="w-3.5 h-3.5 mr-1" />;
        case 'pending': return <Clock className="w-3.5 h-3.5 mr-1" />;
        case 'overdue': return <AlertCircle className="w-3.5 h-3.5 mr-1" />;
        case 'cancelled': return <Ban className="w-3.5 h-3.5 mr-1" />;
        case 'refunded': return <ArchiveRestore className="w-3.5 h-3.5 mr-1" />;
        case 'draft': return <FileText className="w-3.5 h-3.5 mr-1" />;
        default: return <HelpCircle className="w-3.5 h-3.5 mr-1" />;
    }
}

export default async function InvoicesPage({ searchParams }: { searchParams: { status?: string } }) {
    const session = await getServerSession(authOptions)
    if (!session?.user) return null
    const user = session.user

    const where = {
        ...(isCompanyRole(user.role) ? {} : { clientId: user.clientId! }),
        ...(searchParams.status ? { status: searchParams.status } : {}),
    }

    const invoices = await prisma.invoice.findMany({
        where,
        include: { client: { select: { name: true, clientId: true } } },
        orderBy: { createdAt: 'desc' },
    })

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between pb-5 border-b border-border">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-semibold text-text flex items-center gap-2">
                        <Receipt className="w-6 h-6 text-primary" />
                        Invoices
                    </h1>
                    <p className="text-sm text-text-3">
                        {invoices.length} total invoice{invoices.length !== 1 ? 's' : ''} found
                    </p>
                </div>
                {isCompanyRole(user.role) && (
                    <Link href="/dashboard/invoices/new" className="btn btn-primary shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                        <Plus className="w-4 h-4" /> New Invoice
                    </Link>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2 py-2">
                <Link href="/dashboard/invoices" className={`transition-all px-4 py-1.5 rounded-full text-sm font-medium border ${!searchParams.status ? 'bg-primary text-primary-fg border-primary shadow-sm' : 'bg-transparent text-text-2 border-border hover:bg-bg-2'}`}>
                    All
                </Link>
                {STATUSES.map(s => (
                    <Link key={s} href={`/dashboard/invoices?status=${s}`}
                        className={`transition-all px-4 py-1.5 rounded-full text-sm font-medium border capitalize ${searchParams.status === s ? 'bg-primary text-primary-fg border-primary shadow-sm' : 'bg-transparent text-text-2 border-border hover:bg-bg-2'}`}>
                        {s}
                    </Link>
                ))}
            </div>

            <div className="bg-bg w-full rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-bg-2/50 border-b border-border text-xs uppercase tracking-wider text-text-3 font-semibold">
                                <th className="px-6 py-4">Invoice No.</th>
                                {isCompanyRole(user.role) && <th className="px-6 py-4">Client</th>}
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 hidden md:table-cell">Issued</th>
                                <th className="px-6 py-4 hidden md:table-cell">Due</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {invoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-bg-2/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <span className="font-mono text-sm font-medium text-text">{inv.invoiceNumber}</span>
                                        </div>
                                    </td>
                                    {isCompanyRole(user.role) && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-2">
                                            {inv.client.name}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-text">
                                        {fmtCurrency(inv.totalAmount, inv.currency)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border badge-${inv.status} capitalize`}>
                                            {getStatusIcon(inv.status)}
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-3 hidden md:table-cell">
                                        {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-3 hidden md:table-cell">
                                        {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/dashboard/invoices/${inv.id}`} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-bg-2 hover:bg-bg-3 text-text rounded-md border border-border transition-colors">
                                            View <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {!invoices.length && (
                                <tr>
                                    <td colSpan={isCompanyRole(user.role) ? 7 : 6} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-bg-2 flex items-center justify-center text-text-3">
                                                <SearchX className="w-8 h-8" />
                                            </div>
                                            <h3 className="text-lg font-medium text-text mt-2">No invoices found</h3>
                                            <p className="text-sm text-text-3 max-w-sm mx-auto">
                                                {searchParams.status ? `There are no invoices currently marked as "${searchParams.status}".` : "You haven't issued any invoices yet. Create your first invoice to get started."}
                                            </p>
                                            {isCompanyRole(user.role) && !searchParams.status && (
                                                <Link href="/dashboard/invoices/new" className="btn btn-primary mt-4 flex items-center gap-2">
                                                    <Plus className="w-4 h-4" /> Create Invoice
                                                </Link>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
