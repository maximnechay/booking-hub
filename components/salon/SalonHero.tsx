import Image from 'next/image'

interface SalonHeroProps {
    name: string
    description?: string | null
    logo_url?: string | null
    cover_image_url?: string | null
}

export default function SalonHero({ name, description, logo_url, cover_image_url }: SalonHeroProps) {
    const initial = name.charAt(0).toUpperCase()

    return (
        <section className="relative w-full h-56 sm:h-72 md:h-80">
            {/* Cover */}
            {cover_image_url ? (
                <Image
                    src={cover_image_url}
                    alt={`${name} Cover`}
                    fill
                    className="object-cover"
                    priority
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400" />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30" />

            {/* Content */}
            <div className="relative h-full max-w-4xl mx-auto px-4 flex items-end pb-8">
                <div className="flex items-center gap-4">
                    {/* Logo */}
                    {logo_url ? (
                        <Image
                            src={logo_url}
                            alt={`${name} Logo`}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center text-2xl font-bold text-blue-600 border-2 border-white shadow-lg">
                            {initial}
                        </div>
                    )}

                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md">
                            {name}
                        </h1>
                        {description && (
                            <p className="text-white/90 text-sm sm:text-base mt-1 drop-shadow-sm">
                                {description}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}
