import posthog from 'posthog-js';
import type { AnalyticsProvider } from './types';

class PostHogProvider implements AnalyticsProvider {
  id = 'posthog';
  name = 'PostHog';
  enabled = false; // Disabled by default until toggled on in the comparison dashboard
  initialized = false;
  private apiKey =
    process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_API_KEY || '';
  private apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  async init(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if (!this.apiKey) {
      console.warn(
        'PostHog Project Key (NEXT_PUBLIC_POSTHOG_KEY) is missing. PostHog will run in simulation/console mode.',
      );
      this.initialized = true; // Set to true to allow mock tracking
      return true;
    }

    try {
      posthog.init(this.apiKey, {
        api_host: this.apiHost,
        capture_pageview: false, // We'll handle page views manually to avoid duplicates
        persistence: 'localStorage',
        autocapture: true,
        capture_heatmaps: true,
      });

      this.initialized = true;
      console.log('PostHog initialized successfully.');
      return true;
    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
      return false;
    }
  }

  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.enabled) return;

    const formattedProps = {
      ...properties,
      $platform: 'Web',
      $library: 'posthog-js',
      $active_features: ['session-replay', 'heatmaps', 'feature-flags'],
    };

    if (this.apiKey && this.initialized) {
      posthog.capture(eventName, formattedProps);
      console.log(`[Analytics] [PostHog] Event Tracked: ${eventName}`, formattedProps);
    } else {
      console.log(`[Analytics] [PostHog - Simulating] Event Tracked: ${eventName}`, formattedProps);
    }
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.enabled) return;

    if (this.apiKey && this.initialized) {
      posthog.identify(userId, traits);
      console.log(`[Analytics] [PostHog] User Identified: ${userId}`, traits);
    } else {
      console.log(`[Analytics] [PostHog - Simulating] User Identified: ${userId}`, traits);
    }
  }
}

export const postHogProvider = new PostHogProvider();
