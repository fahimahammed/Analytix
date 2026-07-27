'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAnalytics } from '@/lib/analytics/AnalyticsContext';

interface DeletePostButtonProps {
  postId: string;
  postTitle: string;
  postAuthor: string;
}

export function DeletePostButton({ postId, postTitle, postAuthor }: DeletePostButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { trackEvent } = useAnalytics();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    setLoading(true);

    // Log the event BEFORE deleting
    trackEvent('Blog Post Deleted', {
      postId,
      title: postTitle,
      author: postAuthor,
    });

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      router.push('/blog');
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred while deleting');
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="destructive"
      className="gap-2"
      disabled={loading}
      onClick={handleDelete}
    >
      <Trash2 className="h-4 w-4" />
      {loading ? 'Deleting...' : 'Delete Post'}
    </Button>
  );
}
