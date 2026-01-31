import Image from 'next/image'

interface StaffMember {
    id: string
    name: string
    avatar_url?: string | null
    bio?: string | null
    title?: string | null
}

interface SalonTeamProps {
    staff: StaffMember[]
}

const AVATAR_COLORS = [
    'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-violet-500', 'bg-rose-500', 'bg-cyan-500',
]

export default function SalonTeam({ staff }: SalonTeamProps) {
    if (staff.length === 0) return null

    return (
        <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Unser Team</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {staff.map((member, index) => {
                    const initial = member.name.charAt(0).toUpperCase()
                    const colorClass = AVATAR_COLORS[index % AVATAR_COLORS.length]

                    return (
                        <div key={member.id} className="flex flex-col items-center text-center p-4 rounded-lg bg-white border border-gray-100">
                            {member.avatar_url ? (
                                <Image
                                    src={member.avatar_url}
                                    alt={member.name}
                                    width={80}
                                    height={80}
                                    className="w-20 h-20 rounded-full object-cover"
                                />
                            ) : (
                                <div className={`w-20 h-20 rounded-full ${colorClass} flex items-center justify-center text-2xl font-bold text-white`}>
                                    {initial}
                                </div>
                            )}
                            <p className="mt-3 font-medium text-gray-900">{member.name}</p>
                            {member.title && (
                                <p className="text-sm text-gray-500">{member.title}</p>
                            )}
                        </div>
                    )
                })}
            </div>
        </section>
    )
}
