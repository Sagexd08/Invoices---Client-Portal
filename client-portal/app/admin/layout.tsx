import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions)
    if (!session?.user) redirect('/login')
    if (!session.user.email?.endsWith('@oxifylabs.app')) redirect('/unauthorized')

    return (
        <div className="app-shell">
            <AdminSidebar userEmail={session.user.email!} />
            <main className="main-content">{children}</main>
        </div>
    )
}
