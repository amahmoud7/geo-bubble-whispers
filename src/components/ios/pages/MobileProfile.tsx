import React, { useState } from 'react';
import { Edit, Settings, MapPin, Calendar, Camera, Heart, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import MobileHeader from '../MobileHeader';
import TouchableArea from '../TouchableArea';
import { MobileButton, SegmentedControl } from '../MobileForm';
import MobileModal from '../MobileModal';
import ActionSheet from '../ActionSheet';

// Mock data for user's messages
const mockUserMessages = [
  {
    id: '1',
    content: 'Beautiful sunset at the beach today! 🌅',
    location: 'Santa Monica Beach',
    created_at: '2024-01-15T18:30:00Z',
    likes_count: 12,
    comments_count: 3,
    image_url: null
  },
  {
    id: '2',
    content: 'Great coffee spot downtown ☕',
    location: 'Downtown LA',
    created_at: '2024-01-14T10:15:00Z',
    likes_count: 8,
    comments_count: 1,
    image_url: null
  }
];

const MobileProfile: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'messages' | 'liked' | 'saved'>('messages');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const stats = {
    messages: mockUserMessages.length,
    likes: mockUserMessages.reduce((sum, msg) => sum + (msg.likes_count || 0), 0),
    following: 23,
    followers: 47
  };

  return (
    <div className="h-full flex flex-col ios-bg-grouped">
      <MobileHeader
        title="Profile"
        leftButton="none"
        rightButton={
          <TouchableArea onPress={() => setShowActionSheet(true)}>
            <Settings size={24} className="text-blue-600" />
          </TouchableArea>
        }
      />

      <div className="flex-1 overflow-y-auto pb-4">
        {/* Profile Header */}
        <div className="ios-bg-system px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <img
                src={user?.user_metadata?.avatar_url || '/placeholder.svg'}
                alt="Profile"
                className="w-20 h-20 rounded-full bg-gray-200"
              />
              <TouchableArea className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <Camera size={16} className="text-white" />
              </TouchableArea>
            </div>
            
            <div className="flex-1">
              <h2 className="ios-title-2 ios-label font-bold">
                {user?.user_metadata?.name || 'Anonymous User'}
              </h2>
              <p className="ios-callout ios-secondary-label mb-3">
                {user?.email}
              </p>
              
              <MobileButton
                variant="secondary"
                size="sm"
                onPress={() => setShowEditProfile(true)}
                leftIcon={<Edit size={16} />}
              >
                Edit Profile
              </MobileButton>
            </div>
          </div>
          
          {/* Bio */}
          <p className="ios-body ios-label mb-4">
            Exploring the world one message at a time 🌍 | Coffee enthusiast ☕ | Nature lover 🌿
          </p>
          
          {/* Stats */}
          <div className="flex justify-around py-4 border-t border-gray-200">
            {[
              { label: 'Messages', value: stats.messages },
              { label: 'Likes', value: stats.likes },
              { label: 'Following', value: stats.following },
              { label: 'Followers', value: stats.followers }
            ].map((stat) => (
              <TouchableArea key={stat.label} className="text-center">
                <div className="ios-title-2 ios-label font-bold">
                  {stat.value}
                </div>
                <div className="ios-caption-1 ios-secondary-label">
                  {stat.label}
                </div>
              </TouchableArea>
            ))}
          </div>
        </div>

        {/* Content Tabs */}
        <div className="px-4 py-3">
          <SegmentedControl
            options={[
              { label: 'Messages', value: 'messages' },
              { label: 'Liked', value: 'liked' },
              { label: 'Saved', value: 'saved' }
            ]}
            value={activeTab}
            onChange={(value) => setActiveTab(value as typeof activeTab)}
          />
        </div>

        {/* Content */}
        <div className="px-4 space-y-3">
          {activeTab === 'messages' && (
            <div className="space-y-3">
              {mockUserMessages.map((message) => (
                <TouchableArea
                  key={message.id}
                  className="ios-card p-4"
                >
                  <div className="mb-3">
                    <p className="ios-body ios-label mb-2">
                      {message.content}
                    </p>
                    
                    <div className="flex items-center gap-1 ios-tertiary-label mb-3">
                      <MapPin size={12} />
                      <span className="ios-caption-1">
                        {message.location}
                      </span>
                      <span className="mx-2">•</span>
                      <Calendar size={12} />
                      <span className="ios-caption-1">
                        {new Date(message.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Heart size={16} className="ios-red" />
                        <span className="ios-caption-1 ios-secondary-label">
                          {message.likes_count}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <MessageCircle size={16} className="ios-blue" />
                        <span className="ios-caption-1 ios-secondary-label">
                          {message.comments_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </TouchableArea>
              ))}
              
              {mockUserMessages.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle size={48} className="mx-auto ios-quaternary-label mb-4" />
                  <h3 className="ios-title-3 ios-secondary-label mb-2">
                    No messages yet
                  </h3>
                  <p className="ios-body ios-tertiary-label">
                    Start sharing your thoughts with the world!
                  </p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'liked' && (
            <div className="text-center py-12">
              <Heart size={48} className="mx-auto ios-quaternary-label mb-4" />
              <h3 className="ios-title-3 ios-secondary-label mb-2">
                No liked messages
              </h3>
              <p className="ios-body ios-tertiary-label">
                Messages you like will appear here
              </p>
            </div>
          )}
          
          {activeTab === 'saved' && (
            <div className="text-center py-12">
              <MessageCircle size={48} className="mx-auto ios-quaternary-label mb-4" />
              <h3 className="ios-title-3 ios-secondary-label mb-2">
                No saved messages
              </h3>
              <p className="ios-body ios-tertiary-label">
                Save messages to view them later
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <MobileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        title="Edit Profile"
        presentationStyle="pageSheet"
      >
        <div className="p-6">
          <p className="ios-body ios-secondary-label text-center">
            Edit profile functionality would go here
          </p>
        </div>
      </MobileModal>

      {/* Settings Action Sheet */}
      <ActionSheet
        isOpen={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        title="Profile Settings"
        options={[
          {
            label: 'Privacy Settings',
            onPress: () => console.log('Privacy Settings'),
            icon: <Settings size={20} />
          },
          {
            label: 'Notifications',
            onPress: () => console.log('Notifications'),
            icon: <MessageCircle size={20} />
          },
          {
            label: 'Sign Out',
            onPress: handleSignOut,
            destructive: true,
            icon: <div className="w-5 h-5 bg-red-600 rounded" />
          }
        ]}
      />
    </div>
  );
};

export default MobileProfile;