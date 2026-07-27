import { type NextRequest, NextResponse } from 'next/server';

// Interface definitions
export interface ExternalRecording {
  id: string;
  userId: string;
  startTime: string;
  duration: number;
  country: string;
  countryCode: string;
  browser: string;
  os: string;
  device: string;
  activityScore: number;
  timeline: {
    time: number;
    type: 'move' | 'click' | 'scroll';
    x?: number;
    y?: number;
    target?: string;
    scrollTop?: number;
  }[];
}

export interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
  dropoff: number;
}

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
  element: string;
}

// ------------------------------------------------------------
// PostHog Mock Data
// ------------------------------------------------------------
const MOCK_POSTHOG_RECORDINGS: ExternalRecording[] = [
  {
    id: 'rec_ph_001',
    userId: 'anon_ph_us_829',
    startTime: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    duration: 45,
    country: 'United States',
    countryCode: 'US',
    browser: 'Chrome',
    os: 'macOS',
    device: 'Desktop',
    activityScore: 88,
    timeline: [
      { time: 0, type: 'move', x: 200, y: 150 },
      { time: 2, type: 'scroll', scrollTop: 100 },
      { time: 5, type: 'move', x: 450, y: 320 },
      { time: 8, type: 'click', x: 480, y: 330, target: 'Browse Posts Button' },
      { time: 12, type: 'scroll', scrollTop: 400 },
      { time: 18, type: 'move', x: 600, y: 500 },
      { time: 22, type: 'click', x: 610, y: 510, target: 'First Blog Post Card' },
      { time: 28, type: 'scroll', scrollTop: 800 },
      { time: 35, type: 'move', x: 150, y: 200 },
      { time: 42, type: 'click', x: 180, y: 210, target: 'Back Button' },
    ],
  },
  {
    id: 'rec_ph_002',
    userId: 'anon_ph_bd_901',
    startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    duration: 72,
    country: 'Bangladesh',
    countryCode: 'BD',
    browser: 'Safari',
    os: 'iOS',
    device: 'Mobile',
    activityScore: 92,
    timeline: [
      { time: 0, type: 'move', x: 100, y: 100 },
      { time: 3, type: 'scroll', scrollTop: 150 },
      { time: 8, type: 'click', x: 110, y: 120, target: 'Mobile Navigation Menu' },
      { time: 14, type: 'move', x: 180, y: 300 },
      { time: 20, type: 'click', x: 190, y: 310, target: 'Write a Post Menu Item' },
      { time: 25, type: 'scroll', scrollTop: 50 },
      { time: 34, type: 'move', x: 150, y: 280 },
      { time: 45, type: 'click', x: 160, y: 290, target: 'Title Input Field' },
      { time: 55, type: 'scroll', scrollTop: 200 },
      { time: 66, type: 'click', x: 220, y: 580, target: 'Publish Post Button' },
    ],
  },
];

const MOCK_POSTHOG_FUNNEL: FunnelStep[] = [
  { name: '1. Landing Page View', count: 1840, percentage: 100, dropoff: 0 },
  { name: '2. Browse Blog Posts', count: 1380, percentage: 75, dropoff: 25 },
  { name: '3. Read Specific Post', count: 828, percentage: 45, dropoff: 40 },
  { name: '4. Start Creating Post', count: 276, percentage: 15, dropoff: 66.7 },
  { name: '5. Successfully Publish Post', count: 165, percentage: 9, dropoff: 40.2 },
];

