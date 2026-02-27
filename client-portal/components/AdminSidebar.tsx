'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

const ADMIN_NAV = [
    { href: '/admin', label: 'Dashboard', icon: '⊞', exact: true },
    { href: '/admin/clients', label: 'Clients', icon: '◉' },
    { href: '/admin/invoices', label: 'Invoices', icon: '◈' },
    { href: '/admin/services', label: 'Services', icon: '◆' },
    { href: '/admin/requests', label: 'Requests', icon: '◎' },
    { href: '/admin/audit', label: 'Audit Log', icon: '◑' },
]

export default function AdminSidebar({ userEmail }: { userEmail: string }) {
    const pathname = usePathname()
    const initials = userEmail.slice(0, 2).toUpperCase()

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <span>Client<em>Portal</em></span>
                <div style={{ fontSize: '0.6875rem', color: 'var(--red)', fontWeight: 700, letterSpacing: '0.05em', marginTop: 2 }}>
                    ADMIN
                </div>
            </div>

            <div className="sidebar-section" style={{ flex: 1 }}>
                <div className="sidebar-label">Administration</div>
                {ADMIN_NAV.map(item => {
                    const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
                    return (
                        <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`}>
                            <span className="icon">{item.icon}</span>
                            {item.label}
                        </Link>
                    )
                })}
            </div>

            <div className="sidebar-footer">
                <div className="user-chip" onClick={() => signOut({ callbackUrl: '/login' })} title="Sign out">
                    <div className="avatar">{initials}</div>
                    <div className="user-chip-info">
                        <div className="user-chip-name truncate">{userEmail}</div>
                        <div className="user-chip-role">Company Admin</div>
                    </div>
                </div>
            </div>
        </aside>
    )
}
