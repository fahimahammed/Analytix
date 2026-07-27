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
    bundleSizeKb: 12.5,
    averageLatencyMs: 45,
    freeTierLimit: '100k events/mo',
    startingPrice: '$49/mo (Plus)',
    billingMetric: 'Event Volume',
    features: {
      funnels: true,
      sessionReplay: false,
      heatmaps: false,
      featureFlags: false,
      abTesting: false,
      cohorts: true,
    },
    pros: [
      'Industry-leading product analytics',
      'Powerful funnel & cohort tools',
      'Clean UI for PMs/data analysts',
    ],
    cons: [
      'Session replay requires add-on',
      'Expensive beyond free tier',
      'No native A/B testing in base',
    ],
  },
  posthog: {
    id: 'posthog',
    name: 'PostHog',
    bundleSizeKb: 48.0,
    averageLatencyMs: 85,
    freeTierLimit: '1M events/mo',
    startingPrice: 'Pay-as-you-go ($0.0001/event)',
    billingMetric: 'Usage-based',
    features: {
      funnels: true,
      sessionReplay: true,
      heatmaps: true,
      featureFlags: true,
      abTesting: true,
      cohorts: true,
    },
    pros: [
      'All-in-one suite (session recording, heatmaps)',
      'Generous free tier (1M events)',
      'Open-source self-hosting available',
    ],
    cons: [
      'Heavy client SDK bundle size',
      'Slightly higher network latency',
      'Visual UI can be complex for beginners',
    ],
  },
  mixpanel: {
    id: 'mixpanel',
    name: 'Mixpanel',
    bundleSizeKb: 18.2,
    averageLatencyMs: 52,
    freeTierLimit: '1M events/mo',
    startingPrice: '$20/mo (Growth)',
    billingMetric: 'Monthly Tracked Users (MTUs)',
    features: {
      funnels: true,
      sessionReplay: false,
      heatmaps: false,
      featureFlags: false,
      abTesting: false,
      cohorts: true,
    },
    pros: [
      'Extremely fast, interactive reports',
      'Simple tag-based segmentations',
      'Strong developer focus',
    ],
    cons: [
      'No session recording/heatmaps',
      'Limited feature flag capabilities',
      'Enterprise tier is expensive',
    ],
  },
};
