import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/admin'

    if (code) {
        const supabase = createClient()
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data.user) {
            const email = data.user.email ?? ''

            if (!email.endsWith('@oxifylabs.app')) {
                await supabase.auth.signOut()
                return NextResponse.redirect(new URL('/unauthorized', origin))
            }

            return NextResponse.redirect(new URL(next, origin))
        }
    }

    return NextResponse.redirect(new URL('/login?error=oauth_failed', origin))
}
