
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const HeroSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to subscribe.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Insert the subscriber into the Supabase database
      const { error } = await supabase
        .from('subscribers')
        .insert([
          { email, name: name || null }
        ]);
      
      if (error) {
        if (error.code === '23505') { // Unique violation error code
          toast({
            title: "Already Subscribed",
            description: "This email is already subscribed to our newsletter.",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Thanks for subscribing!",
          description: "Please check your email to confirm your subscription.",
        });
      }
      
      // Reset form
      setEmail('');
      setName('');
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Subscription Failed",
        description: "We couldn't process your subscription. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Where people connect <br />
              with each other.
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-md mx-auto md:mx-0">
              Lo helps you discover and connect with people around you. Share moments, create memories, and build communities in your area.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-6">
              <Button asChild size="lg" className="h-12 px-6">
                <Link to="/download">
                  Get the Lo App
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-6">
                <Link to="/app">
                  Open Web App
                </Link>
              </Button>
            </div>

            {/* Email subscription form */}
            <div className="mt-4 max-w-md mx-auto md:mx-0">
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Input
                    type="text"
                    placeholder="Your Name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 border-gray-300"
                  />
                  <Input
                    type="email"
                    placeholder="Your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 border-gray-300"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="h-12 px-6 w-full sm:w-auto"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Subscribing..." : "Subscribe to Updates"}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2 text-center md:text-left">
                Stay updated with our latest news and features. We'll never spam you.
              </p>
            </div>
          </div>
          
          <div className="relative h-[500px] flex items-center justify-center">
            <div className="absolute w-[300px] h-[600px] border-8 border-black rounded-[40px] overflow-hidden shadow-2xl">
              <img 
                src="/lovable-uploads/7a18f159-e1db-4273-b408-7404130fc841.png" 
                alt="Lo App Screenshot" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -z-10 w-72 h-72 bg-lo-purple/20 rounded-full blur-3xl transform -translate-y-24 translate-x-12" />
            <div className="absolute -z-10 w-64 h-64 bg-lo-blue/20 rounded-full blur-3xl transform translate-y-24 -translate-x-12" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
