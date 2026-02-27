'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

type User = { id: string; name: string | null; email: string; role: string; clientId: string | null }

const COMPANY_NAV = [
    { href: '/dashboard', label: 'Dashboard', icon: '⊞', exact: true },
    { href: '/dashboard/invoices', label: 'Invoices', icon: '◈' },
    { href: '/dashboard/requests', label: 'Requests', icon: '◎' },
    { href: '/dashboard/messages', label: 'Messages', icon: '◷' },
]

const CLIENT_NAV = [
    { href: '/dashboard', label: 'Overview', icon: '⊞', exact: true },
    { href: '/dashboard/invoices', label: 'Invoices', icon: '◈' },
    { href: '/dashboard/requests', label: 'Requests', icon: '◎' },
    { href: '/dashboard/messages', label: 'Messages', icon: '◷' },
]

export default function Sidebar({ user }: { user: User }) {
    const pathname = usePathname()
    const isCompany = !user.clientId
    const nav = isCompany ? COMPANY_NAV : CLIENT_NAV
    const initials = (user.name ?? user.email).slice(0, 2).toUpperCase()

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <span>Client<em>Portal</em></span>
            </div>

            <div className="sidebar-section" style={{ flex: 1 }}>
                <div className="sidebar-label">Navigation</div>
                {nav.map(item => {
                    const active = (item as any).exact ? pathname === item.href : pathname.startsWith(item.href)
                    return (
                        <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`}>
                            <span className="icon">{item.icon}</span>
                            {item.label}
                        </Link>
                    )
                })}
                {isCompany && (
                    <Link href="/admin" className="nav-item" style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                        <span className="icon">◑</span>Admin Panel
                    </Link>
                )}
            </div>

            <div className="sidebar-footer">
                <div className="user-chip" onClick={() => signOut({ callbackUrl: '/login' })} title="Sign out — click to log out">
                    <div className="avatar">{initials}</div>
                    <div className="user-chip-info">
                        <div className="user-chip-name truncate">{user.name ?? user.email}</div>
                        <div className="user-chip-role">{user.role.replace(/_/g, ' ')}</div>
                    </div>
                </div>
            </div>
        </aside>
    )
}
