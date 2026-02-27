import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Session } from 'next-auth'

export type AuthUser = Session['user'] & { dbUserId: string }

/** Returns the session user, or null if not authenticated */
export async function getAuthUser(): Promise<AuthUser | null> {
    const session = await getServerSession(authOptions)
    if (!session?.user?.dbUserId) return null
    return session.user as AuthUser
}

/** Throws a 401 JSON response if not authenticated */
export async function requireAuth() {
    const user = await getAuthUser()
    if (!user) {
        return { user: null, error: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
    }
    return { user, error: null }
}

export function isCompanyRole(role: string) {
    return ['company_admin', 'project_manager', 'accountant'].includes(role)
}
