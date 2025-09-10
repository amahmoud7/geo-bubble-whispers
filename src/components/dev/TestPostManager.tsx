import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Clock, RefreshCw, Trash2, Plus, Eye } from 'lucide-react';

interface TestPost {
  id: string;
  content: string;
  location: string;
  created_at: string;
  expires_at: string;
  lat: number;
  lng: number;
  is_public: boolean;
}

const TestPostManager: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<TestPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [showManager, setShowManager] = useState(false);

  const fetchTestPosts = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get all user posts from last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, location, created_at, expires_at, lat, lng, is_public, user_id')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo)
        .or('message_type.is.null,message_type.neq.event')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPosts(data || []);
      console.log(`📊 Found ${data?.length || 0} test posts`);
    } catch (error: any) {
      console.error('Error fetching test posts:', error);
      toast({
        title: 'Error fetching posts',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const extendPostExpiration = async (postId: string) => {
    try {
      const newExpiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('messages')
        .update({ expires_at: newExpiration })
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: 'Post extended',
        description: 'Post expiration extended by 7 days',
      });
      
      fetchTestPosts();
    } catch (error: any) {
      console.error('Error extending post:', error);
      toast({
        title: 'Error extending post',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const extendAllPosts = async () => {
    try {
      const newExpiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('messages')
        .update({ expires_at: newExpiration })
        .eq('user_id', user?.id)
        .or('message_type.is.null,message_type.neq.event');

      if (error) throw error;

      toast({
        title: 'All posts extended! 🎉',
        description: `Extended ${posts.length} posts by 7 days`,
      });
      
      fetchTestPosts();
    } catch (error: any) {
      console.error('Error extending posts:', error);
      toast({
        title: 'Error extending posts',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      toast({
        title: 'Post deleted',
        description: 'Test post has been removed',
      });
      
      fetchTestPosts();
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast({
        title: 'Error deleting post',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    if (user && showManager) {
      fetchTestPosts();
    }
  }, [user, showManager]);

  // Only show in development or if user has made posts
  if (process.env.NODE_ENV === 'production' && posts.length === 0) {
    return null;
  }

  if (!showManager) {
    return (
      <button
        onClick={() => setShowManager(true)}
        className="fixed bottom-4 left-4 z-40 glass px-4 py-2 rounded-full text-white text-sm hover:bg-white/20 transition-all"
        title="Manage Test Posts"
      >
        <Eye className="w-4 h-4 inline mr-2" />
        Posts ({posts.length})
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 glass-card w-80 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between p-3 border-b border-white/20">
        <h3 className="text-white font-semibold">Test Posts Manager</h3>
        <button
          onClick={() => setShowManager(false)}
          className="text-white/60 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="p-3 space-y-3">
        <div className="flex gap-2">
          <Button
            onClick={fetchTestPosts}
            disabled={loading}
            size="sm"
            className="liquid-button flex-1"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
          <Button
            onClick={extendAllPosts}
            disabled={loading || posts.length === 0}
            size="sm"
            className="glass hover:bg-white/20 text-white flex-1"
          >
            <Clock className="w-3 h-3 mr-1" />
            Extend All
          </Button>
        </div>

        {loading && (
          <div className="text-center text-white/60 py-4">
            Loading posts...
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center text-white/60 py-4">
            No test posts found
          </div>
        )}

        {posts.map((post) => {
          const isExpired = new Date(post.expires_at) < new Date();
          const createdAt = new Date(post.created_at).toLocaleDateString();
          const expiresAt = new Date(post.expires_at).toLocaleDateString();

          return (
            <div
              key={post.id}
              className={`glass p-3 rounded-lg ${isExpired ? 'border-red-500/30' : 'border-green-500/30'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="text-white text-sm font-medium truncate">
                    {post.content}
                  </p>
                  <p className="text-white/60 text-xs">
                    📍 {post.location || 'No location'}
                  </p>
                  <p className="text-white/60 text-xs">
                    📅 {createdAt} → {expiresAt}
                  </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${isExpired ? 'bg-red-500' : 'bg-green-500'}`} />
              </div>
              
              <div className="flex gap-1">
                <button
                  onClick={() => extendPostExpiration(post.id)}
                  disabled={loading}
                  className="glass px-2 py-1 rounded text-xs text-white hover:bg-white/20 transition-all"
                >
                  <Clock className="w-3 h-3" />
                </button>
                <button
                  onClick={() => deletePost(post.id)}
                  disabled={loading}
                  className="glass px-2 py-1 rounded text-xs text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TestPostManager;