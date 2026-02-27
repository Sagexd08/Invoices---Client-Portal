import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/Sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const session = await getServerSession(authOptions)
    if (!session?.user) redirect('/login')

    const dbUser = session.user.dbUserId
        ? await prisma.user.findUnique({
            where: { id: session.user.dbUserId },
            select: { id: true, name: true, email: true, role: true, clientId: true },
        })
        : null

    const userForSidebar = {
        id: session.user.dbUserId ?? '',
        name: dbUser?.name ?? session.user.name ?? '',
        email: session.user.email ?? '',
        role: session.user.role,
        clientId: session.user.clientId,
    }

    return (
        <div className="app-shell">
            <Sidebar user={userForSidebar} />
            <main className="main-content">{children}</main>
        </div>
    )
}
