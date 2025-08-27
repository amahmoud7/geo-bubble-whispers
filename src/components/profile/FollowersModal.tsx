import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, UserPlus, UserCheck } from 'lucide-react';

export interface FollowUser {
  id: string;
  username: string;
  name: string;
  avatar_url?: string;
  is_verified?: boolean;
  is_following?: boolean;
  bio?: string;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: 'Followers' | 'Following';
  users: FollowUser[];
  currentUserId?: string;
  onFollow?: (userId: string) => void;
  onUnfollow?: (userId: string) => void;
  onUserClick?: (user: FollowUser) => void;
}

const FollowersModal = ({
  isOpen,
  onClose,
  title,
  users,
  currentUserId,
  onFollow,
  onUnfollow,
  onUserClick
}: FollowersModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFollowToggle = (user: FollowUser) => {
    if (user.is_following) {
      onUnfollow?.(user.id);
    } else {
      onFollow?.(user.id);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">{title}</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users List */}
        <ScrollArea className="h-96">
          <div className="space-y-1">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No users found' : `No ${title.toLowerCase()} yet`}
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isOwnProfile = user.id === currentUserId;
                
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => onUserClick?.(user)}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>
                          {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <span className="font-medium text-gray-900 truncate">
                            {user.username}
                          </span>
                          {user.is_verified && (
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {user.name}
                        </div>
                        {user.bio && (
                          <div className="text-xs text-gray-400 truncate mt-1">
                            {user.bio}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Follow/Unfollow Button */}
                    {!isOwnProfile && (
                      <Button
                        variant={user.is_following ? "outline" : "default"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFollowToggle(user);
                        }}
                        className="ml-3"
                      >
                        {user.is_following ? (
                          <>
                            <UserCheck className="w-4 h-4 mr-1" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-1" />
                            Follow
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FollowersModal;