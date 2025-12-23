'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import '@/lib/instrumentation-client.js'

export default function PostHogProviderClient({ children }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname) return
    // Track pageviews on route changes
    posthog.capture('$pageview')
  }, [pathname, searchParams])

  return (
    <PostHogProvider client={posthog}>
      {children}
    </PostHogProvider>
  )
}
