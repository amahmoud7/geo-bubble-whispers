import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EventsFetcher: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const triggerEventFetch = async () => {
    setIsLoading(true);
    
    try {
      console.log('Fetching current LA events and creating Lo posts...');
      
      const { data, error } = await supabase.functions.invoke('fetch-events', {
        body: { manual: true, immediate: true }
      });

      if (error) {
        throw error;
      }

      console.log('Event fetch completed:', data);
      
      toast({
        title: "Events Fetched!",
        description: `Found ${data?.totalEvents || 0} events, created ${data?.newEvents || 0} new Lo posts`,
      });

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

  return (
    <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-4 shadow-lg z-50">
      <div className="flex items-center gap-2">
        <Button 
          onClick={triggerEventFetch}
          disabled={isLoading}
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Fetching events...
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 mr-2" />
              Fetch Events
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default EventsFetcher;