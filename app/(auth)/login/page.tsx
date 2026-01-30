// app/(auth)/login/page.tsx

'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirect = searchParams.get('redirect') || '/dashboard'

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        if (!formData.email || !formData.password) {
            setError('Bitte füllen Sie alle Felder aus')
            setIsLoading(false)
            return
        }

        try {
            const supabase = createClient()
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            })

            if (authError) {
                if (authError.message.includes('Invalid login')) {
                    setError('E-Mail oder Passwort ist falsch')
                } else {
                    setError(authError.message)
                }
                return
            }

            router.push(redirect)
            router.refresh()
        } catch {
            setError('Ein Fehler ist aufgetreten')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Anmelden</CardTitle>
                <CardDescription>
                    Melden Sie sich bei Ihrem BookingHub-Konto an
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">E-Mail</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="ihre@email.de"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Passwort</Label>
                        <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            disabled={isLoading}
                            required
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pt-6">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Anmelden...' : 'Anmelden'}
                    </Button>
                    <p className="text-sm text-center text-gray-600">
                        Noch kein Konto?{' '}
                        <Link href="/register" className="text-blue-600 hover:underline">
                            Jetzt registrieren
                        </Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    )
}

function LoginFormFallback() {
    return (
        <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Anmelden</CardTitle>
                <CardDescription>
                    Melden Sie sich bei Ihrem BookingHub-Konto an
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>E-Mail</Label>
                    <Input disabled placeholder="ihre@email.de" />
                </div>
                <div className="space-y-2">
                    <Label>Passwort</Label>
                    <Input disabled type="password" />
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full" disabled>Anmelden</Button>
            </CardFooter>
        </Card>
    )
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Suspense fallback={<LoginFormFallback />}>
                <LoginForm />
            </Suspense>
        </div>
    )
}