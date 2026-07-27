import { format } from 'date-fns';
import { ArrowLeft, CalendarDays, Pencil, Trash2, User } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { connectToDatabase } from '@/lib/mongodb';
import type { IBlogPost } from '@/models/BlogPost';
import BlogPost from '@/models/BlogPost';

interface BlogPostPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { id } = await params;

  let post: IBlogPost | null = null;

  try {
    await connectToDatabase();
    const rawPost = (await BlogPost.findById(id).lean()) as (IBlogPost & { _id: unknown }) | null;
    if (rawPost) {
      post = {
        ...rawPost,
        _id: String(rawPost._id),
      };
    }
  } catch (e) {
    console.error('Error fetching post:', e);
  }

  if (!post) {
    notFound();
  }

  return (
    <article className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link href="/blog">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to all posts
            </Button>
          </Link>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {post.author}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {format(new Date(post.createdAt), 'MMMM d, yyyy')}
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight mb-4">{post.title}</h1>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <p className="text-lg text-muted-foreground italic">{post.excerpt}</p>
        </div>

        {post.coverImage && (
          <div className="mb-8">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full rounded-lg object-cover shadow-lg"
              style={{ maxHeight: '400px' }}
            />
          </div>
        )}

        <div className="prose prose-lg max-w-none">
          <div className="whitespace-pre-wrap text-foreground leading-relaxed">{post.content}</div>
        </div>

        <div className="mt-8 pt-8 border-t flex gap-4">
          <Link href={`/blog/${post._id}/edit`}>
            <Button variant="outline" className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit Post
            </Button>
          </Link>
          <form
            action={async () => {
              'use server';
              await connectToDatabase();
              await BlogPost.findByIdAndDelete(post?._id);
            }}
          >
            <Button type="submit" variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete Post
            </Button>
          </form>
        </div>
      </div>
    </article>
  );
}
