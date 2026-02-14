import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Calendar as CalendarIcon, ArrowLeft } from 'lucide-react'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getBlogPostBySlug, getBlogPostSlugs } from '@/lib/blog/posts'
import { generateArticleSchema } from '@/lib/seo/json-ld'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getBlogPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    return { title: 'Beitrag nicht gefunden' }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bookinghub.de'

  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: {
      canonical: `${baseUrl}/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author || 'BookingHub Team'],
      url: `${baseUrl}/blog/${slug}`,
      images: post.image ? [post.image] : [],
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bookinghub.de'

  const articleSchema = generateArticleSchema({
    title: post.title,
    description: post.description,
    date: post.date,
    slug: post.slug,
    author: post.author,
    image: post.image,
    baseUrl,
  })

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SiteHeader />

      <article className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Alle Beiträge
          </Link>

          <header className="mb-12">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <CalendarIcon className="w-4 h-4" />
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('de-DE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
              {post.author && (
                <>
                  <span className="text-gray-300">|</span>
                  <span>{post.author}</span>
                </>
              )}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
              {post.title}
            </h1>
            <p className="mt-4 text-xl text-gray-600">{post.description}</p>
          </header>

          <div className="prose prose-lg prose-gray max-w-none prose-headings:text-gray-900 prose-a:text-blue-600 prose-strong:text-gray-900">
            <MDXRemote source={post.content} />
          </div>

          <div className="mt-16 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 sm:p-12 text-center">
            <h3 className="text-2xl font-bold text-white mb-3">
              Bereit für mehr Buchungen?
            </h3>
            <p className="text-gray-400 mb-6">
              Starten Sie jetzt kostenlos mit BookingHub — in 10 Minuten eingerichtet.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Kostenlos starten
            </Link>
          </div>
        </div>
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <SiteFooter />
    </div>
  )
}
