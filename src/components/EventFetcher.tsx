import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Calendar } from 'lucide-react';

const EventFetcher: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (!hasTriggered) {
      triggerEventFetch();
      setHasTriggered(true);
    }
  }, [hasTriggered]);

  const triggerEventFetch = async () => {
    setIsLoading(true);
    
    try {
      console.log('Fetching current LA events and creating Lo posts...');
      
      const { data, error } = await supabase.functions.invoke('fetch-events-24h', {
        body: { source: 'ticketmaster' }
      });

      if (error) {
        throw error;
      }

      console.log('Event fetch completed:', data);
      
      toast({
        title: "Events Fetched!",
        description: `Found ${data?.totalEvents || 0} events, created ${data?.newEvents || 0} new Lo posts`,
      });

      if (data?.newEvents > 0) {
        // Reload the page after a short delay to show new Lo posts
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }

    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error Fetching Events",
        description: error.message || "Failed to fetch LA events",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoading && hasTriggered) {
    return null; // Component is done with its job
  }

  return (
    <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-4 shadow-lg z-50">
      <div className="flex items-center gap-2">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Fetching LA events...</span>
          </>
        ) : (
          <>
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Ready to fetch events</span>
          </>
        )}
      </div>
    </div>
  );
};

export default EventFetcher;