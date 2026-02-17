import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const UTM_STORAGE_KEY = 'neomissio_utms';

export interface UTMParams {
    source?: string | null;
    medium?: string | null;
    campaign?: string | null;
    term?: string | null;
    content?: string | null;
    referrer?: string | null;
}

export const useUTMTracking = () => {
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const utms: UTMParams = {
            source: searchParams.get('utm_source'),
            medium: searchParams.get('utm_medium'),
            campaign: searchParams.get('utm_campaign'),
            term: searchParams.get('utm_term'),
            content: searchParams.get('utm_content'),
            referrer: document.referrer || null,
        };

        // Only save if at least one UTM param exists
        const hasUTMs = Object.values(utms).some(val => val !== null);

        if (hasUTMs) {
            // Clean null values
            const cleanUtms = Object.fromEntries(
                Object.entries(utms).filter(([_, v]) => v !== null)
            );

            localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(cleanUtms));
            console.log('UTMs captured:', cleanUtms);
        }
    }, [searchParams]);

    const getStoredUTMs = (): UTMParams | null => {
        const stored = localStorage.getItem(UTM_STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    };

    return { getStoredUTMs };
};
