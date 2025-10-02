import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Camera,
  MapPin,
  Play,
  Settings,
  Share2,
  Users,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AppTopBar from '@/components/layout/AppTopBar';
import { Chip } from '@/components/ui/chip';
import type { Tables, TablesUpdate } from '@/integrations/supabase/types';

interface ProfileStats {
  posts: number;
  followers: number;
  following: number;
}

interface Post {
  id: string;
  media_url?: string;
  content: string;
  created_at: string;
  likes: number;
  comments: number;
  type: 'image' | 'video' | 'text';
}

type ProfileRow = Tables<'profiles'>;
type MessageRow = Tables<'messages'>;

const MAX_BIO_LENGTH = 280;

const ModernProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<ProfileStats>({ posts: 0, followers: 0, following: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'tagged'>('posts');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState('');

  const loadProfile = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, username, bio, avatar_url, location, created_at, updated_at')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        const defaultBio = "Hey there! I'm new to Lo 👋";
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.email?.split('@')[0] || 'Anonymous',
            bio: defaultBio,
            avatar_url: null,
          })
          .select('id, name, username, bio, avatar_url, location, created_at, updated_at')
          .single();

        if (createError) {
          throw createError;
        }

        setProfile(newProfile ?? null);
        setBio(newProfile?.bio ?? '');
        return;
      }

      setProfile(data);
      setBio(data.bio ?? '');
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadPosts = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, media_url, created_at, message_type')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const messageRows: MessageRow[] = data ?? [];
      const formattedPosts: Post[] = messageRows.map((msg) => {
        const mediaUrl = msg.media_url ?? undefined;
        const inferredType: Post['type'] = mediaUrl
          ? /\.(mp4|mov|webm|m4v)$/i.test(mediaUrl)
            ? 'video'
            : 'image'
          : 'text';

        return {
          id: msg.id,
          media_url: mediaUrl,
          content: msg.content,
          created_at: msg.created_at ?? new Date().toISOString(),
          likes: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 50),
          type: msg.message_type === 'livestream' ? 'video' : inferredType,
        };
      }) ?? [];

      setPosts(formattedPosts);
      setStats((prev) => ({ ...prev, posts: messageRows.length }));
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadProfile();
    loadPosts();
  }, [user, loadProfile, loadPosts]);

  const handleEditProfile = async () => {
    if (isEditingBio) {
      try {
        const sanitizedBio = bio.trim();

        if (sanitizedBio.length > MAX_BIO_LENGTH) {
          toast({
            title: 'Bio too long',
            description: `Keep it under ${MAX_BIO_LENGTH} characters.`,
            variant: 'destructive',
          });
          return;
        }

        if (sanitizedBio === (profile?.bio ?? '')) {
          setIsEditingBio(false);
          return;
        }

        const updatePayload: TablesUpdate<'profiles'> = {
          bio: sanitizedBio.length ? sanitizedBio : null,
        };

        const { error } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', user?.id)
          .select('bio')
          .single();

        if (error) {
          throw error;
        }

        toast({
          title: 'Profile updated!',
          description: 'Your bio has been saved.',
        });
        setProfile((prev) => (prev ? { ...prev, bio: updatePayload.bio ?? null } : prev));
        setBio(sanitizedBio);
      } catch (error) {
        console.error('Error updating bio:', error);
        toast({
          title: 'Unable to save bio',
          description: 'Please try again in a moment.',
          variant: 'destructive',
        });
        setBio(profile?.bio ?? '');
        return;
      }
    }
    setIsEditingBio(!isEditingBio);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // In a real app, upload to storage
    toast({
      title: "Avatar upload",
      description: "Avatar upload coming soon!",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="px-6 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-slate-900 to-slate-700 text-white">
            <Users className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Sign in to view your profile</h1>
          <p className="text-gray-500 mb-6">Join Lo to share your moments with the world</p>
          <Button 
            onClick={() => navigate('/auth')}
            className="bg-gradient-to-r from-lo-teal to-blue-500 hover:from-lo-teal/90 hover:to-blue-500/90 text-white border-0 shadow-lg px-8 py-3 rounded-full"
          >
            Sign In
          </Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-24 mx-auto"></div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 pb-24">
      <AppTopBar
        title={profile?.name || user.email?.split('@')[0] || 'Profile'}
        subtitle="profile"
        leading={
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={() => navigate('/home')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
        trailing={
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4" />
          </Button>
        }
      />

      <div className="px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
          <div className="absolute inset-0 opacity-40" style={{ background: 'radial-gradient(circle at top, rgba(20,184,166,0.35), transparent 55%)' }} />
          <div className="relative flex items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-white/40 shadow-xl">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-slate-700 text-2xl font-semibold text-white">
                    {(profile?.name || user.email || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg"
                >
                  <Camera className="h-4 w-4" />
                  <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{profile?.name || user.email?.split('@')[0]}</h1>
                <p className="text-sm text-white/70">@{profile?.username || user.email?.split('@')[0]}</p>
              </div>
            </div>
            <div className="flex gap-3">
              {[
                { label: 'Posts', value: stats.posts },
                { label: 'Followers', value: stats.followers },
                { label: 'Following', value: stats.following },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/10 px-4 py-2 text-center text-sm">
                  <p className="text-lg font-semibold">{item.value}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-8 px-6">
        <div className="rounded-3xl bg-white p-5 shadow-sm">
          {isEditingBio ? (
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              className="w-full resize-none rounded-2xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              rows={3}
              placeholder="Tell the community about yourself"
            />
          ) : (
            <p className="text-sm text-slate-600">{profile?.bio || 'No bio yet'}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
            {profile?.location ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                <MapPin className="h-3 w-3" />
                {profile.location}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-slate-600">
              Joined {new Date(profile?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="mt-5 flex gap-3">
            <Button onClick={handleEditProfile} className="flex-1 rounded-full bg-slate-900 text-white hover:bg-slate-800">
              {isEditingBio ? 'Save Bio' : 'Edit Profile'}
            </Button>
            <Button
              onClick={() => toast({ title: 'Share Profile', description: 'Coming soon!' })}
              variant="secondary"
              className="flex-1 rounded-full"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Highlights</h2>
            <Button variant="ghost" size="sm" className="text-xs font-medium text-slate-500">
              Manage
            </Button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            <button className="flex flex-col items-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-slate-200">
                <Camera className="h-5 w-5 text-slate-400" />
              </span>
              <span className="mt-2 text-xs text-slate-500">New</span>
            </button>
            {['Travel', 'Food', 'Events'].map((title) => (
              <button key={title} className="flex flex-col items-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-slate-900 to-slate-700 p-0.5">
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-white/5 text-xs text-white/80">
                    {title.charAt(0)}
                  </span>
                </span>
                <span className="mt-2 text-xs text-slate-500">{title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Chip selected={activeTab === 'posts'} onClick={() => setActiveTab('posts')} className="flex-1">
              Posts
            </Chip>
            <Chip selected={activeTab === 'saved'} onClick={() => setActiveTab('saved')} className="flex-1">
              Saved
            </Chip>
            <Chip selected={activeTab === 'tagged'} onClick={() => setActiveTab('tagged')} className="flex-1">
              Tagged
            </Chip>
          </div>

          {activeTab === 'posts' ? (
            posts.length ? (
              <div className="grid grid-cols-3 gap-1 rounded-3xl bg-white p-1 shadow-sm">
                {posts.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => toast({ title: 'Post details', description: 'Coming soon!' })}
                    className="relative aspect-square overflow-hidden rounded-2xl"
                  >
                    {post.media_url ? (
                      <img src={post.media_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 p-3 text-xs text-slate-500">
                        {post.content}
                      </div>
                    )}
                    {post.type === 'video' && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
                        <Play className="h-3 w-3" />
                        Video
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
                Share your first Lo to populate your profile.
              </div>
            )
          ) : activeTab === 'saved' ? (
            <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
              Saved posts will land here for quick access.
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
              Posts you’re tagged in will appear here.
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ModernProfile;