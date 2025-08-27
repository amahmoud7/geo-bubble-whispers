import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from 'lucide-react';

export interface StoryHighlight {
  id: string;
  title: string;
  cover_image_url?: string;
  story_ids: string[];
  created_at: string;
}

interface StoryHighlightsProps {
  highlights: StoryHighlight[];
  isOwnProfile: boolean;
  onCreateHighlight?: () => void;
  onViewHighlight?: (highlight: StoryHighlight) => void;
}

const StoryHighlights = ({ 
  highlights, 
  isOwnProfile, 
  onCreateHighlight,
  onViewHighlight 
}: StoryHighlightsProps) => {
  return (
    <div className="flex space-x-4 overflow-x-auto pb-4 px-1">
      {/* Add new highlight button (only for own profile) */}
      {isOwnProfile && (
        <div className="flex flex-col items-center space-y-2 min-w-0">
          <button
            onClick={onCreateHighlight}
            className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-6 w-6 text-gray-400" />
          </button>
          <span className="text-xs text-gray-500 text-center truncate w-16">
            New
          </span>
        </div>
      )}

      {/* Story highlights */}
      {highlights.map((highlight) => (
        <div 
          key={highlight.id} 
          className="flex flex-col items-center space-y-2 min-w-0"
        >
          <button
            onClick={() => onViewHighlight?.(highlight)}
            className="group"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 to-pink-600 p-0.5 group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-white p-0.5">
                <Avatar className="w-full h-full">
                  <AvatarImage 
                    src={highlight.cover_image_url} 
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-100 to-purple-100">
                    {highlight.title.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </button>
          <span className="text-xs text-gray-700 text-center truncate w-16">
            {highlight.title}
          </span>
        </div>
      ))}
    </div>
  );
};

export default StoryHighlights;