
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";

const CallToActionSection: React.FC = () => {
  return (
    <section id="about" className="relative py-20 bg-background">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="rounded-3xl overflow-hidden bg-gradient-to-r from-lo-purple/20 to-lo-blue/20 shadow-lg">
          <div className="p-8 md:p-16">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">For the greater good.</h2>
              <p className="text-lg md:text-xl mb-8 text-muted-foreground">
                Lo is on a mission to make your world more connected, letting you share and discover the important moments happening around you.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" variant="default">
                  <Link to="/download">Download Now</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/app">Open Web App</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;
