'use client';

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Check,
  CheckCircle2,
  Coins,
  Database,
  ExternalLink,
  Eye,
  Globe,
  Info,
  Layers,
  MapPin,
  Minus,
  Monitor,
  MousePointer,
  Navigation,
  Pause,
  Play,
  RefreshCw,
  Sliders,
  Smartphone,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { type ClientLog, useAnalytics } from '@/lib/analytics/AnalyticsContext';
import { PROVIDER_BENCHMARKS } from '@/lib/analytics/types';
import type { ExternalRecording, FunnelStep, HeatmapPoint } from '../api/analytics/external-data/route';

const getEventSummary = (log: ClientLog) => {
  const { eventName, properties } = log;
  switch (eventName) {
    case 'Page Viewed':
      return `User viewed the "${properties.$page_name || 'unknown'}" page at path "${properties.$path || ''}".`;
    case 'Navigation Link Clicked':
      return `User clicked the "${properties.link_label}" navigation link, moving from "${properties.source_url || ''}" to "${properties.destination_url || ''}".`;
    case 'Blog Post Created':
      return `User created a new blog post titled "${properties.title || ''}" by ${properties.author || 'unknown'} with ${properties.tagsCount || 0} tag(s).`;
    case 'Blog Post Edited':
      return `User updated the blog post titled "${properties.title || ''}" by ${properties.author || 'unknown'}.`;
    case 'Blog Post Deleted':
      return `User deleted the blog post titled "${properties.title || ''}" (Author: ${properties.author || 'unknown'}).`;
    default:
      return `Custom event "${eventName}" was triggered with properties.`;
  }
};

