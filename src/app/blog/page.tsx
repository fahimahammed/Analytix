import { PenSquare } from 'lucide-react';
import { BlogCard } from '@/components/blog-card';
import { connectToDatabase } from '@/lib/mongodb';
import type { IBlogPost } from '@/models/BlogPost';
import BlogPost from '@/models/BlogPost';

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  let posts: IBlogPost[] = [];
  let error = null;

  try {
    await connectToDatabase();
    const rawPosts = await BlogPost.find({}).sort({ createdAt: -1 }).lean();
    posts = rawPosts.map((post) => {
      const { _id, ...rest } = post;
      return { ...rest, _id: String(_id) } as unknown as IBlogPost;
    });
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to connect to database';
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Blog Posts</h1>
        <p className="text-muted-foreground mt-2">Read the latest articles and tutorials</p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center">
          <p className="text-destructive font-medium">Unable to connect to database</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please make sure MongoDB is running and the MONGODB_URI environment variable is set.
          </p>
          <p className="text-sm text-muted-foreground mt-1 font-mono">Error: {error}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto mb-4 rounded-full bg-muted p-4 w-fit">
            <PenSquare className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No posts yet</h3>
          <p className="text-muted-foreground mt-2">
            Get started by creating your first blog post.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post._id.toString()} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
