'use client';

import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { analyticsManager } from './manager';
import type { AnalyticsProvider as IAnalyticsProvider } from './types';

export interface ClientLog {
  _id: string;
  eventName: string;
  properties: Record<string, any>;
  providers: string[];
  userId: string;
  timestamp: string;
}

interface AnalyticsContextType {
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  identifyUser: (userId: string, traits?: Record<string, any>) => void;
  providers: IAnalyticsProvider[];
  toggleProvider: (id: string, enabled: boolean) => void;
  userId: string;
  logs: ClientLog[];
  clearLogs: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [providers, setProviders] = useState<IAnalyticsProvider[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [logs, setLogs] = useState<ClientLog[]>([]);

  useEffect(() => {
    if (analyticsManager) {
      // Initialize all enabled providers
      analyticsManager.initAll();
      setProviders([...analyticsManager.getProviders()]);
      setUserId(analyticsManager.getUserId());

      // Load logs from localStorage
      const savedLogs = localStorage.getItem('analytics_client_logs');
      if (savedLogs) {
        try {
          setLogs(JSON.parse(savedLogs));
        } catch (e) {
          console.error('Failed to parse saved analytics logs', e);
        }
      }
    }
  }, []);

  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    if (analyticsManager) {
      analyticsManager.track(eventName, properties);

      // Append log entry client-side
      const activeProviders = analyticsManager
        .getProviders()
        .filter((p) => p.enabled && p.initialized)
        .map((p) => p.id);

      const baseProperties = {
        $screen_width: window.innerWidth,
        $screen_height: window.innerHeight,
        $url: window.location.href,
        $path: window.location.pathname,
        $referrer: document.referrer || 'direct',
        ...properties,
      };

      const newLog: ClientLog = {
        _id: Math.random().toString(36).substring(2, 15),
        eventName,
        properties: baseProperties,
        providers: activeProviders,
        userId: analyticsManager.getUserId(),
        timestamp: new Date().toISOString(),
      };

      setLogs((prev) => {
        const updated = [newLog, ...prev].slice(0, 100);
        localStorage.setItem('analytics_client_logs', JSON.stringify(updated));
        return updated;
      });
    }
  }, []);

  const identifyUser = useCallback((id: string, traits?: Record<string, any>) => {
    if (analyticsManager) {
      analyticsManager.identify(id, traits);
      setUserId(id);
    }
  }, []);

  const toggleProvider = useCallback((id: string, enabled: boolean) => {
    if (analyticsManager) {
      analyticsManager.toggleProvider(id, enabled);
      // Force React state update
      setProviders([...analyticsManager.getProviders()]);
    }
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem('analytics_client_logs');
  }, []);

  return (
    <AnalyticsContext.Provider
      value={{
        trackEvent,
        identifyUser,
        providers,
        toggleProvider,
        userId,
        logs,
        clearLogs,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}
