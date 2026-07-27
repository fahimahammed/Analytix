'use client';

import { Activity, BookOpen, Home, PenSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/lib/analytics/AnalyticsContext';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const { trackEvent } = useAnalytics();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/blog', label: 'Blog', icon: BookOpen },
    { href: '/analytics', label: 'Analytics', icon: Activity },
  ];

  const handleNavClick = (label: string, href: string) => {
    trackEvent('Navigation Link Clicked', {
      link_label: label,
      destination_url: href,
      source_url: pathname,
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center space-x-2"
          onClick={() => handleNavClick('Logo', '/')}
        >
          <PenSquare className="h-6 w-6" />
          <span className="font-bold text-lg">BlogApp</span>
        </Link>

        <nav className="flex items-center gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary',
                  pathname === item.href ? 'text-primary' : 'text-muted-foreground',
                )}
                onClick={() => handleNavClick(item.label, item.href)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <Link href="/blog/create" onClick={() => handleNavClick('New Post', '/blog/create')}>
            <Button size="sm">New Post</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
