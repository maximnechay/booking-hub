import Link from 'next/link'
import { Calendar as CalendarIcon, ArrowRight } from 'lucide-react'
import { getAllBlogPosts } from '@/lib/blog/posts'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export const metadata = {
  title: 'Blog — Tipps für Salons & Online-Buchung',
  description:
    'Expertentipps zu Online-Terminbuchung, Salon-Management und Kundengewinnung. Insights für Friseure und Beauty-Studios.',
  openGraph: {
    title: 'BookingHub Blog — Tipps für Salons',
    description:
      'Expertentipps zu Online-Terminbuchung und Salon-Management',
  },
}

export default async function BlogPage() {
  const posts = await getAllBlogPosts()

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <SiteHeader />

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
            Blog
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-600">
            Tipps & Insights zu Online-Terminbuchung und Salon-Management
          </p>
        </div>
      </section>

      <section className="pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block rounded-2xl border border-gray-200 bg-white p-8 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
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
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {post.title}
                </h2>
                <p className="text-gray-600 mb-4">{post.description}</p>
                <span className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm">
                  Weiterlesen
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}

            {posts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  Noch keine Blog-Beiträge verfügbar.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
