import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bookinghub.de'

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/pricing', '/kontakt', '/blog'],
        disallow: [
          '/dashboard/',
          '/api/',
          '/cancel/',
          '/reschedule/',
          '/login',
          '/register',
          '/book/',
          '/widget/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