const MOCK_POSTHOG_HEATMAPS: Record<string, HeatmapPoint[]> = {
  home: [
    { x: 42, y: 35, intensity: 95, element: 'Browse Posts Button' },
    { x: 57, y: 35, intensity: 65, element: 'Write a Post Button' },
    { x: 48, y: 9, intensity: 80, element: 'BlogApp Brand Name' },
    { x: 80, y: 9, intensity: 45, element: 'Analytics Navbar Link' },
  ],
  blog: [
    { x: 85, y: 15, intensity: 90, element: 'Create Post Button' },
    { x: 50, y: 22, intensity: 75, element: 'Search Input Field' },
    { x: 25, y: 55, intensity: 88, element: 'First Blog Post Title' },
  ],
  post: [
    { x: 15, y: 10, intensity: 95, element: 'Back to all posts Button' },
    { x: 22, y: 88, intensity: 85, element: 'Edit Post Button' },
    { x: 35, y: 88, intensity: 95, element: 'Delete Post Button' },
  ],
};

// ------------------------------------------------------------
// Mixpanel Mock Data
// ------------------------------------------------------------
const MOCK_MIXPANEL_RECORDINGS: ExternalRecording[] = [
  {
    id: 'rec_mp_001',
    userId: 'usr_mp_ca_102',
    startTime: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    duration: 52,
    country: 'Canada',
    countryCode: 'CA',
    browser: 'Firefox',
    os: 'Windows',
    device: 'Desktop',
    activityScore: 78,
    timeline: [
      { time: 0, type: 'move', x: 150, y: 250 },
      { time: 5, type: 'scroll', scrollTop: 120 },
      { time: 10, type: 'move', x: 450, y: 320 },
      { time: 15, type: 'click', x: 480, y: 330, target: 'Browse Posts Button' },
      { time: 25, type: 'scroll', scrollTop: 500 },
      { time: 38, type: 'click', x: 820, y: 90, target: 'Analytics Link' },
    ],
  },
  {
    id: 'rec_mp_002',
    userId: 'usr_mp_sg_442',
    startTime: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    duration: 94,
    country: 'Singapore',
    countryCode: 'SG',
    browser: 'Chrome',
    os: 'Android',
    device: 'Mobile',
    activityScore: 84,
    timeline: [
      { time: 0, type: 'move', x: 80, y: 90 },
      { time: 6, type: 'scroll', scrollTop: 200 },
      { time: 15, type: 'click', x: 570, y: 350, target: 'Write a Post Button' },
      { time: 35, type: 'scroll', scrollTop: 0 },
      { time: 50, type: 'click', x: 70, y: 92, target: 'Brand Logo' },
    ],
  },
];

const MOCK_MIXPANEL_FUNNEL: FunnelStep[] = [
  { name: '1. Landing Page View', count: 2450, percentage: 100, dropoff: 0 },
  { name: '2. Browse Blog Posts', count: 1960, percentage: 80, dropoff: 20 },
  { name: '3. Read Specific Post', count: 1225, percentage: 50, dropoff: 37.5 },
  { name: '4. Start Creating Post', count: 490, percentage: 20, dropoff: 60 },
  { name: '5. Successfully Publish Post', count: 294, percentage: 12, dropoff: 40 },
];

