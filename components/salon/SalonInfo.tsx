import { MapPin, Phone, Mail, Globe, Clock } from 'lucide-react'

interface WorkingHour {
    day: number
    day_name: string
    is_open: boolean
    open?: string
    close?: string
}

interface SalonInfoProps {
    address?: string | null
    phone?: string | null
    email?: string | null
    website?: string | null
    working_hours: WorkingHour[]
}

export default function SalonInfo({ address, phone, email, website, working_hours }: SalonInfoProps) {
    const hasContact = address || phone || email || website

    if (!hasContact && working_hours.length === 0) return null

    return (
        <section className="space-y-8">
            {/* Address */}
            {address && (
                <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Adresse</h3>
                        <p className="text-gray-600">{address}</p>
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
                        >
                            Auf Google Maps anzeigen
                        </a>
                    </div>
                </div>
            )}

            {/* Contact */}
            {(phone || email || website) && (
                <div className="flex gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        <h3 className="font-semibold text-gray-900 mb-1">Kontakt</h3>
                        {phone && (
                            <p>
                                <a href={`tel:${phone}`} className="text-gray-600 hover:text-blue-600">
                                    {phone}
                                </a>
                            </p>
                        )}
                        {email && (
                            <p className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <a href={`mailto:${email}`} className="text-gray-600 hover:text-blue-600">
                                    {email}
                                </a>
                            </p>
                        )}
                        {website && (
                            <p className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-gray-400" />
                                <a
                                    href={website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 hover:text-blue-600"
                                >
                                    {website.replace(/^https?:\/\//, '')}
                                </a>
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Working Hours */}
            {working_hours.length > 0 && (
                <div className="flex gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Öffnungszeiten</h3>
                        <div className="space-y-1">
                            {working_hours.map((wh) => (
                                <div key={wh.day} className="flex justify-between gap-8 text-sm">
                                    <span className="text-gray-600 w-28">{wh.day_name}</span>
                                    <span className={wh.is_open ? 'text-gray-900' : 'text-gray-400'}>
                                        {wh.is_open ? `${wh.open} – ${wh.close}` : 'Geschlossen'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}
