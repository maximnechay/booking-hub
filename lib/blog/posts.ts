import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'

const BLOG_DIR = join(process.cwd(), 'content', 'blog')

export interface BlogPostMeta {
  title: string
  description: string
  date: string
  slug: string
  keywords: string[]
  image?: string
  author?: string
}

export interface BlogPost extends BlogPostMeta {
  content: string
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    const files = await readdir(BLOG_DIR)
    const mdxFiles = files.filter((f) => f.endsWith('.mdx'))

    const posts = await Promise.all(
      mdxFiles.map(async (filename) => {
        const filePath = join(BLOG_DIR, filename)
        const fileContent = await readFile(filePath, 'utf-8')
        const { data, content } = matter(fileContent)

        return {
          title: data.title,
          description: data.description,
          date: data.date,
          slug: data.slug || filename.replace('.mdx', ''),
          keywords: data.keywords || [],
          image: data.image,
          author: data.author,
          content,
        } as BlogPost
      }),
    )

    return posts.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )
  } catch {
    return []
  }
}

export async function getBlogPostBySlug(
  slug: string,
): Promise<BlogPost | null> {
  try {
    const filePath = join(BLOG_DIR, `${slug}.mdx`)
    const fileContent = await readFile(filePath, 'utf-8')
    const { data, content } = matter(fileContent)

    return {
      title: data.title,
      description: data.description,
      date: data.date,
      slug: data.slug || slug,
      keywords: data.keywords || [],
      image: data.image,
      author: data.author,
      content,
    }
  } catch {
    return null
  }
}

export async function getBlogPostSlugs(): Promise<string[]> {
  try {
    const files = await readdir(BLOG_DIR)
    return files.filter((f) => f.endsWith('.mdx')).map((f) => f.replace('.mdx', ''))
  } catch {
    return []
  }
}
