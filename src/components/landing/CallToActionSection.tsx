
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

const CallToActionSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate submission delay
    setTimeout(() => {
      toast({
        title: "Thanks for subscribing!",
        description: "We'll keep you updated on all things Lo.",
      });
      setEmail('');
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <section id="about" className="relative py-20">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="rounded-3xl overflow-hidden">
          <div className="relative aspect-[3/2] md:aspect-[5/2]">
            <img 
              src="/lovable-uploads/dc0ee9a6-bfbd-4b3a-8287-3588596ec920.png" 
              alt="Lo App Background" 
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40 flex items-center">
              <div className="text-white p-8 md:p-16 max-w-xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">For the greater good.</h2>
                <p className="text-lg md:text-xl mb-8 text-white/80">
                  Lo is on a mission to make your world more connected, letting you share and discover the important moments happening around you.
                </p>
                <div className="flex flex-wrap gap-4 mb-8">
                  <Button asChild size="lg" variant="default" className="bg-white text-black hover:bg-white/90">
                    <Link to="/download">Download Now</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
                    <Link to="/app">Open Web App</Link>
                  </Button>
                </div>
                
                <div className="mt-8 bg-black/30 p-4 rounded-lg backdrop-blur-sm">
                  <h3 className="text-lg font-medium mb-2">Stay updated</h3>
                  <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-grow">
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="h-12 px-6"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Subscribing..." : "Subscribe"}
                    </Button>
                  </form>
                  <p className="text-xs text-white/60 mt-2">
                    We'll never share your email with anyone else.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;
