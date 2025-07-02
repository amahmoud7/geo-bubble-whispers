import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Calendar, MapPin, ExternalLink, Loader2 } from 'lucide-react';

const EventsManager: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchResult, setLastFetchResult] = useState<any>(null);

  const handleFetchEvents = async () => {
    setIsLoading(true);
    try {
      console.log('Triggering event fetch...');
      
      const { data, error } = await supabase.functions.invoke('fetch-events', {
        body: { manual: true }
      });

      if (error) {
        throw error;
      }

      setLastFetchResult(data);
      toast({
        title: "Events Fetched Successfully",
        description: `Found ${data?.totalEvents || 0} total events, created ${data?.newEvents || 0} new Lo messages`,
      });

      // Refresh the page to show new events
      window.location.reload();

    } catch (error: any) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error Fetching Events",
        description: error.message || "Failed to fetch events from APIs",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupCron = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('setup-cron');

      if (error) {
        throw error;
      }

      toast({
        title: "Cron Job Setup",
        description: "Daily event fetching has been configured successfully",
      });

    } catch (error: any) {
      console.error('Error setting up cron:', error);
      toast({
        title: "Error Setting Up Cron",
        description: error.message || "Failed to setup daily event fetching",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Events Integration Manager
        </CardTitle>
        <CardDescription>
          Manage integration with Eventbrite and Ticketmaster APIs for Los Angeles events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={handleFetchEvents} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching Events...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Fetch Events Now
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleSetupCron}
            variant="outline"
            className="flex-1"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Setup Daily Sync
          </Button>
        </div>

        {lastFetchResult && (
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Last Fetch Results:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Badge variant="secondary">Total Events</Badge>
                <p className="mt-1">{lastFetchResult.totalEvents}</p>
              </div>
              <div>
                <Badge variant="default">New Messages</Badge>
                <p className="mt-1">{lastFetchResult.newEvents}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {lastFetchResult.message}
            </p>
          </div>
        )}

        <div className="text-sm text-muted-foreground space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>Events are automatically filtered for the Los Angeles metropolitan area</p>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>Daily sync will fetch new events every day at 6 AM PST</p>
          </div>
          <div className="flex items-start gap-2">
            <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p>Events appear as Lo messages at their venue locations</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventsManager;