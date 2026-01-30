'use client'

import { usePathname } from 'next/navigation'
import SiteHeader from './SiteHeader'

const hiddenPrefixes = ['/book', '/widget', '/embed', '/dashboard']

export default function ConditionalHeader() {
  const pathname = usePathname()
  const shouldHide = hiddenPrefixes.some((prefix) => pathname.startsWith(prefix))

  if (shouldHide) return null

  return <SiteHeader />
}
