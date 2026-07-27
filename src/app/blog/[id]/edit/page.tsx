import { notFound } from 'next/navigation';
import { BlogForm } from '@/components/blog-form';
import { connectToDatabase } from '@/lib/mongodb';
import type { IBlogPost } from '@/models/BlogPost';
import BlogPost from '@/models/BlogPost';

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'Edit Post - BlogApp',
};

export const dynamic = 'force-dynamic';

export default async function EditPostPage({ params }: EditPostPageProps) {
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
    <div className="container mx-auto px-4 py-8">
      <BlogForm initialData={post} mode="edit" />
    </div>
  );
}
