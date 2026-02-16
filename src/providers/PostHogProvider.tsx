import { useEffect } from 'react';
import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (POSTHOG_KEY) {
            posthog.init(POSTHOG_KEY, {
                api_host: POSTHOG_HOST,
                person_profiles: 'identified_only', // Otimização para economizar eventos
                capture_pageview: false // Vamos controlar manualmente para garantir precisão em SPA
            });
        } else {
            console.warn("PostHog Analytics: VITE_POSTHOG_KEY não encontrada. Analytics desativado.");
        }
    }, []);

    return <>{children}</>;
}