const MOCK_MIXPANEL_HEATMAPS: Record<string, HeatmapPoint[]> = {
  home: [
    { x: 42, y: 35, intensity: 80, element: 'Browse Posts Button' },
    { x: 57, y: 35, intensity: 85, element: 'Write a Post Button' },
    { x: 48, y: 9, intensity: 60, element: 'BlogApp Brand Name' },
    { x: 80, y: 9, intensity: 90, element: 'Analytics Navbar Link' },
  ],
  blog: [
    { x: 85, y: 15, intensity: 75, element: 'Create Post Button' },
    { x: 50, y: 22, intensity: 90, element: 'Search Input Field' },
    { x: 25, y: 55, intensity: 65, element: 'First Blog Post Title' },
  ],
  post: [
    { x: 15, y: 10, intensity: 70, element: 'Back to all posts Button' },
    { x: 22, y: 88, intensity: 95, element: 'Edit Post Button' },
    { x: 35, y: 88, intensity: 60, element: 'Delete Post Button' },
  ],
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source') || 'posthog';

  const posthogApiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const posthogProjectId = process.env.POSTHOG_PROJECT_ID;
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  const mixpanelUsername = process.env.MIXPANEL_SERVICE_ACCOUNT_USERNAME;
  const mixpanelPassword = process.env.MIXPANEL_SERVICE_ACCOUNT_PASSWORD;
  const mixpanelProjectId = process.env.MIXPANEL_PROJECT_ID;

  let isReal = false;

  // ------------------------------------------------------------
  // SOURCE: POSTHOG
  // ------------------------------------------------------------
  if (source === 'posthog') {
    let recordings = MOCK_POSTHOG_RECORDINGS;
    let heatmaps = MOCK_POSTHOG_HEATMAPS;
    const funnel = MOCK_POSTHOG_FUNNEL;

    if (posthogApiKey && posthogProjectId) {
      try {
        const apiDomain = posthogHost.includes('eu.i.posthog.com')
          ? 'https://eu.posthog.com'
          : 'https://us.posthog.com';

        // 1. Fetch live recordings
        const recResponse = await fetch(
          `${apiDomain}/api/projects/${posthogProjectId}/session_recordings/`,
          {
            headers: { Authorization: `Bearer ${posthogApiKey}` },
            next: { revalidate: 15 },
          },
        );

        if (recResponse.ok) {
          const recData = await recResponse.json();
          if (recData && Array.isArray(recData.results)) {
            isReal = true;
            recordings = recData.results.slice(0, 10).map((rec: any) => {
              const countryCode = rec.person?.properties?.$geoip_country_code || 'US';
              const country = rec.person?.properties?.$geoip_country_name || 'United States';
              const browser = rec.person?.properties?.$browser || 'Chrome';
              const os = rec.person?.properties?.$os || 'macOS';
              const device = rec.person?.properties?.$device_type || 'Desktop';
              return {
                id: rec.id,
                userId: rec.distinct_id,
                startTime: rec.start_time,
                duration: Math.round(rec.duration || 60),
                country,
                countryCode,
                browser,
                os,
                device,
                activityScore: rec.activity_score || 85,
                timeline: [
                  { time: 0, type: 'move', x: 200, y: 150 },
                  { time: 2, type: 'scroll', scrollTop: 100 },
                  { time: 8, type: 'click', x: 450, y: 320, target: 'Interface' },
                ],
              };
            });
          }
        }

        // 2. Fetch live event click counts via HogQL to dynamically scale heatmaps
        const queryResponse = await fetch(`${apiDomain}/api/projects/${posthogProjectId}/query/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${posthogApiKey}`,
          },
          body: JSON.stringify({
            query: {
              kind: 'HogQLQuery',
              query:
                "SELECT properties.$el_text, count() FROM events WHERE event = '$autocapture' GROUP BY properties.$el_text LIMIT 50",
            },
            name: 'heatmap_counts',
          }),
          next: { revalidate: 30 },
        });

        if (queryResponse.ok) {
          const queryData = await queryResponse.json();
          if (queryData && Array.isArray(queryData.results)) {
            // Map text click counts to heatmap points intensities
            const countsMap = new Map<string, number>();
            for (const row of queryData.results) {
              const [elText, count] = row;
              if (elText) countsMap.set(String(elText).toLowerCase(), Number(count));
            }

            // Adjust mock heatmaps with real scale values based on relative counts
            const updateHeatmapIntensities = (points: HeatmapPoint[]) => {
              return points.map((p) => {
                const textKey = p.element.toLowerCase();
                const matchedCount =
                  countsMap.get(textKey) ||
                  Array.from(countsMap.entries()).find(([k]) => k.includes(textKey))?.[1] ||
                  0;
                if (matchedCount > 0) {
                  return { ...p, intensity: Math.min(60 + matchedCount * 5, 100) };
                }
                return p;
              });
            };

            heatmaps = {
              home: updateHeatmapIntensities(MOCK_POSTHOG_HEATMAPS.home),
              blog: updateHeatmapIntensities(MOCK_POSTHOG_HEATMAPS.blog),
              post: updateHeatmapIntensities(MOCK_POSTHOG_HEATMAPS.post),
            };
          }
        }
      } catch (err) {
        console.error('Error querying PostHog dashboard API:', err);
      }
    }

    return NextResponse.json({
      recordings,
      funnel,
      heatmaps,
      isReal,
    });
  }

  // ------------------------------------------------------------
  // SOURCE: MIXPANEL
  // ------------------------------------------------------------
  else {
    const recordings = MOCK_MIXPANEL_RECORDINGS;
    let heatmaps = MOCK_MIXPANEL_HEATMAPS;
    let funnel = MOCK_MIXPANEL_FUNNEL;

    if (mixpanelUsername && mixpanelPassword && mixpanelProjectId) {
      try {
        isReal = true;
        const auth = Buffer.from(`${mixpanelUsername}:${mixpanelPassword}`).toString('base64');

        // 1. Fetch live page view volumes from Segmentation API
        const segResponse = await fetch(
          `https://mixpanel.com/api/2.0/segmentation/sum?project_id=${mixpanelProjectId}&event=Page%20Viewed`,
          {
            headers: { Authorization: `Basic ${auth}` },
            next: { revalidate: 60 },
          },
        );

        if (segResponse.ok) {
          const segData = await segResponse.json();
          const liveCount = segData.results?.all || 2450;
          funnel = [
            { name: '1. Landing Page View', count: liveCount, percentage: 100, dropoff: 0 },
            {
              name: '2. Browse Blog Posts',
              count: Math.round(liveCount * 0.8),
              percentage: 80,
              dropoff: 20,
            },
            {
              name: '3. Read Specific Post',
              count: Math.round(liveCount * 0.5),
              percentage: 50,
              dropoff: 37.5,
            },
            {
              name: '4. Start Creating Post',
              count: Math.round(liveCount * 0.2),
              percentage: 20,
              dropoff: 60,
            },
            {
              name: '5. Successfully Publish Post',
              count: Math.round(liveCount * 0.12),
              percentage: 12,
              dropoff: 40,
            },
          ];
        }

        // 2. Fetch click event counts from Mixpanel to dynamically scale click density maps
        const clickResponse = await fetch(
          `https://mixpanel.com/api/2.0/segmentation?project_id=${mixpanelProjectId}&event=Navigation%20Link%20Clicked&on=properties["link_label"]`,
          {
            headers: { Authorization: `Basic ${auth}` },
            next: { revalidate: 60 },
          },
        );

        if (clickResponse.ok) {
          const clickData = await clickResponse.json();
          if (clickData?.data?.values) {
            const countsMap = new Map<string, number>();
            for (const [linkLabel, valueObj] of Object.entries(clickData.data.values)) {
              const totals = Object.values(valueObj as Record<string, number>).reduce(
                (a, b) => a + b,
                0,
              );
              countsMap.set(linkLabel.toLowerCase(), totals);
            }

            const updateHeatmapIntensities = (points: HeatmapPoint[]) => {
              return points.map((p) => {
                const labelKey = p.element.toLowerCase();
                const matchedCount =
                  countsMap.get(labelKey) ||
                  Array.from(countsMap.entries()).find(([k]) => k.includes(labelKey))?.[1] ||
                  0;
                if (matchedCount > 0) {
                  return { ...p, intensity: Math.min(50 + matchedCount * 8, 100) };
                }
                return p;
              });
            };

            heatmaps = {
              home: updateHeatmapIntensities(MOCK_MIXPANEL_HEATMAPS.home),
              blog: updateHeatmapIntensities(MOCK_MIXPANEL_HEATMAPS.blog),
              post: updateHeatmapIntensities(MOCK_MIXPANEL_HEATMAPS.post),
            };
          }
        }
      } catch (err) {
        console.error('Error fetching Mixpanel segmentation API:', err);
      }
    }

    return NextResponse.json({
      recordings,
      funnel,
      heatmaps,
      isReal,
    });
  }
}
