
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import LandingNav from '../components/landing/LandingNav';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import StatisticsSection from '../components/landing/StatisticsSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import CallToActionSection from '../components/landing/CallToActionSection';
import FooterSection from '../components/landing/FooterSection';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <LandingNav />
      
      <main>
        <HeroSection />
        <FeaturesSection />
        <StatisticsSection />
        <TestimonialsSection />
        <CallToActionSection />
      </main>
      
      <FooterSection />
    </div>
  );
};

export default Landing;
