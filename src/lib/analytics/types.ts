export interface AnalyticsProvider {
  id: string;
  name: string;
  enabled: boolean;
  initialized: boolean;
  init: () => Promise<boolean>;
  track: (eventName: string, properties?: Record<string, any>) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
}

export interface ProviderBenchmark {
  id: string;
  name: string;
  bundleSizeKb: number;
  averageLatencyMs: number;
  freeTierLimit: string;
  startingPrice: string;
  billingMetric: string;
  features: {
    funnels: boolean;
    sessionReplay: boolean;
    heatmaps: boolean;
    featureFlags: boolean;
    abTesting: boolean;
    cohorts: boolean;
  };
  pros: string[];
  cons: string[];
}

export const PROVIDER_BENCHMARKS: Record<string, ProviderBenchmark> = {
  amplitude: {
    id: 'amplitude',
    name: 'Amplitude',
    bundleSizeKb: 26.0,
    averageLatencyMs: 45,
    freeTierLimit: '2M events/mo (Starter)',
    startingPrice: '$49/mo (Plus)',
    billingMetric: 'Event Volume',
    features: {
      funnels: true,
      sessionReplay: true,
      heatmaps: false,
      featureFlags: true,
      abTesting: true,
      cohorts: true,
    },
    pros: [
      'Industry-leading behavioral product analytics',
      'Generous 2M monthly events on Free Starter plan',
      'Robust experimentation and feature flagging',
    ],
    cons: [
      'Expensive scaling to paid Growth/Enterprise plans',
      'No visual click heatmaps',
      'Complex interface for beginners',
    ],
  },
  posthog: {
    id: 'posthog',
    name: 'PostHog',
    bundleSizeKb: 125.0,
    averageLatencyMs: 85,
    freeTierLimit: '1M events/mo + 5k replays',
    startingPrice: 'Pay-as-you-go ($0.0001/event)',
    billingMetric: 'Usage-based (Per Product)',
    features: {
      funnels: true,
      sessionReplay: true,
      heatmaps: true,
      featureFlags: true,
      abTesting: true,
      cohorts: true,
    },
    pros: [
      'All-in-one suite (analytics, recording, flags, A/B)',
      'Generous free tier (1M events + 5k replays/mo)',
      'Open-source self-hosting and transparent pricing',
    ],
    cons: [
      'Heavier client SDK bundle size (125 KB minified)',
      'UI can feel cluttered with many tools',
      'High volume can become costly without billing limits',
    ],
  },
  mixpanel: {
    id: 'mixpanel',
    name: 'Mixpanel',
    bundleSizeKb: 95.0,
    averageLatencyMs: 52,
    freeTierLimit: '1M events/mo + 10k replays',
    startingPrice: '$28/mo (Growth)',
    billingMetric: 'Event Volume',
    features: {
      funnels: true,
      sessionReplay: true,
      heatmaps: false,
      featureFlags: false,
      abTesting: false,
      cohorts: true,
    },
    pros: [
      'Super fast query execution and interactive reports',
      'Includes 10,000 session replays/mo on Free tier',
      'Clean, developer-friendly interface',
    ],
    cons: [
      'No native feature flags or A/B testing',
      'No click heatmap visualization',
      'Cohorts are locked behind paid tiers',
    ],
  },
};
