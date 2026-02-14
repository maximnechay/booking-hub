const DAYS_MAP: Record<string, string> = {
  Montag: 'Mo',
  Dienstag: 'Tu',
  Mittwoch: 'We',
  Donnerstag: 'Th',
  Freitag: 'Fr',
  Samstag: 'Sa',
  Sonntag: 'Su',
}

interface WorkingHour {
  day_name: string
  is_open: boolean
  open?: string
  close?: string
}

interface TenantInfo {
  name: string
  slug: string
  description?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  logo_url?: string | null
}

interface ServiceInfo {
  name: string
  description?: string | null
  price: number
  duration: number
}

export function generateLocalBusinessSchema(
  tenant: TenantInfo,
  workingHours: WorkingHour[],
  baseUrl: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: tenant.name,
    ...(tenant.description && { description: tenant.description }),
    url: tenant.website || `${baseUrl}/${tenant.slug}`,
    ...(tenant.phone && { telephone: tenant.phone }),
    ...(tenant.email && { email: tenant.email }),
    ...(tenant.logo_url && { image: tenant.logo_url }),
    ...(tenant.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: tenant.address,
        addressCountry: 'DE',
      },
    }),
    openingHoursSpecification: workingHours
      .filter((wh) => wh.is_open && wh.open && wh.close)
      .map((wh) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: DAYS_MAP[wh.day_name] || wh.day_name,
        opens: wh.open,
        closes: wh.close,
      })),
    priceRange: '$$',
    currenciesAccepted: 'EUR',
  }
}

export function generateServiceSchemas(
  services: ServiceInfo[],
  tenantName: string,
) {
  return services.map((service) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    ...(service.description && { description: service.description }),
    provider: {
      '@type': 'LocalBusiness',
      name: tenantName,
    },
    offers: {
      '@type': 'Offer',
      price: service.price.toFixed(2),
      priceCurrency: 'EUR',
    },
  }))
}

export function generateOrganizationSchema(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BookingHub',
    url: baseUrl,
    logo: `${baseUrl}/og-image.png`,
    description:
      'Das moderne Buchungssystem für Dienstleister. Online-Terminbuchung für Salons, Friseure und Beauty-Studios.',
  }
}

export function generateFAQSchema(faqs: ReadonlyArray<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  }
}

export function generateArticleSchema(article: {
  title: string
  description: string
  date: string
  slug: string
  author?: string
  image?: string
  baseUrl: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    url: `${article.baseUrl}/blog/${article.slug}`,
    author: {
      '@type': 'Organization',
      name: article.author || 'BookingHub Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'BookingHub',
      logo: {
        '@type': 'ImageObject',
        url: `${article.baseUrl}/og-image.png`,
      },
    },
    image: article.image
      ? `${article.baseUrl}${article.image}`
      : `${article.baseUrl}/og-image.png`,
  }
}
