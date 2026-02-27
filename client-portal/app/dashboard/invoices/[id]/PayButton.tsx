'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Loader2, CreditCard } from 'lucide-react'

declare global {
    interface Window { Razorpay: any }
}

type Props = {
    invoiceId: string
    amount: number
    currency: string
    invoiceNumber: string
}

export default function PayButton({ invoiceId, amount, currency, invoiceNumber }: Props) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handlePay() {
        setLoading(true)
        const toastId = toast.loading('Initializing secure payment...')
        try {
            // Create Razorpay order
            const res = await fetch(`/api/invoices/${invoiceId}/pay`, { method: 'POST' })
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || 'Failed to initialize payment');
            }
            const { orderId, keyId, clientName } = await res.json()

            // Load Razorpay script if not already loaded
            if (!window.Razorpay) {
                toast.loading('Loading payment gateway...', { id: toastId })
                await new Promise<void>((resolve, reject) => {
                    const s = document.createElement('script')
                    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
                    s.onload = () => resolve()
                    s.onerror = () => reject(new Error('Failed to load Razorpay SDK. Please check your connection.'))
                    document.head.appendChild(s)
                })
            }

            toast.dismiss(toastId)

            const rzp = new window.Razorpay({
                key: keyId,
                amount: Math.round(amount * 100),
                currency,
                name: 'Oxify Labs',
                description: `Payment for Invoice ${invoiceNumber}`,
                image: 'https://cdn.oxifylabs.app/logo-square.png', // Fallback or company logo
                order_id: orderId,
                handler: () => {
                    // Webhook handles the DB update; redirect to success state
                    toast.success('Payment successful! Processing invoice...')
                    setLoading(true)
                    setTimeout(() => router.refresh(), 2000)
                },
                prefill: { name: clientName },
                theme: { color: '#f59e0b' },
                modal: {
                    ondismiss: () => {
                        setLoading(false)
                        toast('Payment cancelled', { icon: 'ℹ️' })
                    }
                },
            })
            rzp.on('payment.failed', function (response: any) {
                toast.error(`Payment failed: ${response.error.description}`)
                setLoading(false)
            });
            rzp.open()
        } catch (err: any) {
            toast.error(err.message, { id: toastId })
            setLoading(false)
        }
    }

    return (
        <button
            className="btn btn-primary btn-lg flex items-center gap-2 transition-all hover:shadow-lg"
            onClick={handlePay}
            disabled={loading}
            id="pay-invoice-btn"
            style={{ minWidth: '180px', justifyContent: 'center' }}
        >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
            {loading ? 'Processing...' : `Pay ${new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)}`}
        </button>
    )
}
