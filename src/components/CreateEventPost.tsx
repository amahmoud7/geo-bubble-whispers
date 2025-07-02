import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock } from 'lucide-react';

const CreateEventPost: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();

  const createEventPost = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create event posts",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      // Event details from the uploaded image
      const eventContent = `🎫 18+SATURDAY LA AFTER DARK JULY 5TH FREE GUEST LIST HERE

📍 Los Globos
3040 West Sunset Boulevard Los Angeles, CA 90026

📅 Saturday, July 5, 2025 at 11:30 PM - Sunday, July 6, 2025 at 3:00 AM

🎵 LA AFTER DARK AFTERS MUSIC HIP HOP & REGGEATON FREE LIST OR INFO (626)347-0567

⏰ Event lasts 3 hours 30 minutes
👥 103.5k attendees hosted by LA EVENTS
🎟️ Free guest list available

#Events #LA #Nightlife #LosGlobos #AfterDark`;

      // Los Globos coordinates (approximate)
      const lat = 34.0833;
      const lng = -118.2894;

      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: eventContent,
          media_url: '/lovable-uploads/34e2e355-4705-4219-b7e8-68c5f462adf9.png',
          is_public: true,
          location: 'Los Globos, 3040 West Sunset Boulevard Los Angeles, CA 90026',
          lat: lat,
          lng: lng,
          expires_at: new Date('2025-07-06T10:00:00Z').toISOString(), // Expires after the event
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Event Lo Post Created!",
        description: "Your event post has been added to the map",
      });

      // Refresh the page to show the new post
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error: any) {
      console.error('Error creating event post:', error);
      toast({
        title: "Error creating event post",
        description: error.message || "Failed to create event post",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <Button
        onClick={createEventPost}
        disabled={isCreating}
        className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium shadow-lg"
      >
        {isCreating ? (
          <>
            <Clock className="w-4 h-4 mr-2 animate-spin" />
            Creating Event Post...
          </>
        ) : (
          <>
            <Calendar className="w-4 h-4 mr-2" />
            Create LA After Dark Event
          </>
        )}
      </Button>
    </div>
  );
};

export default CreateEventPost;