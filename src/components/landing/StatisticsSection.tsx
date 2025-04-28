
import React from 'react';

const StatItem: React.FC<{
  number: string;
  label: string;
}> = ({ number, label }) => {
  return (
    <div className="text-center p-8">
      <p className="text-4xl md:text-5xl font-bold mb-2">{number}</p>
      <p className="text-lg uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
};

const CircleItem: React.FC<{
  label: string;
}> = ({ label }) => {
  return (
    <div className="h-40 w-40 md:h-48 md:w-48 rounded-full border-2 flex items-center justify-center text-center p-4">
      <p className="font-medium uppercase tracking-wider text-sm">{label}</p>
    </div>
  );
};

const StatisticsSection: React.FC = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="relative h-[400px]">
            <img
              src="/lovable-uploads/dc0ee9a6-bfbd-4b3a-8287-3588596ec920.png"
              alt="Lo App Demo"
              className="rounded-2xl shadow-xl max-w-full h-auto object-contain mx-auto"
            />
            <div className="absolute -z-10 w-80 h-80 bg-lo-purple/20 rounded-full blur-3xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          
          <div>
            <h2 className="text-3xl font-bold mb-6">Your world is safer with Lo</h2>
            <p className="text-xl mb-8 text-muted-foreground">
              Connect with your community, discover what's happening around you, and stay informed about your surroundings.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <StatItem number="500K+" label="Active Users" />
              <StatItem number="10M+" label="Messages" />
              <StatItem number="100+" label="Cities" />
            </div>
            
            <div className="flex flex-wrap justify-center gap-6">
              <CircleItem label="Real-time Updates" />
              <CircleItem label="Local Communities" />
              <CircleItem label="Enhanced Discovery" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatisticsSection;
