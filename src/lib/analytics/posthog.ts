import type { AnalyticsProvider } from './types';

class PostHogProvider implements AnalyticsProvider {
  id = 'posthog';
  name = 'PostHog';
  enabled = false; // Disabled by default until toggled on in the comparison dashboard
  initialized = false;

  async init(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    console.log('[Analytics] [PostHog] Initializing (Simulated)...');

    // Simulate SDK loading delay
    await new Promise((resolve) => setTimeout(resolve, 80));

    this.initialized = true;
    console.log('[Analytics] [PostHog] Initialized successfully (Simulated).');
    return true;
  }

  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.enabled || !this.initialized) return;

    const formattedProps = {
      ...properties,
      $platform: 'Web',
      $library: 'posthog-js-mock',
      $active_features: ['session-replay', 'heatmaps', 'feature-flags'],
    };

    console.log(`[Analytics] [PostHog - Simulated] Event Tracked: ${eventName}`, formattedProps);
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.enabled || !this.initialized) return;

    console.log(`[Analytics] [PostHog - Simulated] User Identified: ${userId}`, traits);
  }
}

export const postHogProvider = new PostHogProvider();
