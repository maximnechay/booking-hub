// app/(auth)/register/page.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

// Генерация slug из названия
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[äÄ]/g, 'ae')
        .replace(/[öÖ]/g, 'oe')
        .replace(/[üÜ]/g, 'ue')
        .replace(/[ß]/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}

export default function RegisterPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        salonName: '',
        salonSlug: '',
        name: '',
        email: '',
        password: '',
        phone: '',
    })

    // Автогенерация slug при вводе названия
    const handleSalonNameChange = (value: string) => {
        setFormData({
            ...formData,
            salonName: value,
            salonSlug: generateSlug(value),
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        // Валидация
        if (!formData.salonName || !formData.name || !formData.email || !formData.password) {
            setError('Bitte füllen Sie alle Pflichtfelder aus')
            setIsLoading(false)
            return
        }

        if (formData.password.length < 6) {
            setError('Passwort muss mindestens 6 Zeichen haben')
            setIsLoading(false)
            return
        }

        if (formData.salonSlug.length < 3) {
            setError('Salon-URL muss mindestens 3 Zeichen haben')
            setIsLoading(false)
            return
        }

        try {
            const supabase = createClient()

            // 1. Создаём пользователя в Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        name: formData.name,
                    },
                },
            })

            if (authError) {
                if (authError.message.includes('already registered')) {
                    setError('Diese E-Mail ist bereits registriert')
                } else {
                    setError(authError.message)
                }
                return
            }

            if (!authData.user) {
                setError('Fehler bei der Registrierung')
                return
            }

            // 2. Создаём tenant и user через API
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: authData.user.id,
                    salon_name: formData.salonName,
                    salon_slug: formData.salonSlug,
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone || null,
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                setError(result.error || 'Fehler beim Erstellen des Salons')
                return
            }

            // 3. Успех — редирект в dashboard
            router.push('/dashboard')
            router.refresh()
        } catch {
            setError('Ein Fehler ist aufgetreten')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Salon registrieren</CardTitle>
                    <CardDescription>
                        Erstellen Sie Ihr BookingHub-Konto und richten Sie Ihren Salon ein
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                {error}
                            </div>
                        )}

                        {/* Salon */}
                        <div className="space-y-2">
                            <Label htmlFor="salonName">Salonname *</Label>
                            <Input
                                id="salonName"
                                placeholder="Salon Schönheit"
                                value={formData.salonName}
                                onChange={(e) => handleSalonNameChange(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="salonSlug">Salon-URL *</Label>
                            <div className="flex items-center">
                                <span className="text-sm text-gray-500 mr-1">bookinghub.de/</span>
                                <Input
                                    id="salonSlug"
                                    placeholder="salon-schoenheit"
                                    value={formData.salonSlug}
                                    onChange={(e) => setFormData({ ...formData, salonSlug: e.target.value })}
                                    disabled={isLoading}
                                    className="flex-1"
                                    required
                                />
                            </div>
                        </div>

                        <hr className="my-2" />

                        {/* User */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Ihr Name *</Label>
                            <Input
                                id="name"
                                placeholder="Max Mustermann"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">E-Mail *</Label>
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
                            <Label htmlFor="password">Passwort *</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Mindestens 6 Zeichen"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefon (optional)</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+49 123 456 7890"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                disabled={isLoading}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Wird erstellt...' : 'Salon erstellen'}
                        </Button>
                        <p className="text-sm text-center text-gray-600">
                            Bereits registriert?{' '}
                            <Link href="/login" className="text-blue-600 hover:underline">
                                Anmelden
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}