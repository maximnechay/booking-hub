// app/dashboard/layout.tsx

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
    LayoutDashboard,
    Calendar,
    Scissors,
    Users,
    Clock,
    CalendarOff,
    Code,
    Settings,
    FolderTree,
} from 'lucide-react'
import { LogoutButton } from '@/components/logout-button'

const navigation = [
    { name: 'Übersicht', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Termine', href: '/dashboard/bookings', icon: Calendar },
    { name: 'Kategorien', href: '/dashboard/categories', icon: FolderTree },
    { name: 'Dienstleistungen', href: '/dashboard/services', icon: Scissors },
    { name: 'Mitarbeiter', href: '/dashboard/staff', icon: Users },
    { name: 'Öffnungszeiten', href: '/dashboard/oeffnungszeiten', icon: Clock },
    { name: 'Schließtage', href: '/dashboard/schedule', icon: CalendarOff },
    { name: 'Integration', href: '/dashboard/integration', icon: Code },
    { name: 'Einstellungen', href: '/dashboard/settings', icon: Settings },
]

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: userData } = await supabase
        .from('users')
        .select('*, tenant:tenants(*)')
        .eq('id', user.id)
        .single()

    if (!userData) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="hidden md:block fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
                {/* Logo */}
                <div className="h-16 flex items-center px-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <span className="text-white font-bold">
                                {userData.tenant?.name?.charAt(0) || 'B'}
                            </span>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-sm truncate max-w-[160px]">
                                {userData.tenant?.name}
                            </p>
                            <p className="text-xs text-gray-500">/{userData.tenant?.slug}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
                        >
                            <item.icon className="h-5 w-5 text-gray-400" />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* User */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                                {userData.name?.charAt(0) || 'U'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {userData.name}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">{userData.role}</p>
                        </div>
                    </div>
                    <LogoutButton />
                </div>
            </aside>

            {/* Main content */}
            <main className="md:pl-64">
                <div className="md:hidden bg-white border-b border-gray-200">
                    <div className="h-14 flex items-center px-4">
                        <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                                {userData.tenant?.name?.charAt(0) || 'B'}
                            </span>
                        </div>
                        <div className="ml-3">
                            <p className="font-semibold text-gray-900 text-sm truncate max-w-[200px]">
                                {userData.tenant?.name}
                            </p>
                            <p className="text-xs text-gray-500">/{userData.tenant?.slug}</p>
                        </div>
                    </div>
                    <nav className="flex items-center gap-2 px-4 pb-3 overflow-x-auto">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="flex items-center gap-2 whitespace-nowrap px-3 py-1.5 text-sm font-medium text-gray-700 rounded-md bg-gray-100 hover:bg-gray-200"
                            >
                                <item.icon className="h-4 w-4 text-gray-500" />
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
