import { MetadataRoute } from 'next'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getBlogPostSlugs } from '@/lib/blog/posts'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bookinghub.de'

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/kontakt`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]

  // Dynamic salon pages
  const { data: tenants } = await supabaseAdmin
    .from('tenants')
    .select('slug, updated_at')
    .eq('is_active', true)

  const salonPages: MetadataRoute.Sitemap = (tenants || []).map((t) => ({
    url: `${baseUrl}/${t.slug}`,
    lastModified: t.updated_at ? new Date(t.updated_at) : undefined,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // Blog posts
  const blogSlugs = await getBlogPostSlugs()
  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  return [...staticPages, ...salonPages, ...blogPages]
}
