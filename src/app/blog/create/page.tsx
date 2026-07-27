import { BlogForm } from '@/components/blog-form';

export const metadata = {
  title: 'Create New Post - BlogApp',
};

export default function CreatePostPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <BlogForm mode="create" />
    </div>
  );
}
