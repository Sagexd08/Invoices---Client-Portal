import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'

const ADMIN_DOMAIN = 'oxifylabs.app'

export const authOptions: NextAuthOptions = {
    session: { strategy: 'jwt' },
    secret: process.env.NEXTAUTH_SECRET,

    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    hd: ADMIN_DOMAIN,          // Google Workspace domain hint
                    prompt: 'select_account',
                },
            },
        }),

        // ── Client: Client ID only ────────────────────────────────────
        CredentialsProvider({
            id: 'client-id',
            name: 'Client ID',
            credentials: { clientId: { label: 'Client ID', type: 'text' } },
            async authorize(credentials) {
                const rawId = credentials?.clientId?.trim().toUpperCase()
                if (!rawId) return null

                const client = await prisma.client.findUnique({
                    where: { clientId: rawId },
                    include: {
                        users: {
                            where: { role: 'client_admin' },
                            take: 1,
                        },
                    },
                })

                if (!client || client.status === 'suspended') return null

                // If no client_admin user exists yet, create one
                let dbUser = client.users[0]
                if (!dbUser) {
                    dbUser = await prisma.user.create({
                        data: {
                            authId: `client-${client.id}`,  // used as unique internal ID
                            email: `${client.clientId.toLowerCase().replace(/-/g, '')}@portal.internal`,
                            role: 'client_admin',
                            clientId: client.id,
                        },
                    })
                }

                return {
                    id: dbUser.id,
                    name: client.name,
                    email: dbUser.email,
                    role: dbUser.role,
                    clientId: client.id,
                    clientPublicId: client.clientId,
                }
            },
        }),
    ],

    callbacks: {
        // ── Block non-@oxifylabs.app Google sign-ins ──────────────────
        async signIn({ user, account }) {
            if (account?.provider === 'google') {
                const email = user.email ?? ''
                if (!email.endsWith(`@${ADMIN_DOMAIN}`)) return false

                // Ensure an admin User record exists in our DB
                await prisma.user.upsert({
                    where: { email },
                    create: {
                        authId: `google-${user.id}`,
                        email,
                        name: user.name ?? null,
                        role: 'company_admin',
                        clientId: null,
                    },
                    update: { name: user.name ?? undefined },
                })
            }
            return true
        },

        // ── Encode role + clientId into JWT ───────────────────────────
        async jwt({ token, user, account }) {
            if (user) {
                if (account?.provider === 'google') {
                    const dbUser = await prisma.user.findUnique({
                        where: { email: token.email! },
                    })
                    token.role = dbUser?.role ?? 'company_admin'
                    token.clientId = null
                    token.dbUserId = dbUser?.id ?? null
                } else {
                    // Credentials provider
                    const u = user as any
                    token.role = u.role
                    token.clientId = u.clientId ?? null
                    token.dbUserId = u.id
                    token.clientPublicId = u.clientPublicId ?? null
                }
            }
            return token
        },

        // ── Expose role + clientId on session object ──────────────────
        async session({ session, token }) {
            session.user.role = token.role as string
            session.user.clientId = token.clientId as string | null
            session.user.dbUserId = token.dbUserId as string | null
            session.user.clientPublicId = token.clientPublicId as string | null
            return session
        },
    },

    pages: {
        signIn: '/login',
        error: '/login',
    },
}
