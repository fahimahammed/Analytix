import mixpanel from 'mixpanel-browser';
import type { AnalyticsProvider } from './types';

class MixpanelProvider implements AnalyticsProvider {
  id = 'mixpanel';
  name = 'Mixpanel';
  enabled = false; // Disabled by default until toggled on in the comparison dashboard
  initialized = false;
  private apiKey =
    process.env.NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN || process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '';

  async init(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if (!this.apiKey) {
      console.warn(
        'Mixpanel Project Token (NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN) is missing. Mixpanel will run in simulation/console mode.',
      );
      this.initialized = true; // Set to true to allow mock tracking
      return true;
    }

    try {
      mixpanel.init(this.apiKey, {
        debug: process.env.NODE_ENV !== 'production',
        track_pageview: false, // We'll handle page views manually to avoid duplicates
        persistence: 'localStorage',
        record_sessions_percent: 100, // Record 100% of sessions for this observability demo
        record_heatmap_data: true,
      });

      this.initialized = true;
      console.log('Mixpanel initialized successfully.');
      return true;
    } catch (error) {
      console.error('Failed to initialize Mixpanel:', error);
      return false;
    }
  }

  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.enabled) return;

    const formattedProps = {
      ...properties,
      $platform: 'Web',
      $library: 'mixpanel-browser',
    };

    if (this.apiKey && this.initialized) {
      mixpanel.track(eventName, formattedProps);
      console.log(`[Analytics] [Mixpanel] Event Tracked: ${eventName}`, formattedProps);
    } else {
      console.log(
        `[Analytics] [Mixpanel - Simulating] Event Tracked: ${eventName}`,
        formattedProps,
      );
    }
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.enabled) return;

    if (this.apiKey && this.initialized) {
      mixpanel.identify(userId);
      if (traits) {
        mixpanel.people.set(traits);
      }
      console.log(`[Analytics] [Mixpanel] User Identified: ${userId}`, traits);
    } else {
      console.log(`[Analytics] [Mixpanel - Simulating] User Identified: ${userId}`, traits);
    }
  }
}

export const mixpanelProvider = new MixpanelProvider();