export default function AnalyticsDashboard() {
  const { trackEvent, providers, toggleProvider, userId, logs, clearLogs } = useAnalytics();

  const [activeTab, setActiveTab] = useState<'stream' | 'replays' | 'heatmaps' | 'funnels' | 'pricing' | 'performance' | 'features'>('stream');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Global Data Source Selector
  const [analyticsSource, setAnalyticsSource] = useState<'posthog' | 'mixpanel'>('posthog');

  // External data state
  const [externalData, setExternalData] = useState<{
    recordings: ExternalRecording[];
    funnel: FunnelStep[];
    heatmaps: Record<string, HeatmapPoint[]>;
    isReal: boolean;
  } | null>(null);
  const [loadingExternal, setLoadingExternal] = useState(true);

  // Simulator state
  const [simEventName, setSimEventName] = useState('button_click');
  const [simProps, setSimProps] = useState(
    '{\n  "button_name": "try_for_free",\n  "section": "hero",\n  "theme": "dark"\n}',
  );
  const [simSuccess, setSimSuccess] = useState(false);
  const [simError, setSimError] = useState('');

  // Session player modal state
  const [selectedRecording, setSelectedRecording] = useState<ExternalRecording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Selected page for Heatmap tab
  const [selectedHeatmapPage, setSelectedHeatmapPage] = useState<'home' | 'blog' | 'post'>('home');

  // Amplitude API Key presence
  const isAmplitudeConfigured = !!process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;

  // Load external recordings and funnel data
  const loadExternalData = (source: 'posthog' | 'mixpanel') => {
    setLoadingExternal(true);
    fetch(`/api/analytics/external-data?source=${source}`)
      .then((res) => res.json())
      .then((data) => {
        setExternalData(data);
        setLoadingExternal(false);
      })
      .catch((err) => {
        console.error('Failed to fetch external analytics data:', err);
        setLoadingExternal(false);
      });
  };

  useEffect(() => {
    loadExternalData(analyticsSource);
  }, [analyticsSource]);

  // Handle Play/Pause in Replay Simulator
  useEffect(() => {
    if (isPlaying && selectedRecording) {
      playbackIntervalRef.current = setInterval(() => {
        setPlaybackTime((prev) => {
          if (prev >= selectedRecording.duration) {
            setIsPlaying(false);
            if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
            return selectedRecording.duration;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    }

    return () => {
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    };
  }, [isPlaying, selectedRecording]);

  const handleOpenReplay = (rec: ExternalRecording) => {
    setSelectedRecording(rec);
    setPlaybackTime(0);
    setIsPlaying(true);
  };

  const handleCloseReplay = () => {
    setSelectedRecording(null);
    setIsPlaying(false);
    setPlaybackTime(0);
  };

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSimSuccess(false);
    setSimError('');

    try {
      const parsedProps = JSON.parse(simProps);
      trackEvent(simEventName, parsedProps);
      setSimSuccess(true);
      setTimeout(() => {
        setSimSuccess(false);
      }, 1500);
    } catch (err) {
      setSimError(err instanceof Error ? err.message : 'Invalid JSON format');
    }
  };

  // Find active simulation timeline event based on playback time
  const getActiveTimelineEvents = () => {
    if (!selectedRecording) return [];
    return selectedRecording.timeline.filter((evt) => evt.time <= playbackTime);
  };

  const getLatestCursorPosition = () => {
    if (!selectedRecording) return { x: 0, y: 0 };
    const moves = selectedRecording.timeline.filter((evt) => evt.time <= playbackTime && (evt.type === 'move' || evt.type === 'click'));
    if (moves.length === 0) return { x: 50, y: 50 }; // Default center percentage
    const lastMove = moves[moves.length - 1];
    return { x: lastMove.x || 50, y: lastMove.y || 50 };
  };

  const getLatestScrollTop = () => {
    if (!selectedRecording) return 0;
    const scrolls = selectedRecording.timeline.filter((evt) => evt.time <= playbackTime && evt.type === 'scroll');
    if (scrolls.length === 0) return 0;
    return scrolls[scrolls.length - 1].scrollTop || 0;
  };

  // Stats calculation
  const totalEvents = logs.length;
  const activeCount = providers.filter((p) => p.enabled).length;
  const totalProvidersCount = providers.length;

  // Calculate cumulative script latency
  const currentLatency = providers
    .filter((p) => p.enabled)
    .reduce((acc, p) => acc + (PROVIDER_BENCHMARKS[p.id]?.averageLatencyMs || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Analytics Observability Center</h1>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1">
              <Sparkles className="h-3 w-3" />
              v2.1 Global Select
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">
            Compare metrics, analyze bundle size, replay user sessions, visualize click heatmaps, and track conversion funnels in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => loadExternalData(analyticsSource)} variant="outline" size="sm" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loadingExternal ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button onClick={clearLogs} variant="destructive" size="sm" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Clear Stream
          </Button>
        </div>
      </div>

      {/* Global Analytics Data Source Selector */}
      <div className="mb-6 p-4 rounded-xl border bg-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        <div className="space-y-1">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary animate-pulse" />
            Global Analytics Data Source
          </h3>
          <p className="text-xs text-muted-foreground">
            Switching toggles whether the Session Replays, Visual Heatmaps, and Conversion Funnels tabs below query PostHog or Mixpanel APIs.
          </p>
        </div>
        <div className="flex bg-muted p-1 rounded-lg border w-fit shrink-0">
          <Button
            type="button"
            variant={analyticsSource === 'posthog' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setAnalyticsSource('posthog')}
            className="h-8 text-xs gap-1.5 px-3"
          >
            🦔 PostHog Data
          </Button>
          <Button
            type="button"
            variant={analyticsSource === 'mixpanel' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setAnalyticsSource('mixpanel')}
            className="h-8 text-xs gap-1.5 px-3"
          >
            👾 Mixpanel Data
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="shadow-sm border bg-gradient-to-br from-background to-muted/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Streamed Events
            </CardTitle>
            <Database className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">Logged in browser session</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border bg-gradient-to-br from-background to-muted/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active SDKs</CardTitle>
            <Sliders className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {activeCount}{' '}
              <span className="text-muted-foreground text-lg">/ {totalProvidersCount}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Simultaneous trackers firing</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border bg-gradient-to-br from-background to-muted/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Est. SDK Latency Impact
            </CardTitle>
            <Activity className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentLatency}ms</div>
            <p className="text-xs text-muted-foreground mt-1">Combined API call cost</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border bg-gradient-to-br from-background to-muted/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Anonymous Session ID
            </CardTitle>
            <Badge variant="outline" className="text-xs font-mono max-w-[150px] truncate">
              {userId}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono text-muted-foreground break-all mt-2 bg-muted p-1.5 rounded border">
              {userId || 'Loading...'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Grid: Providers */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        {/* Left 2 Cols: Toggles */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>SDK Integrations & Status</CardTitle>
              <CardDescription>
                Toggle analytics integrations on or off. Active providers process tracked events in parallel.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {providers.map((p) => {
                const isToggled = p.enabled;
                const specs = PROVIDER_BENCHMARKS[p.id];
                const hasKey = p.id === 'amplitude' ? isAmplitudeConfigured : 
                               p.id === 'posthog' ? !!process.env.NEXT_PUBLIC_POSTHOG_KEY :
                               p.id === 'mixpanel' ? !!process.env.NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN : false;

                return (
                  <div
                    key={p.id}
                    className="py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between first:pt-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base">{p.name}</span>
                        {isToggled ? (
                          hasKey ? (
                            <Badge
                              variant="secondary"
                              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 gap-1.5 py-0.5"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active Live API
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-800 hover:bg-amber-50 border-amber-200 gap-1.5 py-0.5"
                            >
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                              Simulated Mode (No API Key)
                            </Badge>
                          )
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Bundle Size:{' '}
                        <strong className="text-foreground">{specs?.bundleSizeKb} KB</strong> |
                        Latency:{' '}
                        <strong className="text-foreground">{specs?.averageLatencyMs}ms</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isToggled}
                          onChange={(e) => toggleProvider(p.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Interactive Event Simulator */}
        <Card className="border shadow-sm flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Event Simulator
            </CardTitle>
            <CardDescription>
              Dispatches a client-side analytics event to all active providers instantly.
            </CardDescription>
          </CardHeader>
          <form
            onSubmit={handleSimulateSubmit}
            className="flex-1 flex flex-col justify-between p-6 pt-0 space-y-4"
          >
            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <label
                  className="text-xs font-semibold text-muted-foreground uppercase"
                  htmlFor="simEventName"
                >
                  Event Name
                </label>
                <Input
                  id="simEventName"
                  value={simEventName}
                  onChange={(e) => setSimEventName(e.target.value)}
                  placeholder="e.g. button_click"
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-xs font-semibold text-muted-foreground uppercase"
                  htmlFor="simProps"
                >
                  Properties (JSON Object)
                </label>
                <textarea
                  id="simProps"
                  value={simProps}
                  onChange={(e) => setSimProps(e.target.value)}
                  rows={3}
                  className="w-full text-xs font-mono bg-muted p-2 rounded border focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              {simSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-3 py-2 rounded flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  Event Dispatched Successfully!
                </div>
              )}
              {simError && (
                <div className="bg-destructive/15 text-destructive text-xs px-3 py-2 rounded">
                  Error: {simError}
                </div>
              )}
              <Button type="submit" className="w-full gap-2">
                <Play className="h-4 w-4 fill-current" />
                Fire Test Event
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border space-x-4 mb-6 overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('stream')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'stream'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Activity className="h-4 w-4" />
            Live Event Stream ({logs.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('replays')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'replays'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            Session Replays
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('heatmaps')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'heatmaps'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <MousePointer className="h-4 w-4" />
            Visual Heatmaps
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('funnels')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'funnels'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Navigation className="h-4 w-4 rotate-45" />
            Conversion Funnels
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pricing')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'pricing'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Coins className="h-4 w-4" />
            Pricing Comparison
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('performance')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'performance'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Performance & Load
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('features')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'features'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Layers className="h-4 w-4" />
            Feature Matrix
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {/* API Credentials Simulation Mode Warning Banner */}
        {externalData && !externalData.isReal && (activeTab === 'replays' || activeTab === 'heatmaps' || activeTab === 'funnels') && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-lg text-xs flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              <span>
                <strong>Running in Simulation Mode for {analyticsSource === 'posthog' ? '🦔 PostHog' : '👾 Mixpanel'}.</strong> Add your server-side API keys to <code>.env.local</code> to fetch live event/recording streams.
              </span>
            </div>
            <a
              href={analyticsSource === 'posthog' ? 'https://us.posthog.com/' : 'https://mixpanel.com/'}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold underline text-amber-700 hover:text-amber-800 flex items-center gap-1 shrink-0"
            >
              Get Keys <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Stream Tab */}
        {activeTab === 'stream' && (
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle>Event Stream Feed</CardTitle>
              <CardDescription>
                Recent tracking signals processed. Events logged to Amplitude, PostHog, or Mixpanel show in their respective badges.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <h4 className="font-semibold text-lg">No events in the pipeline yet</h4>
                  <p className="text-sm mt-1 max-w-sm mx-auto">
                    Try navigating the blog, creating new posts, viewing posts, or firing the simulator to see events register here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {logs.map((log) => {
                    const isExpanded = expandedLogId === log._id;
                    const logDate = new Date(log.timestamp);
                    const formattedTime = logDate.toLocaleTimeString();
                    const formattedDate = logDate.toLocaleDateString();

                    return (
                      <div
                        key={log._id}
                        className="p-4 rounded-lg border bg-muted/40 hover:bg-muted/80 transition-all cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setExpandedLogId(isExpanded ? null : log._id);
                          }
                        }}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2.5">
                            <Badge
                              variant="default"
                              className="bg-primary text-primary-foreground font-semibold px-2 py-0.5"
                            >
                              {log.eventName}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px] sm:max-w-none">
                              ID: {log.userId}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {log.providers.includes('amplitude') && (
                              <Badge className="bg-amber-100 border-amber-200 text-amber-800 hover:bg-amber-100 text-[10px] uppercase font-bold tracking-wider py-0 px-1.5">
                                Amplitude
                              </Badge>
                            )}
                            {log.providers.includes('posthog') && (
                              <Badge className="bg-red-100 border-red-200 text-red-800 hover:bg-red-100 text-[10px] uppercase font-bold tracking-wider py-0 px-1.5">
                                PostHog
                              </Badge>
                            )}
                            {log.providers.includes('mixpanel') && (
                              <Badge className="bg-purple-100 border-purple-200 text-purple-800 hover:bg-purple-100 text-[10px] uppercase font-bold tracking-wider py-0 px-1.5">
                                Mixpanel
                              </Badge>
                            )}

                            <span className="text-xs text-muted-foreground whitespace-nowrap pl-2">
                              {formattedDate} {formattedTime}
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div
                            className="mt-4 bg-card p-4 rounded-lg border text-sm text-foreground space-y-4 overflow-x-auto shadow-inner"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="bg-primary/5 border border-primary/10 rounded-md p-3">
                              <span className="font-semibold text-xs text-primary uppercase tracking-wider block mb-1">
                                Event Description
                              </span>
                              <p className="font-semibold text-foreground text-sm">
                                {getEventSummary(log)}
                              </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 text-xs">
                              <div className="bg-muted/50 p-3 rounded border space-y-2">
                                <span className="font-bold text-muted-foreground block border-b pb-1">
                                  Navigation Details
                                </span>
                                <div className="font-mono space-y-1 text-foreground">
                                  <div>
                                    <strong className="text-muted-foreground">From:</strong>{' '}
                                    <span className="break-all">
                                      {log.properties.$referrer || 'Direct / Bookmark'}
                                    </span>
                                  </div>
                                  <div>
                                    <strong className="text-muted-foreground">To:</strong>{' '}
                                    <span className="break-all">
                                      {log.properties.$path || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-muted/50 p-3 rounded border space-y-2">
                                <span className="font-bold text-muted-foreground block border-b pb-1">
                                  Payload Attributes
                                </span>
                                <div className="font-mono space-y-1 text-foreground">
                                  <div>
                                    <strong className="text-muted-foreground">Viewport:</strong>{' '}
                                    {log.properties.$screen_width || 'unknown'} x{' '}
                                    {log.properties.$screen_height || 'unknown'} px
                                  </div>
                                  <div>
                                    <strong className="text-muted-foreground">Session ID:</strong>{' '}
                                    {log.userId}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex justify-between border-b pb-1">
                                <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                  Raw JSON Payload
                                </span>
                              </div>
                              <pre className="bg-muted/80 p-3 rounded border text-xs font-mono max-h-[220px] overflow-y-auto whitespace-pre-wrap">
                                {JSON.stringify(log.properties, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Session Replays Tab */}
        {activeTab === 'replays' && (
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
              <div>
                <CardTitle>Session Replay Hub ({analyticsSource === 'posthog' ? 'PostHog' : 'Mixpanel'})</CardTitle>
                <CardDescription>
                  Play back detailed session logs and events sourced directly from the active provider.
                </CardDescription>
              </div>
              {externalData?.isReal ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Live API Data</Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200">Simulation Data</Badge>
              )}
            </CardHeader>
            <CardContent>
              {loadingExternal ? (
                <div className="py-16 text-center text-muted-foreground space-y-3">
                  <RefreshCw className="h-10 w-10 animate-spin text-primary mx-auto" />
                  <p className="text-sm">Fetching recording streams...</p>
                </div>
              ) : !externalData || externalData.recordings.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <p>No session recording data available for {analyticsSource === 'posthog' ? 'PostHog' : 'Mixpanel'}.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground font-semibold">
                        <th className="pb-3">Session User ID</th>
                        <th className="pb-3">Country</th>
                        <th className="pb-3">Browser / Device</th>
                        <th className="pb-3">Duration</th>
                        <th className="pb-3 text-center">Activity Score</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {externalData.recordings.map((rec) => (
                        <tr key={rec.id} className="align-middle hover:bg-muted/20">
                          <td className="py-4 font-mono text-xs max-w-[120px] truncate">{rec.userId}</td>
                          <td className="py-4">
                            <span className="flex items-center gap-1.5">
                              <span className="text-base">
                                {rec.countryCode === 'US' ? '🇺🇸' : 
                                 rec.countryCode === 'BD' ? '🇧🇩' : 
                                 rec.countryCode === 'GB' ? '🇬🇧' : 
                                 rec.countryCode === 'CA' ? '🇨🇦' : 
                                 rec.countryCode === 'SG' ? '🇸🇬' : '🇩🇪'}
                              </span>
                              {rec.country}
                            </span>
                          </td>
                          <td className="py-4 text-xs">
                            <span className="flex items-center gap-2">
                              <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                              {rec.os} ({rec.browser})
                            </span>
                          </td>
                          <td className="py-4 text-xs font-mono">{rec.duration}s</td>
                          <td className="py-4">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-xs font-semibold">{rec.activityScore}%</span>
                              <div className="w-16 bg-muted h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    rec.activityScore > 80 ? 'bg-emerald-500' : rec.activityScore > 50 ? 'bg-indigo-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${rec.activityScore}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-right">
                            <Button onClick={() => handleOpenReplay(rec)} size="sm" className="gap-1.5 h-8">
                              <Play className="h-3 w-3 fill-current" />
                              {analyticsSource === 'posthog' && externalData.isReal ? 'Launch Player' : 'Simulate Replay'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Visual Heatmaps Tab */}
        {activeTab === 'heatmaps' && (
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-3 space-y-0">
              <div>
                <CardTitle>Visual Click Heatmaps ({analyticsSource === 'posthog' ? 'PostHog' : 'Mixpanel'})</CardTitle>
                <CardDescription>
                  Heatmap spots scaled by {analyticsSource === 'posthog' ? 'PostHog Autocaptured clicks' : 'Mixpanel event segmentation data'}.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setSelectedHeatmapPage('home')}
                  variant={selectedHeatmapPage === 'home' ? 'default' : 'outline'}
                  size="sm"
                >
                  Home Page
                </Button>
                <Button
                  onClick={() => setSelectedHeatmapPage('blog')}
                  variant={selectedHeatmapPage === 'blog' ? 'default' : 'outline'}
                  size="sm"
                >
                  Blog List
                </Button>
                <Button
                  onClick={() => setSelectedHeatmapPage('post')}
                  variant={selectedHeatmapPage === 'post' ? 'default' : 'outline'}
                  size="sm"
                >
                  Post View
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex justify-center">
              {/* Heatmap Preview Layout Mock */}
              <div className="relative border rounded-lg bg-card w-full max-w-4xl h-[450px] overflow-hidden shadow-inner flex flex-col">
                {/* Simulated Header */}
                <div className="border-b bg-muted/30 px-6 py-3.5 flex items-center justify-between">
                  <div className="font-bold text-sm text-primary flex items-center gap-1.5">
                    <Layers className="h-4.5 w-4.5 text-primary" />
                    BlogApp
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                    <span>Home</span>
                    <span>Blog</span>
                    <span>Analytics</span>
                  </div>
                  <Button size="sm" className="h-7 text-[10px]">Create Post</Button>
                </div>

                {/* Simulated Content Area depending on page */}
                <div className="flex-1 p-8 flex flex-col justify-center text-center relative overflow-hidden bg-gradient-to-br from-background to-muted/20">
                  {selectedHeatmapPage === 'home' && (
                    <div className="max-w-md mx-auto space-y-4">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">Active Source: {analyticsSource}</Badge>
                      <h2 className="text-2xl font-bold tracking-tight">Share Your Ideas with the World</h2>
                      <p className="text-xs text-muted-foreground">
                        A modern full-stack blog platform built with Next.js, MongoDB, and Tailwind CSS.
                      </p>
                      <div className="flex justify-center gap-3 pt-2">
                        <Button size="sm">Browse Posts</Button>
                        <Button variant="outline" size="sm">Write a Post</Button>
                      </div>
                    </div>
                  )}

                  {selectedHeatmapPage === 'blog' && (
                    <div className="w-full max-w-2xl mx-auto space-y-6">
                      <div className="flex justify-between items-center border-b pb-3">
                        <h2 className="text-xl font-bold text-left">Blog Posts</h2>
                        <Input className="max-w-xs h-8 text-xs" placeholder="Search posts..." />
                      </div>
                      <div className="grid gap-4 grid-cols-3 text-left">
                        {[1, 2, 3].map((id) => (
                          <div key={id} className="border bg-card p-3.5 rounded-lg space-y-2 shadow-sm">
                            <div className="h-10 bg-muted/60 rounded" />
                            <h4 className="font-bold text-xs line-clamp-1">Sample Blog Post {id}</h4>
                            <p className="text-[10px] text-muted-foreground line-clamp-2">This is a description of the post...</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedHeatmapPage === 'post' && (
                    <div className="w-full max-w-xl mx-auto text-left space-y-4">
                      <div className="text-[10px] text-muted-foreground">← Back to all posts</div>
                      <h2 className="text-2xl font-bold">Understanding Web Analytics in React</h2>
                      <div className="h-24 bg-muted/40 rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                        [Article Content Body Preview]
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Button size="sm" variant="outline">Edit Post</Button>
                        <Button size="sm" variant="destructive">Delete Post</Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Heatmap Hotspot Markers Overlay */}
                {externalData?.heatmaps[selectedHeatmapPage]?.map((point, index) => {
                  const color = point.intensity > 85 ? 'rgba(239, 68, 68, 0.75)' : 
                                point.intensity > 60 ? 'rgba(249, 115, 22, 0.75)' : 'rgba(99, 102, 241, 0.65)';
                  return (
                    <div
                      key={index}
                      className="absolute group z-10 cursor-help flex items-center justify-center rounded-full animate-pulse transition-all hover:scale-125"
                      style={{
                        left: `${point.x}%`,
                        top: `${point.y}%`,
                        width: `${Math.max(point.intensity / 2, 18)}px`,
                        height: `${Math.max(point.intensity / 2, 18)}px`,
                        backgroundColor: color,
                        boxShadow: `0 0 12px ${color}`,
                      }}
                    >
                      {/* Glower Core */}
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />

                      {/* Tooltip */}
                      <div className="hidden group-hover:block absolute bottom-full mb-2 bg-popover text-popover-foreground border text-[10px] font-semibold py-1.5 px-2.5 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                        <span className="font-bold text-foreground block">{point.element}</span>
                        <span>Click Density: {point.intensity}%</span>
                        <span className="text-[9px] text-muted-foreground block border-t mt-1 pt-0.5">Sourced: {analyticsSource}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Funnels Tab */}
        {activeTab === 'funnels' && (
          <Card className="border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
              <div>
                <CardTitle>Conversion Funnel ({analyticsSource === 'posthog' ? 'PostHog' : 'Mixpanel'})</CardTitle>
                <CardDescription>
                  Conversion metrics calculated from the active data source flow.
                </CardDescription>
              </div>
              {externalData?.isReal ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Live API Data</Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200">Simulation Data</Badge>
              )}
            </CardHeader>
            <CardContent>
              {loadingExternal ? (
                <div className="py-16 text-center text-muted-foreground">
                  <RefreshCw className="h-10 w-10 animate-spin text-primary mx-auto mb-2" />
                  <p className="text-sm">Calculating conversions...</p>
                </div>
              ) : !externalData || externalData.funnel.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <p>No funnel data available.</p>
                </div>
              ) : (
                <div className="space-y-8 max-w-3xl mx-auto py-4">
                  {/* Summary Metric */}
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-5 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-indigo-900">Overall Funnel Conversion ({analyticsSource})</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Landing page to successfully published post</p>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-extrabold text-indigo-700">
                        {externalData.funnel[externalData.funnel.length - 1].percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Funnel Graph Steps */}
                  <div className="space-y-4">
                    {externalData.funnel.map((step, idx) => (
                      <div key={idx} className="relative">
                        <div className="flex items-center justify-between mb-1.5 text-xs font-semibold">
                          <span className="text-foreground">{step.name}</span>
                          <span className="font-mono text-muted-foreground">
                            {step.count} users ({step.percentage}%)
                          </span>
                        </div>

                        {/* Progress Bar Container */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-muted h-6 rounded overflow-hidden relative border shadow-inner">
                            <div
                              className="h-full bg-indigo-500/85 transition-all duration-700"
                              style={{ width: `${step.percentage}%` }}
                            />
                            <span className="absolute inset-y-0 left-2.5 flex items-center text-[10px] text-indigo-950 font-bold drop-shadow">
                              {step.percentage}% Conversion
                            </span>
                          </div>

                          {/* Dropoff Indicator */}
                          {idx > 0 && (
                            <div className="w-24 text-right">
                              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] gap-1 py-0.5">
                                ▼ {step.dropoff}% Drop
                              </Badge>
                            </div>
                          )}
                          {idx === 0 && <div className="w-24" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Pricing Comparison</CardTitle>
              <CardDescription>
                Compare the monthly cost and limitations of the three primary analytics frameworks.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 font-semibold text-sm">Provider</th>
                    <th className="pb-3 font-semibold text-sm">Free Tier Limit</th>
                    <th className="pb-3 font-semibold text-sm">Starting Pricing</th>
                    <th className="pb-3 font-semibold text-sm">Billing Metric</th>
                    <th className="pb-3 font-semibold text-sm">Pros</th>
                    <th className="pb-3 font-semibold text-sm">Cons</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {Object.values(PROVIDER_BENCHMARKS)
                    .filter((p) => p.id !== 'localDb')
                    .map((p) => (
                      <tr key={p.id} className="align-top py-4">
                        <td className="py-4 font-bold text-base flex items-center gap-1.5">
                          {p.name}
                          <a
                            href={
                              p.id === 'amplitude'
                                ? 'https://amplitude.com/pricing'
                                : p.id === 'posthog'
                                  ? 'https://posthog.com/pricing'
                                  : 'https://mixpanel.com/pricing'
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-primary"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </td>
                        <td className="py-4 text-emerald-600 font-semibold">{p.freeTierLimit}</td>
                        <td className="py-4 font-mono">{p.startingPrice}</td>
                        <td className="py-4 text-muted-foreground">{p.billingMetric}</td>
                        <td className="py-4 max-w-[220px]">
                          <ul className="list-disc pl-4 space-y-1 text-xs">
                            {p.pros.map((pro, i) => (
                              <li key={i}>{pro}</li>
                            ))}
                          </ul>
                        </td>
                        <td className="py-4 max-w-[220px]">
                          <ul className="list-disc pl-4 space-y-1 text-xs text-muted-foreground">
                            {p.cons.map((con, i) => (
                              <li key={i}>{con}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-xs text-indigo-800 flex items-start gap-2.5">
                <Info className="h-4.5 w-4.5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold mb-1">Choosing the right provider:</h5>
                  <p className="leading-relaxed">
                    If your budget is tight, <strong>PostHog</strong> offers the most generous plan including recordings and autocapture. If you need deep data modeling and cohort tracking for product management meetings, <strong>Amplitude</strong> remains the industry standard. For clean reports and developer ergonomics, <strong>Mixpanel</strong> is highly optimized.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>SDK Bundle Weight & Load Impact</CardTitle>
              <CardDescription>
                Compare browser performance overhead (gzip weight in KB and API latency). Lower is better.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  SDK Bundle Weight (KB - Gzipped)
                </h4>
                <div className="space-y-3">
                  {Object.values(PROVIDER_BENCHMARKS)
                    .filter((p) => p.id !== 'localDb')
                    .map((p) => {
                      const maxVal = 50;
                      const pct = Math.min((p.bundleSizeKb / maxVal) * 100, 100);
                      return (
                        <div key={p.id} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>{p.name}</span>
                            <span className="font-mono text-muted-foreground">{p.bundleSizeKb} KB</span>
                          </div>
                          <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className={`h-full rounded-full transition-all duration-500 ${
                                p.id === 'amplitude' ? 'bg-amber-500' : p.id === 'posthog' ? 'bg-red-500' : 'bg-purple-500'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Note: PostHog has a heavier bundle size because it includes session replay script tracking and auto-capture features.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  Average API Network Dispatch Latency (ms)
                </h4>
                <div className="space-y-3">
                  {Object.values(PROVIDER_BENCHMARKS).map((p) => {
                    const maxVal = 100;
                    const pct = Math.min((p.averageLatencyMs / maxVal) * 100, 100);
                    return (
                      <div key={p.id} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{p.name}</span>
                          <span className="font-mono text-muted-foreground">{p.averageLatencyMs} ms</span>
                        </div>
                        <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${
                              p.id === 'amplitude'
                                ? 'bg-amber-500'
                                : p.id === 'posthog'
                                  ? 'bg-red-500'
                                  : p.id === 'mixpanel'
                                    ? 'bg-purple-500'
                                    : 'bg-blue-500'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Matrix Tab */}
        {activeTab === 'features' && (
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle>Feature Support Matrix</CardTitle>
              <CardDescription>
                Quick checklist of capabilities built-in for Amplitude, PostHog, and Mixpanel.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 font-semibold">Analytics Feature</th>
                    <th className="pb-3 font-semibold text-center">Amplitude</th>
                    <th className="pb-3 font-semibold text-center">PostHog</th>
                    <th className="pb-3 font-semibold text-center">Mixpanel</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {[
                    { label: 'Funnel Analysis', keys: ['funnels', 'funnels', 'funnels'] },
                    { label: 'Session Replay / Video Record', keys: ['sessionReplay', 'sessionReplay', 'sessionReplay'] },
                    { label: 'Heatmaps', keys: ['heatmaps', 'heatmaps', 'heatmaps'] },
                    { label: 'Feature Flags', keys: ['featureFlags', 'featureFlags', 'featureFlags'] },
                    { label: 'Native A/B Testing', keys: ['abTesting', 'abTesting', 'abTesting'] },
                    { label: 'Cohort Segmentations', keys: ['cohorts', 'cohorts', 'cohorts'] },
                  ].map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="py-3.5 font-medium">{row.label}</td>
                      <td className="py-3.5 text-center">
                        {PROVIDER_BENCHMARKS.amplitude.features[
                          row.keys[0] as keyof typeof PROVIDER_BENCHMARKS.amplitude.features
                        ] ? (
                          <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                        ) : (
                          <Minus className="h-4.5 w-4.5 text-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                      <td className="py-3.5 text-center">
                        {PROVIDER_BENCHMARKS.posthog.features[
                          row.keys[1] as keyof typeof PROVIDER_BENCHMARKS.posthog.features
                        ] ? (
                          <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                        ) : (
                          <Minus className="h-4.5 w-4.5 text-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                      <td className="py-3.5 text-center">
                        {PROVIDER_BENCHMARKS.mixpanel.features[
                          row.keys[2] as keyof typeof PROVIDER_BENCHMARKS.mixpanel.features
                        ] ? (
                          <Check className="h-5 w-5 text-emerald-500 mx-auto" />
                        ) : (
                          <Minus className="h-4.5 w-4.5 text-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Session Replay Player Modal */}
      {selectedRecording && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col border shadow-2xl overflow-hidden bg-card">
            <CardHeader className="border-b bg-muted/40 pb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Session Player: {selectedRecording.id}
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedRecording.country} • {selectedRecording.browser} on {selectedRecording.os} • Started {new Date(selectedRecording.startTime).toLocaleTimeString()}
                </CardDescription>
              </div>
              <Button onClick={handleCloseReplay} variant="ghost" size="sm" className="h-8 font-bold">
                ✕ Close
              </Button>
            </CardHeader>

            <CardContent className="p-0 flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x overflow-hidden">
              {/* Left Column: Player Viewport */}
              <div className="flex-1 p-6 bg-muted/20 flex flex-col justify-between items-center relative min-h-[300px]">
                {analyticsSource === 'posthog' && externalData?.isReal ? (
                  // Embed Real PostHog Iframe
                  <div className="w-full h-full min-h-[350px] bg-black rounded border flex items-center justify-center">
                    <iframe
                      src={`https://us.posthog.com/embedded/${selectedRecording.id}`}
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      allowFullScreen
                      title="PostHog Session Replay"
                    />
                  </div>
                ) : (
                  // Simulated Canvas Replay Player (For Mixpanel or PostHog Simulation)
                  <div className="w-full flex-1 flex flex-col items-center justify-center relative">
                    <div
                      className="border rounded-lg bg-card shadow-lg w-full max-w-2xl aspect-video overflow-hidden relative flex flex-col"
                      style={{
                        transform: 'scale(1)',
                        transition: 'transform 0.2s',
                      }}
                    >
                      {/* Browser Mockbar */}
                      <div className="bg-muted px-4 py-2 border-b flex items-center gap-2.5">
                        <div className="flex gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        </div>
                        <div className="flex-1 bg-background text-[10px] text-muted-foreground border rounded px-3 py-0.5 text-center font-mono truncate max-w-sm mx-auto shadow-inner">
                          http://localhost:3000/
                        </div>
                      </div>

                      {/* Browser Viewport Frame */}
                      <div
                        className="flex-1 p-6 relative overflow-y-auto transition-all duration-300"
                        style={{
                          transform: `translateY(-${getLatestScrollTop() / 4}px)`,
                        }}
                      >
                        {/* Mock Homepage Structure inside Replay */}
                        <div className="text-center py-6 space-y-3.5">
                          <div className="mx-auto bg-primary/10 rounded-full w-10 h-10 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-primary" />
                          </div>
                          <h3 className="font-bold text-lg">Welcome to BlogApp</h3>
                          <p className="text-[10px] text-muted-foreground max-w-xs mx-auto">
                            A modern full-stack blog platform built with Next.js, MongoDB, and Tailwind CSS.
                          </p>
                          <div className="flex justify-center gap-2 pt-2">
                            <button
                              id="Browse Posts Button"
                              type="button"
                              className={`text-[9px] px-3 py-1.5 rounded transition-all duration-200 ${
                                getActiveTimelineEvents().some(
                                  (e) => e.type === 'click' && e.target === 'Browse Posts Button'
                                )
                                  ? 'bg-indigo-600 text-white scale-95 ring-2 ring-indigo-400'
                                  : 'bg-primary text-primary-foreground'
                              }`}
                            >
                              Browse Posts
                            </button>
                            <button
                              id="Write a Post Button"
                              type="button"
                              className="bg-outline border text-[9px] px-3 py-1.5 rounded"
                            >
                              Write a Post
                            </button>
                          </div>
                        </div>

                        {/* Extra padding for scroll demonstration */}
                        <div className="h-40" />

                        <div className="border-t pt-4 text-center">
                          <h4 className="font-bold text-xs text-muted-foreground">Featured Sections</h4>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="border bg-muted/30 p-2.5 rounded text-[9px] text-left">
                              <strong>Create Posts</strong>
                              <p className="text-[8px] text-muted-foreground mt-0.5">Write and publish blog posts easily.</p>
                            </div>
                            <div className="border bg-muted/30 p-2.5 rounded text-[9px] text-left">
                              <strong>Read & Discover</strong>
                              <p className="text-[8px] text-muted-foreground mt-0.5">Browse content by topics.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mock mouse cursor */}
                      <div
                        className="absolute z-20 pointer-events-none transition-all duration-700 ease-out"
                        style={{
                          left: `${getLatestCursorPosition().x}%`,
                          top: `${getLatestCursorPosition().y}%`,
                        }}
                      >
                        <div
                          className={`rounded-full flex items-center justify-center ${
                            getActiveTimelineEvents().length > 0 &&
                            getActiveTimelineEvents()[getActiveTimelineEvents().length - 1].type === 'click' &&
                            playbackTime -
                              (getActiveTimelineEvents()[getActiveTimelineEvents().length - 1].time || 0) <
                              1.5
                              ? 'bg-rose-500/30 w-8 h-8 -ml-4 -mt-4 animate-ping'
                              : 'w-4 h-4'
                          }`}
                        >
                          <MousePointer className="h-4.5 w-4.5 text-rose-500 fill-rose-500 drop-shadow" />
                        </div>
                      </div>
                    </div>

                    {/* Timeline Controls */}
                    <div className="w-full mt-4 flex items-center gap-3 bg-card border rounded-lg p-3.5 shadow-sm">
                      <Button
                        onClick={() => setIsPlaying(!isPlaying)}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-primary border-primary/20 shrink-0"
                      >
                        {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                      </Button>

                      {/* Progress slider bar */}
                      <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden relative cursor-pointer">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${(playbackTime / selectedRecording.duration) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {playbackTime}s / {selectedRecording.duration}s
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Event Actions Log */}
              <div className="w-full md:w-80 p-6 flex flex-col h-[450px] overflow-hidden bg-card">
                <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-3">
                  Playback Actions Log ({analyticsSource})
                </h4>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                  {getActiveTimelineEvents().map((evt, idx) => (
                    <div key={idx} className="p-2.5 rounded border bg-muted/30 font-mono space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span className="font-bold text-primary uppercase">
                          {evt.type === 'click' ? '🖱️ Click' : evt.type === 'scroll' ? '📜 Scroll' : '📍 Move'}
                        </span>
                        <span>{evt.time}s</span>
                      </div>
                      <p className="text-xs font-semibold text-foreground line-clamp-2">
                        {evt.type === 'click'
                          ? `Clicked "${evt.target}" at (${evt.x}%, ${evt.y}%)`
                          : evt.type === 'scroll'
                            ? `Scrolled page frame to ${evt.scrollTop}px`
                            : `Moved mouse coordinates to (${evt.x}%, ${evt.y}%)`}
                      </p>
                    </div>
                  ))}
                  {getActiveTimelineEvents().length === 0 && (
                    <div className="py-8 text-center text-muted-foreground italic">
                      No actions recorded yet. Press play to start.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
