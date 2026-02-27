// Extend next-auth types to include custom fields
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
    interface Session {
        user: {
            name?: string | null
            email?: string | null
            image?: string | null
            role: string
            clientId: string | null
            dbUserId: string | null
            clientPublicId: string | null
        }
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        role: string
        clientId: string | null
        dbUserId: string | null
        clientPublicId: string | null
    }
}
