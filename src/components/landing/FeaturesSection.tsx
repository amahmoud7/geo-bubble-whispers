
import React from 'react';
import { MapPin, MessageSquare, Search, Shield, Users, Map } from 'lucide-react';

const FeatureCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
}> = ({ title, description, icon }) => {
  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="h-12 w-12 rounded-full bg-lo-teal/10 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 bg-muted/50">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Lo is a force for connection in the world.</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover the powerful features that make Lo the perfect app for local connections and community building.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            title="Interactive Map"
            description="Explore your surroundings with our interactive map that shows you what's happening in your area in real-time."
            icon={<Map className="h-6 w-6 text-lo-teal" />}
          />
          <FeatureCard
            title="Location Messages"
            description="Leave messages at specific locations for others to discover, creating a digital layer of shared experiences."
            icon={<MessageSquare className="h-6 w-6 text-lo-teal" />}
          />
          <FeatureCard
            title="Local Discovery"
            description="Find interesting people, events, and messages in your vicinity, helping you connect with your community."
            icon={<Search className="h-6 w-6 text-lo-teal" />}
          />
          <FeatureCard
            title="Place Marking"
            description="Mark important or interesting locations on the map to share with friends or remember for later."
            icon={<MapPin className="h-6 w-6 text-lo-teal" />}
          />
          <FeatureCard
            title="Community Building"
            description="Create and join local communities based on shared interests, locations, or activities."
            icon={<Users className="h-6 w-6 text-lo-teal" />}
          />
          <FeatureCard
            title="Privacy Controls"
            description="Strong privacy features give you control over what you share and who can see your activity."
            icon={<Shield className="h-6 w-6 text-lo-teal" />}
          />
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
