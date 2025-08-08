import React, { useState } from 'react';
import { Search, MessageCircle, Heart, MapPin } from 'lucide-react';
import MobileHeader from '../MobileHeader';
import TouchableArea from '../TouchableArea';
import { MobileInput, SegmentedControl } from '../MobileForm';

// Mock data for demonstration
const mockNotifications = [
  {
    id: '1',
    type: 'like',
    user: { name: 'John Doe', avatar: '/placeholder.svg' },
    message: 'liked your message',
    content: 'Beautiful sunset at the beach!',
    timestamp: '2 min ago',
    read: false
  },
  {
    id: '2',
    type: 'comment',
    user: { name: 'Jane Smith', avatar: '/placeholder.svg' },
    message: 'commented on your message',
    content: 'Amazing view! Where is this?',
    timestamp: '1 hour ago',
    read: false
  },
  {
    id: '3',
    type: 'mention',
    user: { name: 'Mike Johnson', avatar: '/placeholder.svg' },
    message: 'mentioned you in a message',
    content: '@you check out this cool spot!',
    timestamp: '3 hours ago',
    read: true
  }
];

const mockMessages = [
  {
    id: '1',
    user: { name: 'Sarah Wilson', avatar: '/placeholder.svg' },
    lastMessage: 'Hey! Did you see my latest message near the park?',
    timestamp: '5 min ago',
    unread: 2,
    location: 'Central Park'
  },
  {
    id: '2',
    user: { name: 'Alex Chen', avatar: '/placeholder.svg' },
    lastMessage: 'Thanks for the like! 😊',
    timestamp: '1 hour ago',
    unread: 0,
    location: 'Downtown'
  }
];

const MobileInbox: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications');
  const [searchQuery, setSearchQuery] = useState('');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart size={20} className="ios-red" />;
      case 'comment':
        return <MessageCircle size={20} className="ios-blue" />;
      case 'mention':
        return <MessageCircle size={20} className="ios-green" />;
      default:
        return <MessageCircle size={20} className="ios-gray" />;
    }
  };

  const filteredNotifications = mockNotifications.filter(notification =>
    notification.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    notification.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMessages = mockMessages.filter(message =>
    message.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col ios-bg-grouped">
      <MobileHeader
        title="Inbox"
        leftButton="none"
      />

      <div className="flex-1 overflow-hidden">
        {/* Search and Tab Controls */}
        <div className="px-4 py-3 ios-bg-system">
          <MobileInput
            placeholder="Search inbox..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search size={20} />}
            className="mb-3"
          />
          
          <SegmentedControl
            options={[
              { label: 'Notifications', value: 'notifications' },
              { label: 'Messages', value: 'messages' }
            ]}
            value={activeTab}
            onChange={(value) => setActiveTab(value as typeof activeTab)}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {activeTab === 'notifications' ? (
            <div className="space-y-1">
              {filteredNotifications.map((notification) => (
                <TouchableArea
                  key={notification.id}
                  className={`ios-card p-4 ${!notification.read ? 'border-l-4 border-l-blue-600' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <img
                        src={notification.user.avatar}
                        alt="Avatar"
                        className="w-12 h-12 rounded-full bg-gray-200"
                      />
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold ios-label">
                          {notification.user.name}
                        </span>
                        <span className="ios-caption-1 ios-tertiary-label">
                          {notification.timestamp}
                        </span>
                      </div>
                      
                      <p className="ios-callout ios-secondary-label mb-2">
                        {notification.message}
                      </p>
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="ios-footnote ios-label">
                          "{notification.content}"
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {!notification.read && (
                    <div className="absolute top-4 left-2 w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                </TouchableArea>
              ))}
              
              {filteredNotifications.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle size={48} className="mx-auto ios-quaternary-label mb-4" />
                  <h3 className="ios-title-3 ios-secondary-label mb-2">
                    No notifications
                  </h3>
                  <p className="ios-body ios-tertiary-label">
                    You're all caught up!
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredMessages.map((message) => (
                <TouchableArea
                  key={message.id}
                  className="ios-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={message.user.avatar}
                      alt="Avatar"
                      className="w-12 h-12 rounded-full bg-gray-200"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold ios-label">
                          {message.user.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="ios-caption-1 ios-tertiary-label">
                            {message.timestamp}
                          </span>
                          {message.unread > 0 && (
                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {message.unread}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <p className="ios-callout ios-secondary-label mb-2">
                        {message.lastMessage}
                      </p>
                      
                      <div className="flex items-center gap-1 ios-tertiary-label">
                        <MapPin size={12} />
                        <span className="ios-caption-1">
                          {message.location}
                        </span>
                      </div>
                    </div>
                  </div>
                </TouchableArea>
              ))}
              
              {filteredMessages.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle size={48} className="mx-auto ios-quaternary-label mb-4" />
                  <h3 className="ios-title-3 ios-secondary-label mb-2">
                    No messages
                  </h3>
                  <p className="ios-body ios-tertiary-label">
                    Start a conversation by messaging someone!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileInbox;