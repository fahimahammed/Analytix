import { amplitudeProvider } from './amplitude';
import { mixpanelProvider } from './mixpanel';
import { postHogProvider } from './posthog';
import type { AnalyticsProvider } from './types';

class AnalyticsManager {
  private providers: AnalyticsProvider[] = [];
  private sessionUserId = '';

  constructor() {
    if (typeof window !== 'undefined') {
      // Retrieve toggled provider settings from localStorage if they exist
      const savedSettings = localStorage.getItem('analytics_providers_enabled');
      const settings = savedSettings ? JSON.parse(savedSettings) : {};

      // Register default providers
      this.providers = [amplitudeProvider, postHogProvider, mixpanelProvider];

      // Load saved toggle states, fallback to defaults
      for (const provider of this.providers) {
        if (settings[provider.id] !== undefined) {
          provider.enabled = settings[provider.id];
        }
      }

      // Generate a mock anonymous user ID for the session if not set
      let anonymousId = localStorage.getItem('analytics_anonymous_id');
      if (!anonymousId) {
        anonymousId = `anon_${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem('analytics_anonymous_id', anonymousId);
      }
      this.sessionUserId = anonymousId;
    }
  }

  async initAll(): Promise<void> {
    if (typeof window === 'undefined') return;

    const initPromises = this.providers
      .filter((provider) => provider.enabled)
      .map((provider) => provider.init());

    await Promise.all(initPromises);
  }

  track(eventName: string, properties?: Record<string, any>): void {
    if (typeof window === 'undefined') return;

    // Attach base properties to all events
    const baseProperties = {
      $screen_width: window.innerWidth,
      $screen_height: window.innerHeight,
      $url: window.location.href,
      $path: window.location.pathname,
      $referrer: document.referrer || 'direct',
      ...properties,
    };

    // Track on all enabled providers
    for (const provider of this.providers) {
      if (provider.enabled) {
        try {
          provider.track(eventName, baseProperties);
        } catch (error) {
          console.error(`Error in analytics provider ${provider.name}:`, error);
        }
      }
    }
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (typeof window === 'undefined') return;

    this.sessionUserId = userId;
    localStorage.setItem('analytics_user_id', userId);

    for (const provider of this.providers) {
      if (provider.enabled) {
        try {
          provider.identify(userId, traits);
        } catch (error) {
          console.error(`Error identifying in provider ${provider.name}:`, error);
        }
      }
    }
  }

  getUserId(): string {
    return this.sessionUserId;
  }

  getProviders(): AnalyticsProvider[] {
    return this.providers;
  }

  toggleProvider(id: string, enabled: boolean): void {
    const provider = this.providers.find((p) => p.id === id);
    if (provider) {
      provider.enabled = enabled;

      // Save settings to localStorage
      const settings: Record<string, boolean> = {};
      for (const p of this.providers) {
        if (p.id !== 'localDb') {
          settings[p.id] = p.enabled;
        }
      }
      localStorage.setItem('analytics_providers_enabled', JSON.stringify(settings));

      // Re-initialize if turned on
      if (enabled && !provider.initialized) {
        provider.init();
      }

      console.log(
        `[Analytics] Provider ${provider.name} has been ${enabled ? 'enabled' : 'disabled'}.`,
      );
    }
  }
}

// Global singleton instance
export const analyticsManager = typeof window !== 'undefined' ? new AnalyticsManager() : null;
