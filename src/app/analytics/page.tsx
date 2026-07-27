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
  Info,
  Layers,
  Minus,
  Play,
  RefreshCw,
  Sliders,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { type ClientLog, useAnalytics } from '@/lib/analytics/AnalyticsContext';
import { PROVIDER_BENCHMARKS } from '@/lib/analytics/types';

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

  const [activeTab, setActiveTab] = useState<'stream' | 'pricing' | 'performance' | 'features'>(
    'stream',
  );
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Provider filter state
  const [providerFilter, setProviderFilter] = useState<'all' | 'amplitude' | 'posthog' | 'mixpanel'>('all');

  // Simulator state
  const [simEventName, setSimEventName] = useState('button_click');
  const [simProps, setSimProps] = useState(
    '{\n  "button_name": "try_for_free",\n  "section": "hero",\n  "theme": "dark"\n}',
  );
  const [simSuccess, setSimSuccess] = useState(false);
  const [simError, setSimError] = useState('');

  // Amplitude API Key presence
  const isAmplitudeConfigured = !!process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;

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

  // Filter logs by selected provider
  const filteredLogs = logs.filter((log) => {
    if (providerFilter === 'all') return true;
    return log.providers.includes(providerFilter);
  });

  // Stats calculation
  const totalEvents = filteredLogs.length;
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
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border-primary/20 gap-1"
            >
              <Sparkles className="h-3 w-3" />
              v2.1 Observability
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2">
            Compare metrics, analyze bundle size, compare pricing, and track feature matrix in
            real-time.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border text-xs shadow-sm">
            <span className="text-muted-foreground px-2 font-medium">Filter SDK:</span>
            <button
              type="button"
              onClick={() => setProviderFilter('all')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                providerFilter === 'all'
                  ? 'bg-card text-foreground shadow-sm border border-border/40'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setProviderFilter('amplitude')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                providerFilter === 'amplitude'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-amber-600'
              }`}
            >
              Amplitude
            </button>
            <button
              type="button"
              onClick={() => setProviderFilter('posthog')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                providerFilter === 'posthog'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-red-500'
              }`}
            >
              PostHog
            </button>
            <button
              type="button"
              onClick={() => setProviderFilter('mixpanel')}
              className={`px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                providerFilter === 'mixpanel'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-purple-600'
              }`}
            >
              Mixpanel
            </button>
          </div>
          <Button onClick={clearLogs} variant="destructive" size="sm" className="gap-2">
            <Trash2 className="h-4 w-4" />
            Clear Stream
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
                Toggle analytics integrations on or off. Active providers process tracked events in
                parallel.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {providers.map((p) => {
                const isToggled = p.enabled;
                const specs = PROVIDER_BENCHMARKS[p.id];
                const hasKey =
                  p.id === 'amplitude'
                    ? isAmplitudeConfigured
                    : p.id === 'posthog'
                      ? !!process.env.NEXT_PUBLIC_POSTHOG_KEY
                      : p.id === 'mixpanel'
                        ? !!process.env.NEXT_PUBLIC_MIXPANEL_PROJECT_TOKEN
                        : false;

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
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'stream'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Activity className="h-4 w-4" />
            Live Event Stream ({filteredLogs.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pricing')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
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
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
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
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
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
        {/* Stream Tab */}
        {activeTab === 'stream' && (
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle>Event Stream Feed</CardTitle>
              <CardDescription>
                Recent tracking signals processed. Events logged to Amplitude, PostHog, or Mixpanel
                show in their respective badges.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredLogs.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground">
                  <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <h4 className="font-semibold text-lg">No matching events in the pipeline</h4>
                  <p className="text-sm mt-1 max-w-sm mx-auto">
                    {providerFilter === 'all'
                      ? 'Try navigating the blog, creating new posts, viewing posts, or firing the simulator to see events register here.'
                      : `Try performing actions while the ${providerFilter} SDK integration is active.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {filteredLogs.map((log) => {
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
                    If your budget is tight, <strong>PostHog</strong> offers the most generous plan
                    including recordings and autocapture. If you need deep data modeling and cohort
                    tracking for product management meetings, <strong>Amplitude</strong> remains the
                    industry standard. For clean reports and developer ergonomics,{' '}
                    <strong>Mixpanel</strong> is highly optimized.
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
                Compare browser performance overhead (gzip weight in KB and API latency). Lower is
                better.
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
                            <span className="font-mono text-muted-foreground">
                              {p.bundleSizeKb} KB
                            </span>
                          </div>
                          <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${pct}%` }}
                              className={`h-full rounded-full transition-all duration-500 ${
                                p.id === 'amplitude'
                                  ? 'bg-amber-500'
                                  : p.id === 'posthog'
                                    ? 'bg-red-500'
                                    : 'bg-purple-500'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Note: PostHog has a heavier bundle size because it includes session replay script
                  tracking and auto-capture features.
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
                          <span className="font-mono text-muted-foreground">
                            {p.averageLatencyMs} ms
                          </span>
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
                    {
                      label: 'Session Replay / Video Record',
                      keys: ['sessionReplay', 'sessionReplay', 'sessionReplay'],
                    },
                    { label: 'Heatmaps', keys: ['heatmaps', 'heatmaps', 'heatmaps'] },
                    {
                      label: 'Feature Flags',
                      keys: ['featureFlags', 'featureFlags', 'featureFlags'],
                    },
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
    </div>
  );
}
