// instrumentation-client.js
import posthog from 'posthog-js'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
    person_profiles: 'identified_only',
    defaults: '2025-11-30',
    loaded: (ph) => {
        if (process.env.NODE_ENV === 'development') ph.debug()
    }
});
            