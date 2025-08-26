import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Calendar, 
  MapPin, 
  ExternalLink, 
  Loader2, 
  Settings,
  Clock,
  Target,
  Zap,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Globe,
  Building2
} from 'lucide-react';

interface SupportedCity {
  id: string;
  name: string;
  state: string;
  market?: string;
  icon: string;
  supported: boolean;
  eventSources: string[];
}

const EventsManager: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchResult, setLastFetchResult] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState<string>('los-angeles');
  const [autoDetectLocation, setAutoDetectLocation] = useState(true);
  const [syncProgress, setSyncProgress] = useState(0);
  const [fetchStats, setFetchStats] = useState({
    totalFetches: 0,
    successfulFetches: 0,
    lastFetchTime: null as Date | null,
    avgEventsPerFetch: 0
  });

  const supportedCities: SupportedCity[] = [
    {
      id: 'los-angeles',
      name: 'Los Angeles',
      state: 'CA',
      market: 'DMA_324',
      icon: '🌴',
      supported: true,
      eventSources: ['ticketmaster', 'eventbrite']
    },
    {
      id: 'new-york',
      name: 'New York',
      state: 'NY',
      market: 'DMA_501',
      icon: '🗽',
      supported: true,
      eventSources: ['ticketmaster', 'eventbrite']
    },
    {
      id: 'chicago',
      name: 'Chicago',
      state: 'IL',
      market: 'DMA_602',
      icon: '🏙️',
      supported: true,
      eventSources: ['ticketmaster', 'eventbrite']
    },
    {
      id: 'san-francisco',
      name: 'San Francisco',
      state: 'CA',
      market: 'DMA_807',
      icon: '🌉',
      supported: true,
      eventSources: ['ticketmaster', 'eventbrite']
    },
    {
      id: 'miami',
      name: 'Miami',
      state: 'FL',
      market: 'DMA_528',
      icon: '🏖️',
      supported: true,
      eventSources: ['ticketmaster', 'eventbrite']
    },
    {
      id: 'atlanta',
      name: 'Atlanta',
      state: 'GA',
      market: 'DMA_524',
      icon: '🍑',
      supported: true,
      eventSources: ['ticketmaster', 'eventbrite']
    }
  ];

  useEffect(() => {
    // Simulate progress during sync
    if (isLoading) {
      setSyncProgress(0);
      const interval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 95) {
            clearInterval(interval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 300);
      
      return () => clearInterval(interval);
    } else {
      setSyncProgress(100);
      setTimeout(() => setSyncProgress(0), 1000);
    }
  }, [isLoading]);

  const handleFetchEvents = async () => {
    setIsLoading(true);
    try {
      const selectedCityData = supportedCities.find(city => city.id === selectedCity);
      
      console.log(`Triggering event fetch for ${selectedCityData?.name || 'selected city'}...`);
      
      const { data, error } = await supabase.functions.invoke('fetch-events', {
        body: { 
          manual: true,
          city: selectedCity,
          cityName: selectedCityData?.name,
          market: selectedCityData?.market
        }
      });

      if (error) {
        throw error;
      }

      setLastFetchResult(data);
      
      // Update stats
      setFetchStats(prev => ({
        totalFetches: prev.totalFetches + 1,
        successfulFetches: prev.successfulFetches + 1,
        lastFetchTime: new Date(),
        avgEventsPerFetch: Math.round(((prev.avgEventsPerFetch * prev.totalFetches) + (data?.totalEvents || 0)) / (prev.totalFetches + 1))
      }));

      toast({
        title: "✨ Events Fetched Successfully",
        description: `Found ${data?.totalEvents || 0} events in ${selectedCityData?.name}, created ${data?.newEvents || 0} new Lo messages`,
        duration: 4000,
      });

      // Refresh the page to show new events
      setTimeout(() => window.location.reload(), 1500);

    } catch (error: any) {
      console.error('Error fetching events:', error);
      setFetchStats(prev => ({
        ...prev,
        totalFetches: prev.totalFetches + 1,
        lastFetchTime: new Date()
      }));
      
      toast({
        title: "❌ Error Fetching Events",
        description: error.message || "Failed to fetch events from APIs",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setSyncProgress(100);
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  const handleSetupCron = async () => {
    try {
      const selectedCityData = supportedCities.find(city => city.id === selectedCity);
      
      const { data, error } = await supabase.functions.invoke('setup-cron', {
        body: {
          city: selectedCity,
          cityName: selectedCityData?.name
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "⚡ Automatic Sync Enabled",
        description: `Daily event fetching configured for ${selectedCityData?.name}`,
        duration: 3000,
      });

    } catch (error: any) {
      console.error('Error setting up cron:', error);
      toast({
        title: "❌ Setup Failed",
        description: error.message || "Failed to setup daily event fetching",
        variant: "destructive"
      });
    }
  };

  const getCurrentCity = () => supportedCities.find(city => city.id === selectedCity);

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
      <CardHeader className="pb-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-2xl">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Globe className="h-6 w-6" />
              </div>
              Events Integration Hub
            </CardTitle>
            <CardDescription className="text-amber-100 mt-2">
              Manage real-time event integration across major US cities
            </CardDescription>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold">{getCurrentCity()?.icon}</div>
            <div className="text-sm text-amber-100">Current City</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* City Selection Section */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Building2 className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Target City</h3>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={autoDetectLocation}
                onCheckedChange={setAutoDetectLocation}
                id="auto-detect"
              />
              <Label htmlFor="auto-detect" className="text-sm text-gray-600">Auto-detect</Label>
            </div>
          </div>

          <Select value={selectedCity} onValueChange={setSelectedCity} disabled={autoDetectLocation}>
            <SelectTrigger className="w-full h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportedCities.map((city) => (
                <SelectItem key={city.id} value={city.id}>
                  <div className="flex items-center space-x-3 py-1">
                    <span className="text-lg">{city.icon}</span>
                    <div>
                      <div className="font-medium">{city.name}, {city.state}</div>
                      <div className="text-xs text-gray-500 flex items-center space-x-2">
                        <span>{city.eventSources.length} sources</span>
                        {city.supported && <CheckCircle className="w-3 h-3 text-green-500" />}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {getCurrentCity() && (
            <div className="mt-3 flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Target className="w-4 h-4" />
                <span>Market: {getCurrentCity()?.market}</span>
              </div>
              <div className="flex items-center space-x-1">
                <ExternalLink className="w-4 h-4" />
                <span>{getCurrentCity()?.eventSources.join(', ')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Button 
              onClick={handleFetchEvents} 
              disabled={isLoading}
              className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg font-semibold"
            >
              {isLoading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="h-6 w-6 animate-spin mb-1" />
                  <span className="text-sm">Syncing Events...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <Zap className="mr-3 h-6 w-6" />
                  <div className="flex flex-col items-start">
                    <span>Fetch Events Now</span>
                    <span className="text-xs opacity-90">from {getCurrentCity()?.name}</span>
                  </div>
                </div>
              )}
            </Button>
            
            {/* Progress Bar */}
            {isLoading && syncProgress > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-b-2xl overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
            )}
          </div>
          
          <Button 
            onClick={handleSetupCron}
            variant="outline"
            disabled={isLoading}
            className="h-16 border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 rounded-2xl text-orange-700 font-semibold"
          >
            <div className="flex items-center">
              <Settings className="mr-3 h-6 w-6" />
              <div className="flex flex-col items-start">
                <span>Setup Auto-Sync</span>
                <span className="text-xs opacity-75">Daily at 6 AM</span>
              </div>
            </div>
          </Button>
        </div>

        {/* Results Section */}
        {lastFetchResult && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-green-900">Last Sync Results</h4>
              {fetchStats.lastFetchTime && (
                <span className="text-sm text-green-600">
                  • {fetchStats.lastFetchTime.toLocaleTimeString()}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-xl border border-green-100">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-900">{lastFetchResult.totalEvents}</div>
                <div className="text-sm text-green-600">Total Events</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded-xl border border-green-100">
                <Zap className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-amber-900">{lastFetchResult.newEvents}</div>
                <div className="text-sm text-amber-600">New Messages</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded-xl border border-green-100">
                <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-900">{fetchStats.successfulFetches}</div>
                <div className="text-sm text-blue-600">Successful Syncs</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded-xl border border-green-100">
                <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-900">{fetchStats.avgEventsPerFetch}</div>
                <div className="text-sm text-purple-600">Avg per Sync</div>
              </div>
            </div>
            
            {lastFetchResult.message && (
              <div className="mt-4 p-3 bg-white/60 rounded-lg">
                <p className="text-sm text-green-800 font-medium">
                  {lastFetchResult.message}
                </p>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Information Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <MapPin className="h-5 w-5 mt-0.5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900">Geographic Filtering</p>
              <p className="text-blue-700 mt-1">Events are automatically filtered for the selected metropolitan area</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
            <Clock className="h-5 w-5 mt-0.5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-900">Automated Sync</p>
              <p className="text-amber-700 mt-1">Daily sync fetches new events every day at 6 AM local time</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
            <ExternalLink className="h-5 w-5 mt-0.5 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-green-900">Lo Integration</p>
              <p className="text-green-700 mt-1">Events appear as Lo messages at their exact venue locations</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventsManager;