// app/dashboard/settings/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TenantSettings {
    name: string
    slug: string
    email: string
    phone: string | null
    address: string | null
    logo_url: string | null
}

interface UserSummary {
    id: string
    name: string
    email: string
    role: 'owner' | 'admin' | 'staff'
}

const roleLabels: Record<UserSummary['role'], string> = {
    owner: 'Owner',
    admin: 'Admin',
    staff: 'Mitarbeiter',
}

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [tenant, setTenant] = useState<TenantSettings | null>(null)
    const [users, setUsers] = useState<UserSummary[]>([])
    const [roleError, setRoleError] = useState<string | null>(null)
    const [roleSavingId, setRoleSavingId] = useState<string | null>(null)

    useEffect(() => {
        async function loadData() {
            try {
                const [tenantRes, usersRes] = await Promise.all([
                    fetch('/api/settings/tenant'),
                    fetch('/api/settings/users'),
                ])

                const tenantResult = await tenantRes.json()
                const usersResult = await usersRes.json()

                if (tenantResult.tenant) {
                    setTenant(tenantResult.tenant)
                }
                if (usersResult.users) {
                    setUsers(usersResult.users)
                }
            } catch (err) {
                console.error('Failed to load settings:', err)
            } finally {
                setIsFetching(false)
            }
        }

        loadData()
    }, [])

    const handleTenantChange = (key: keyof TenantSettings, value: string) => {
        if (!tenant) return
        setTenant({ ...tenant, [key]: value })
    }

    const handleSaveTenant = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!tenant) return

        setIsLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const response = await fetch('/api/settings/tenant', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tenant),
            })

            const result = await response.json()
            if (!response.ok) {
                setError(result.error || 'Fehler beim Speichern')
                return
            }

            if (result.tenant) {
                setTenant(result.tenant)
            }
            setSuccess('Gespeichert')
        } catch {
            setError('Ein Fehler ist aufgetreten')
        } finally {
            setIsLoading(false)
        }
    }

    const handleRoleChange = async (id: string, role: UserSummary['role']) => {
        setRoleSavingId(id)
        setRoleError(null)

        try {
            const response = await fetch('/api/settings/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, role }),
            })

            const result = await response.json()
            if (!response.ok) {
                setRoleError(result.error || 'Fehler beim Speichern')
                return
            }

            if (result.user) {
                setUsers(prev => prev.map(user => (user.id === id ? result.user : user)))
            }
        } catch {
            setRoleError('Ein Fehler ist aufgetreten')
        } finally {
            setRoleSavingId(null)
        }
    }

    if (isFetching) {
        return <div className="p-8">Laden...</div>
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>
                <p className="text-gray-500 mt-1">Salonprofil und Benutzerrollen</p>
            </div>

            <div className="grid gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Salonprofil</h2>
                    <form onSubmit={handleSaveTenant} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md">
                                {success}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tenant-name">Name</Label>
                                <Input
                                    id="tenant-name"
                                    value={tenant?.name || ''}
                                    onChange={(e) => handleTenantChange('name', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tenant-slug">Slug</Label>
                                <Input
                                    id="tenant-slug"
                                    value={tenant?.slug || ''}
                                    onChange={(e) => handleTenantChange('slug', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tenant-email">Email</Label>
                                <Input
                                    id="tenant-email"
                                    type="email"
                                    value={tenant?.email || ''}
                                    onChange={(e) => handleTenantChange('email', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tenant-phone">Telefon</Label>
                                <Input
                                    id="tenant-phone"
                                    value={tenant?.phone || ''}
                                    onChange={(e) => handleTenantChange('phone', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="tenant-address">Adresse</Label>
                                <Input
                                    id="tenant-address"
                                    value={tenant?.address || ''}
                                    onChange={(e) => handleTenantChange('address', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="tenant-logo">Logo URL</Label>
                                <Input
                                    id="tenant-logo"
                                    value={tenant?.logo_url || ''}
                                    onChange={(e) => handleTenantChange('logo_url', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Wird gespeichert...' : 'Speichern'}
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Benutzerrollen</h2>
                    {roleError && (
                        <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {roleError}
                        </div>
                    )}
                    <div className="space-y-3">
                        {users.map((user) => (
                            <div key={user.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border rounded-md px-3 py-2">
                                <div>
                                    <p className="font-medium text-gray-900">{user.name}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        className="h-9 rounded-md border border-input bg-background px-2 py-2 text-sm"
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserSummary['role'])}
                                        disabled={roleSavingId === user.id || user.role === 'owner'}
                                    >
                                        {Object.entries(roleLabels).map(([value, label]) => (
                                            <option key={value} value={value}>{label}</option>
                                        ))}
                                    </select>
                                    {user.role === 'owner' && (
                                        <span className="text-xs text-gray-500">Unveranderlich</span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {users.length === 0 && (
                            <p className="text-sm text-gray-500">Keine Benutzer gefunden</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
