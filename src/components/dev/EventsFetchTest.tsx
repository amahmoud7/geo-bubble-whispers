import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useEventMessages } from '@/hooks/useEventMessages';

export const EventsFetchTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { events, refetch } = useEventMessages();

  const testFetch = async () => {
    setLoading(true);
    setResult(null);
    
    console.log('🧪 Testing events fetch...');
    console.log('📍 Using LA coordinates: 34.0522, -118.2437');
    
    try {
      // Test Supabase function
      const { data, error } = await supabase.functions.invoke('fetch-events-realtime', {
        body: { 
          source: ['ticketmaster'],
          center: { lat: 34.0522, lng: -118.2437 },
          radius: 50,
          timeframe: '24h'
        }
      });

      if (error) {
        console.error('❌ Function error:', error);
        setResult({ error: error.message });
        return;
      }

      console.log('✅ Function response:', data);
      setResult(data);
      
      // Refetch events
      setTimeout(() => {
        console.log('🔄 Refetching events from database...');
        refetch();
      }, 1000);

    } catch (error: any) {
      console.error('❌ Fetch error:', error);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const checkDatabase = async () => {
    console.log('🔍 Checking events in database...');
    setLoading(true);
    
    try {
      const { data, error, count } = await supabase
        .from('messages')
        .select('*', { count: 'exact' })
        .eq('message_type', 'event');

      if (error) {
        console.error('❌ Database error:', error);
        setResult({ error: error.message });
        return;
      }

      console.log(`📊 Events in database: ${count}`);
      
      if (data && data.length > 0) {
        console.log('✅ Sample events:', data.slice(0, 3).map(e => ({
          title: e.event_title,
          venue: e.event_venue,
          coords: `${e.lat}, ${e.lng}`,
          start: e.event_start_date
        })));
        setResult({ 
          count, 
          sample: data.slice(0, 3).map(e => e.event_title) 
        });
      } else {
        console.log('⚠️ No events found');
        setResult({ count: 0, message: 'No events in database' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-4 z-50 p-4 bg-white rounded-lg shadow-lg border-2 border-purple-500 max-w-sm">
      <h3 className="font-bold text-sm mb-2">Events Fetch Debugger</h3>
      
      <div className="space-y-2">
        <Button 
          onClick={testFetch} 
          disabled={loading}
          size="sm"
          className="w-full"
        >
          {loading ? 'Fetching...' : 'Fetch Events (LA)'}
        </Button>
        
        <Button 
          onClick={checkDatabase}
          variant="outline" 
          size="sm"
          className="w-full"
        >
          Check Database
        </Button>
        
        <div className="text-xs">
          <div className="font-semibold">Current Events: {events.length}</div>
          {result && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-[10px] overflow-auto max-h-32">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
