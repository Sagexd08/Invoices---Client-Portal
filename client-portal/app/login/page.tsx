import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LoginForm from './LoginForm'

export const metadata: Metadata = { title: 'Sign In · ClientPortal' }

export default async function LoginPage() {
    const session = await getServerSession(authOptions)
    if (session?.user) redirect('/dashboard')
    return <LoginForm />
}
