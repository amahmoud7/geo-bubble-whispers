
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const LandingNav: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md border-b">
      <div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/75b652b2-23ff-4231-8935-6f15e4221203.png" 
              alt="Lo Logo" 
              className="h-16" // Doubled from h-8 to h-16
            />
          </Link>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
            Home
          </Link>
          <Link to="#features" className="text-sm font-medium hover:text-primary transition-colors">
            Features
          </Link>
          <Link to="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
            Testimonials
          </Link>
          <Link to="#about" className="text-sm font-medium hover:text-primary transition-colors">
            About
          </Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <Button asChild variant="default" className="gap-2">
            <Link to="/download">
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default LandingNav;
