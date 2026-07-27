'use client';

import { useEffect, useRef } from 'react';
import { useAnalytics } from '@/lib/analytics/AnalyticsContext';

interface TrackPageViewProps {
  pageName: string;
  properties?: Record<string, any>;
}

export function TrackPageView({ pageName, properties }: TrackPageViewProps) {
  const { trackEvent } = useAnalytics();
  const propertiesRef = useRef(properties);

  useEffect(() => {
    propertiesRef.current = properties;
  }, [properties]);

  useEffect(() => {
    trackEvent('Page Viewed', {
      $page_name: pageName,
      ...propertiesRef.current,
    });
  }, [pageName, trackEvent]);

  return null;
}
