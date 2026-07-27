'use client';

import { Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { IBlogPost } from '@/models/BlogPost';

interface BlogFormProps {
  initialData?: IBlogPost;
  mode: 'create' | 'edit';
}

import { useAnalytics } from '@/lib/analytics/AnalyticsContext';

export function BlogForm({ initialData, mode }: BlogFormProps) {
  const router = useRouter();
  const { trackEvent } = useAnalytics();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    excerpt: initialData?.excerpt || '',
    coverImage: initialData?.coverImage || '',
    author: initialData?.author || '',
    tags: initialData?.tags.join(', ') || '',
    published: initialData?.published || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = mode === 'create' ? '/api/posts' : `/api/posts/${initialData?._id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save post');
      }

      // Track the save action
      if (mode === 'create') {
        trackEvent('Blog Post Created', {
          title: formData.title,
          author: formData.author,
          tagsCount: tagsArray.length,
          tags: tagsArray,
          contentWordCount: formData.content.split(/\s+/).filter(Boolean).length,
          hasCoverImage: !!formData.coverImage,
        });
      } else {
        trackEvent('Blog Post Edited', {
          postId: initialData?._id,
          title: formData.title,
          author: formData.author,
          tagsCount: tagsArray.length,
          tags: tagsArray,
          contentWordCount: formData.content.split(/\s+/).filter(Boolean).length,
          hasCoverImage: !!formData.coverImage,
        });
      }

      router.push('/blog');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create New Post' : 'Edit Post'}</CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Fill in the details below to create a new blog post.'
            : 'Update the details of your blog post.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter post title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt *</Label>
            <Textarea
              id="excerpt"
              placeholder="Brief description of your post"
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={2}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder="Write your blog post content here..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={12}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author *</Label>
            <Input
              id="author"
              placeholder="Author name"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverImage">Cover Image URL</Label>
            <Input
              id="coverImage"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={formData.coverImage}
              onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              placeholder="javascript, react, nextjs"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="published"
              checked={formData.published}
              onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="published">Publish immediately</Label>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : mode === 'create' ? 'Create Post' : 'Update Post'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
