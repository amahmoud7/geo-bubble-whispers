import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Mail, User, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import iosScreenshot from "@/assets/ios-app-screenshot.png";

const Waitlist: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email || !name) {
      toast({
        title: "All fields required",
        description: "Please enter both your name and email address.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate a confirmation token
      const confirmationToken = crypto.randomUUID();
      
      // Insert the subscriber into the Supabase database
      const { data, error } = await supabase
        .from('subscribers')
        .insert([
          { email, name, confirmation_token: confirmationToken }
        ])
        .select();
      
      if (error) {
        if (error.code === '23505') { // Unique violation error code
          toast({
            title: "Already on the waitlist",
            description: "This email is already registered for our waitlist.",
          });
        } else {
          console.error("Subscription error:", error);
          throw error;
        }
      } else {
        setIsSubmitted(true);
        toast({
          title: "Welcome to the waitlist!",
          description: "We'll notify you when Lo is ready for you to explore.",
        });
        
        // Reset form
        setEmail('');
        setName('');
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Submission Failed",
        description: "We couldn't add you to the waitlist. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold">You're on the list!</h1>
            <p className="text-muted-foreground">
              Thanks for joining the Lo waitlist. We'll be in touch soon with early access to connect with people around you.
            </p>
          </div>
          <Button 
            onClick={() => setIsSubmitted(false)}
            variant="outline"
            className="w-full"
          >
            Join Another Person
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="container max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content and Form */}
          <div className="space-y-8">
            <div className="space-y-4">
              <img 
                src="/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png" 
                alt="Lo Logo" 
                className="h-16 mb-6" 
              />
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Connect with people <br />
                around you.
              </h1>
              <p className="text-xl text-muted-foreground max-w-md">
                Lo is coming soon. Join the waitlist to be the first to discover and connect with your local community.
              </p>
            </div>

            <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-6 space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold">Join the Waitlist</h2>
                <p className="text-sm text-muted-foreground">
                  Get early access when we launch
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full"
                  size="lg"
                >
                  {isSubmitting ? "Joining..." : "Join Waitlist"}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center">
                We'll never spam you. Unsubscribe at any time.
              </p>
            </div>
          </div>

          {/* Right side - Phone Mockup */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-[280px] h-[560px] border-8 border-black rounded-[40px] overflow-hidden shadow-2xl">
              <img 
                src={iosScreenshot}
                alt="Lo App on iOS" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -z-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl transform -translate-y-24 translate-x-12" />
            <div className="absolute -z-10 w-64 h-64 bg-secondary/20 rounded-full blur-3xl transform translate-y-24 -translate-x-12" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Waitlist;