// app/dashboard/staff/page.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function StaffPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

    if (!userData?.tenant_id) redirect('/login')

    const { data: staff } = await supabase
        .from('staff')
        .select(`
      *,
      services:staff_services(
        service:services(id, name)
      )
    `)
        .eq('tenant_id', userData.tenant_id)
        .order('sort_order', { ascending: true })

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Mitarbeiter</h1>
                <Link href="/dashboard/staff/new">
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Neuer Mitarbeiter
                    </Button>
                </Link>
            </div>

            {staff && staff.length > 0 ? (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontakt</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Services</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {staff.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-sm font-medium text-gray-600">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="font-medium text-gray-900">{member.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {member.email && <p>{member.email}</p>}
                                        {member.phone && <p>{member.phone}</p>}
                                        {!member.email && !member.phone && <p className="text-gray-400">—</p>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {member.services && member.services.length > 0 ? (
                                                member.services.slice(0, 3).map((s: { service: { id: string; name: string } }) => (
                                                    <span
                                                        key={s.service.id}
                                                        className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                                                    >
                                                        {s.service.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-400">Keine</span>
                                            )}
                                            {member.services && member.services.length > 3 && (
                                                <span className="text-xs text-gray-500">
                                                    +{member.services.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${member.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {member.is_active ? 'Aktiv' : 'Inaktiv'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link href={`/dashboard/staff/${member.id}/schedule`}>
                                                <Button variant="ghost" size="sm" title="Arbeitszeiten">
                                                    <Clock className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/dashboard/staff/${member.id}/edit`}>
                                                <Button variant="ghost" size="sm">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <p className="text-gray-500 mb-4">Noch keine Mitarbeiter vorhanden</p>
                    <Link href="/dashboard/staff/new">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Ersten Mitarbeiter hinzufügen
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    )
}