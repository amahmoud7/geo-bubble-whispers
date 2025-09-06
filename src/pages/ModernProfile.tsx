import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import BottomNavigation from '@/components/navigation/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  Settings, 
  Grid3x3, 
  Bookmark, 
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  MapPin,
  Link2,
  Calendar,
  Edit3,
  Camera,
  CheckCircle,
  TrendingUp,
  Users,
  Image as ImageIcon,
  Play
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

const ModernProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<ProfileStats>({ posts: 0, followers: 0, following: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
      loadPosts();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            name: user.email?.split('@')[0] || 'Anonymous',
            bio: 'Hey there! I\'m new to Lo 👋',
            avatar_url: null
          })
          .select()
          .single();

        if (!createError && newProfile) {
          setProfile(newProfile);
          setBio(newProfile.bio || '');
        }
      } else if (data) {
        setProfile(data);
        setBio(data.bio || '');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPosts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        const formattedPosts: Post[] = data.map(msg => ({
          id: msg.id,
          media_url: msg.media_url,
          content: msg.content,
          created_at: msg.created_at,
          likes: Math.floor(Math.random() * 100), // Mock data
          comments: Math.floor(Math.random() * 50), // Mock data
          type: msg.media_url ? 'image' : 'text'
        }));
        setPosts(formattedPosts);
        setStats(prev => ({ ...prev, posts: data.length }));
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const handleEditProfile = async () => {
    if (isEditingBio) {
      // Save bio
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ bio })
          .eq('id', user?.id);

        if (!error) {
          toast({
            title: "Profile updated!",
            description: "Your bio has been saved",
          });
          setProfile((prev: any) => ({ ...prev, bio }));
        }
      } catch (error) {
        console.error('Error updating bio:', error);
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
        <div className="text-center px-6">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-lo-teal to-blue-500 rounded-full flex items-center justify-center">
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
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 z-50" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="h-10 w-10 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold">{profile?.name || user.email?.split('@')[0]}</h1>
              <CheckCircle className="h-5 w-5 text-blue-500" />
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Profile Info Section */}
      <div className="px-4 py-6">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="h-24 w-24 ring-3 ring-gradient-to-r from-lo-teal to-blue-500 ring-offset-2">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-r from-lo-teal to-blue-500 text-white text-2xl font-bold">
                {(profile?.name || user.email || 'U')[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 h-8 w-8 bg-gradient-to-r from-lo-teal to-blue-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg">
              <Camera className="h-4 w-4 text-white" />
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          {/* Stats */}
          <div className="flex-1">
            <div className="flex justify-around">
              <button className="text-center">
                <p className="text-2xl font-bold">{stats.posts}</p>
                <p className="text-sm text-gray-500">Posts</p>
              </button>
              <button className="text-center" onClick={() => toast({ title: "Followers", description: "Coming soon!" })}>
                <p className="text-2xl font-bold">{stats.followers}</p>
                <p className="text-sm text-gray-500">Followers</p>
              </button>
              <button className="text-center" onClick={() => toast({ title: "Following", description: "Coming soon!" })}>
                <p className="text-2xl font-bold">{stats.following}</p>
                <p className="text-sm text-gray-500">Following</p>
              </button>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mt-4">
          <h2 className="font-bold text-base">{profile?.name || user.email?.split('@')[0]}</h2>
          <p className="text-sm text-gray-500">@{profile?.username || user.email?.split('@')[0]}</p>
          
          {isEditingBio ? (
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-2 w-full p-2 border rounded-lg text-sm resize-none"
              rows={3}
              placeholder="Write something about yourself..."
              maxLength={150}
            />
          ) : (
            <p className="mt-2 text-sm">{profile?.bio || 'No bio yet'}</p>
          )}
          
          {profile?.location && (
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <MapPin className="h-3 w-3 mr-1" />
              <span>{profile.location}</span>
            </div>
          )}
          
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <Calendar className="h-3 w-3 mr-1" />
            <span>Joined {new Date(profile?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-4">
          <Button
            onClick={handleEditProfile}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-black border-0 rounded-lg py-2"
          >
            {isEditingBio ? 'Save Bio' : 'Edit Profile'}
          </Button>
          <Button
            onClick={() => toast({ title: "Share Profile", description: "Coming soon!" })}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-black border-0 rounded-lg py-2"
          >
            Share Profile
          </Button>
        </div>

        {/* Highlights (Instagram-style) */}
        <div className="flex space-x-4 mt-6 overflow-x-auto">
          <button className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
              <Camera className="h-6 w-6 text-gray-400" />
            </div>
            <span className="text-xs mt-1">New</span>
          </button>
          {/* Mock highlights */}
          {['Travel', 'Food', 'Events'].map((title, i) => (
            <button key={i} className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lo-teal to-blue-500 p-0.5">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-lo-teal/20 to-blue-500/20 rounded-full"></div>
                </div>
              </div>
              <span className="text-xs mt-1">{title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Posts Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-12 p-0 bg-transparent border-t border-gray-200">
          <TabsTrigger value="posts" className="data-[state=active]:border-t-2 data-[state=active]:border-black rounded-none">
            <Grid3x3 className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger value="saved" className="data-[state=active]:border-t-2 data-[state=active]:border-black rounded-none">
            <Bookmark className="h-5 w-5" />
          </TabsTrigger>
          <TabsTrigger value="tagged" className="data-[state=active]:border-t-2 data-[state=active]:border-black rounded-none">
            <Users className="h-5 w-5" />
          </TabsTrigger>
        </TabsList>

        {/* Posts Grid */}
        <TabsContent value="posts" className="mt-0 p-0">
          <div className="grid grid-cols-3 gap-0.5">
            {posts.length > 0 ? (
              posts.map((post) => (
                <button
                  key={post.id}
                  className="relative aspect-square bg-gray-100 overflow-hidden group"
                  onClick={() => toast({ title: "Post details", description: "Coming soon!" })}
                >
                  {post.media_url ? (
                    <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <p className="text-xs text-gray-500 p-2 text-center line-clamp-3">{post.content}</p>
                    </div>
                  )}
                  
                  {/* Hover Overlay with stats */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                    <div className="flex items-center text-white">
                      <Heart className="h-5 w-5 mr-1 fill-white" />
                      <span className="font-bold">{post.likes}</span>
                    </div>
                    <div className="flex items-center text-white">
                      <MessageCircle className="h-5 w-5 mr-1 fill-white" />
                      <span className="font-bold">{post.comments}</span>
                    </div>
                  </div>

                  {/* Video indicator */}
                  {post.type === 'video' && (
                    <div className="absolute top-2 right-2">
                      <Play className="h-5 w-5 text-white drop-shadow" />
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className="col-span-3 py-20 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Camera className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Share your first Lo</h3>
                <p className="text-sm text-gray-500">Your posts will appear here</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="saved" className="mt-0 p-0">
          <div className="py-20 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Bookmark className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Saved posts</h3>
            <p className="text-sm text-gray-500">Save posts to view them later</p>
          </div>
        </TabsContent>

        <TabsContent value="tagged" className="mt-0 p-0">
          <div className="py-20 text-center">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Tagged posts</h3>
            <p className="text-sm text-gray-500">Posts you're tagged in will appear here</p>
          </div>
        </TabsContent>
      </Tabs>

      <BottomNavigation />
    </div>
  );
};

export default ModernProfile;