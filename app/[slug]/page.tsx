import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateLocalBusinessSchema, generateServiceSchemas } from '@/lib/seo/json-ld'
import SalonHero from '@/components/salon/SalonHero'
import SalonInfo from '@/components/salon/SalonInfo'
import SalonServices from '@/components/salon/SalonServices'
import SalonTeam from '@/components/salon/SalonTeam'
import SalonCTA from '@/components/salon/SalonCTA'
import LegalFooter from '@/components/legal/LegalFooter'

const RESERVED_SLUGS = [
    'book', 'cancel', 'dashboard', 'login', 'register',
    'api', 'impressum', 'datenschutz', 'pricing', 'kontakt',
]

const DAY_NAMES = [
    'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag',
    'Freitag', 'Samstag', 'Sonntag',
]
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v', '.ogg']

const isVideoUrl = (url: string): boolean => {
    const cleanUrl = url.split('?')[0].split('#')[0].toLowerCase()
    return VIDEO_EXTENSIONS.some(ext => cleanUrl.endsWith(ext))
}

interface PageProps {
    params: Promise<{ slug: string }>
}

async function getSalonData(slug: string) {
    if (RESERVED_SLUGS.includes(slug)) return null

    const { data: tenant } = await supabaseAdmin
        .from('tenants')
        .select('id, name, slug, description, address, phone, email, website, logo_url, cover_image_url')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

    if (!tenant) return null

    const [
        { data: workingHoursRaw },
        { data: categoriesRaw },
        { data: servicesRaw },
        { data: staffRaw },
    ] = await Promise.all([
        supabaseAdmin
            .from('working_hours')
            .select('day_of_week, open_time, close_time, is_open')
            .eq('tenant_id', tenant.id)
            .order('day_of_week', { ascending: true }),
        supabaseAdmin
            .from('service_categories')
            .select('id, name')
            .eq('tenant_id', tenant.id)
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
        supabaseAdmin
            .from('services')
            .select('id, name, description, duration, price, category_id')
            .eq('tenant_id', tenant.id)
            .eq('is_active', true)
            .eq('online_booking_enabled', true)
            .order('sort_order', { ascending: true }),
        supabaseAdmin
            .from('staff')
            .select('id, name, avatar_url, bio, title')
            .eq('tenant_id', tenant.id)
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
    ])

    const working_hours = (workingHoursRaw || []).map(wh => ({
        day: wh.day_of_week,
        day_name: DAY_NAMES[wh.day_of_week] || `Tag ${wh.day_of_week}`,
        is_open: wh.is_open ?? false,
        ...(wh.is_open ? { open: wh.open_time, close: wh.close_time } : {}),
    }))

    const services = servicesRaw || []

    const categories = (categoriesRaw || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        services: services
            .filter(s => s.category_id === cat.id)
            .map(({ category_id, ...s }) => s),
    })).filter(cat => cat.services.length > 0)

    const uncategorized_services = services
        .filter(s => !s.category_id)
        .map(({ category_id, ...s }) => s)

    const staff = (staffRaw || []).map(s => ({
        id: s.id,
        name: s.name,
        avatar_url: s.avatar_url,
        bio: s.bio,
        title: s.title,
    }))

    const { id, ...tenantPublic } = tenant

    return {
        tenant: tenantPublic,
        working_hours,
        categories,
        uncategorized_services,
        staff,
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const data = await getSalonData(slug)

    if (!data) {
        return { title: 'Salon nicht gefunden' }
    }

    const ogImages =
        data.tenant.cover_image_url && !isVideoUrl(data.tenant.cover_image_url)
            ? [data.tenant.cover_image_url]
            : []

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bookinghub.de'

    return {
        title: `${data.tenant.name} | Online Termin buchen`,
        description: data.tenant.description ||
            `Buchen Sie Ihren Termin bei ${data.tenant.name} online. Schnell, einfach und ohne Wartezeit.`,
        alternates: {
            canonical: `${baseUrl}/${slug}`,
        },
        openGraph: {
            title: data.tenant.name,
            description: data.tenant.description || undefined,
            url: `${baseUrl}/${slug}`,
            locale: 'de_DE',
            type: 'website',
            images: ogImages,
        },
    }
}

export default async function SalonPage({ params }: PageProps) {
    const { slug } = await params
    const data = await getSalonData(slug)

    if (!data) {
        notFound()
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bookinghub.de'

    const allServices = [
        ...data.categories.flatMap((c) => c.services),
        ...data.uncategorized_services,
    ]

    const localBusinessSchema = generateLocalBusinessSchema(
        data.tenant,
        data.working_hours,
        baseUrl,
    )

    const serviceSchemas = generateServiceSchemas(allServices, data.tenant.name)

    return (
        <main className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
            <SalonHero
                name={data.tenant.name}
                description={data.tenant.description}
                logo_url={data.tenant.logo_url}
                cover_image_url={data.tenant.cover_image_url}
            />

            <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
                <SalonInfo
                    address={data.tenant.address}
                    phone={data.tenant.phone}
                    email={data.tenant.email}
                    website={data.tenant.website}
                    working_hours={data.working_hours}
                />

                <SalonServices
                    categories={data.categories}
                    uncategorized={data.uncategorized_services}
                />

                {data.staff.length > 0 && (
                    <SalonTeam staff={data.staff} />
                )}

                <SalonCTA slug={slug} />
            </div>

            <LegalFooter />

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(localBusinessSchema),
                }}
            />
            {serviceSchemas.length > 0 && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(serviceSchemas),
                    }}
                />
            )}
        </main>
    )
}
