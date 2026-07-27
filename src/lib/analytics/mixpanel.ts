import type { AnalyticsProvider } from './types';

class MixpanelProvider implements AnalyticsProvider {
  id = 'mixpanel';
  name = 'Mixpanel';
  enabled = false; // Disabled by default until toggled on in the comparison dashboard
  initialized = false;

  async init(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    console.log('[Analytics] [Mixpanel] Initializing (Simulated)...');

    // Simulate SDK loading delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    this.initialized = true;
    console.log('[Analytics] [Mixpanel] Initialized successfully (Simulated).');
    return true;
  }

  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.enabled || !this.initialized) return;

    const formattedProps = {
      ...properties,
      $platform: 'Web',
      $library: 'mixpanel-browser-mock',
    };

    console.log(`[Analytics] [Mixpanel - Simulated] Event Tracked: ${eventName}`, formattedProps);
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.enabled || !this.initialized) return;

    console.log(`[Analytics] [Mixpanel - Simulated] User Identified: ${userId}`, traits);
  }
}

export const mixpanelProvider = new MixpanelProvider();
