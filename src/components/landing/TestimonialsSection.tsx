
import React from 'react';

const TestimonialsSection: React.FC = () => {
  return (
    <section id="testimonials" className="py-20 bg-muted/50">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-block bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium mb-4">Testimonials</div>
          <h2 className="text-3xl font-bold">Know the real stories, faster.</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="bg-card rounded-2xl p-8 shadow-md">
            <div className="flex items-start">
              <div className="text-5xl text-primary font-serif mr-4">"</div>
              <div>
                <p className="text-lg mb-6">
                  My friend texted me about something happening down the street. I checked Lo, instantly got all the details about what was going on, and was able to avoid the area. This app has changed how I navigate my neighborhood.
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-300 mr-4"></div>
                  <div>
                    <p className="font-semibold">Sarah K.</p>
                    <p className="text-sm text-muted-foreground">Los Angeles, CA</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-2xl p-8 shadow-md">
            <div className="flex items-start">
              <div className="text-5xl text-primary font-serif mr-4">"</div>
              <div>
                <p className="text-lg mb-6">
                  I've discovered so many hidden gems in my neighborhood through Lo. People leave the most thoughtful messages and recommendations about local spots. It's like having a local guide everywhere you go.
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-300 mr-4"></div>
                  <div>
                    <p className="font-semibold">Michael T.</p>
                    <p className="text-sm text-muted-foreground">Chicago, IL</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
