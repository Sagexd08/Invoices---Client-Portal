import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'ClientPortal', template: '%s · ClientPortal' },
  description: 'Secure client portal for invoicing, payments, and collaboration.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: 'var(--bg-2)',
            color: 'var(--text)',
            border: '1px solid var(--border-2)',
            borderRadius: 'var(--radius)'
          },
          success: { iconTheme: { primary: 'var(--green)', secondary: 'var(--bg-2)' } },
          error: { iconTheme: { primary: 'var(--red)', secondary: 'var(--bg-2)' } }
        }} />
        {children}
      </body>
    </html>
  )
}
