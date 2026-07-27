import * as amplitude from '@amplitude/analytics-browser';
import type { AnalyticsProvider } from './types';

class AmplitudeProvider implements AnalyticsProvider {
  id = 'amplitude';
  name = 'Amplitude';
  enabled = true;
  initialized = false;
  private apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || '';

  async init(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if (!this.apiKey) {
      console.warn(
        'Amplitude API Key (NEXT_PUBLIC_AMPLITUDE_API_KEY) is missing. Amplitude will run in simulation/console mode.',
      );
      this.initialized = true; // Set to true to allow mock tracking
      return true;
    }

    try {
      await amplitude.init(this.apiKey, undefined, {
        defaultTracking: {
          pageViews: false, // We'll handle page views manually to avoid duplicates
          sessions: true,
          formInteractions: false,
          fileDownloads: false,
        },
      }).promise;

      this.initialized = true;
      console.log('Amplitude initialized successfully.');
      return true;
    } catch (error) {
      console.error('Failed to initialize Amplitude:', error);
      return false;
    }
  }

  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.enabled) return;

    const formattedProps = {
      ...properties,
      $platform: 'Web',
      $library: 'amplitude-browser-sdk',
    };

    if (this.apiKey && this.initialized) {
      amplitude.track(eventName, formattedProps);
      console.log(`[Analytics] [Amplitude] Event Tracked: ${eventName}`, formattedProps);
    } else {
      console.log(
        `[Analytics] [Amplitude - Simulating] Event Tracked: ${eventName}`,
        formattedProps,
      );
    }
  }

  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.enabled) return;

    if (this.apiKey && this.initialized) {
      amplitude.setUserId(userId);
      if (traits) {
        const identifyObj = new amplitude.Identify();
        for (const [key, value] of Object.entries(traits)) {
          identifyObj.set(key, value);
        }
        amplitude.identify(identifyObj);
      }
      console.log(`[Analytics] [Amplitude] User Identified: ${userId}`, traits);
    } else {
      console.log(`[Analytics] [Amplitude - Simulating] User Identified: ${userId}`, traits);
    }
  }
}

export const amplitudeProvider = new AmplitudeProvider();
