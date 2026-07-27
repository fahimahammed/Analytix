import { BookOpen, PenSquare, Rocket } from 'lucide-react';
import Link from 'next/link';
import { TrackPageView } from '@/components/analytics/TrackPageView';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col">
      <TrackPageView pageName="Home" />
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Rocket className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Welcome to <span className="text-primary">BlogApp</span>
          </h1>
          <p className="mx-auto max-w-[600px] text-lg text-muted-foreground md:text-xl">
            A modern full-stack blog platform built with Next.js, MongoDB, and Tailwind CSS. Share
            your ideas with the world.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/blog">
              <Button size="lg" className="gap-2">
                <BookOpen className="h-5 w-5" />
                Browse Posts
              </Button>
            </Link>
            <Link href="/blog/create">
              <Button size="lg" variant="outline" className="gap-2">
                <PenSquare className="h-5 w-5" />
                Write a Post
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <div className="mb-4 rounded-full bg-primary/10 p-2 w-fit">
              <PenSquare className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Create Posts</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Write and publish blog posts with rich content, tags, and author information.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <div className="mb-4 rounded-full bg-primary/10 p-2 w-fit">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Read & Discover</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Browse through articles, search by topics, and discover new content.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
            <div className="mb-4 rounded-full bg-primary/10 p-2 w-fit">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-lg">Fast & Modern</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Built with the latest technologies for optimal performance and developer experience.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
