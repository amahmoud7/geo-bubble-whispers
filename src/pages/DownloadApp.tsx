
import React from 'react';
import { Button } from "@/components/ui/button";
import LandingNav from '../components/landing/LandingNav';
import FooterSection from '../components/landing/FooterSection';

const DownloadApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      
      <main className="container max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Download Lo</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started with Lo app and connect with people around you. Available for iOS and Android.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl p-8 text-center border shadow-lg">
            <div className="flex justify-center mb-6">
              <img src="/lovable-uploads/491a6bbb-1d7b-435d-90c8-0e163a383324.png" alt="iOS App" className="h-72 object-contain" />
            </div>
            <h2 className="text-2xl font-bold mb-4">iOS App</h2>
            <p className="text-muted-foreground mb-8">Download Lo for your iPhone or iPad</p>
            <Button className="w-full h-14 text-lg" size="lg">
              <svg viewBox="0 0 24 24" className="h-6 w-6 mr-2" fill="currentColor">
                <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
              </svg>
              App Store
            </Button>
          </div>
          
          <div className="bg-card rounded-2xl p-8 text-center border shadow-lg">
            <div className="flex justify-center mb-6">
              <img src="/lovable-uploads/191fd925-fe00-46b9-99db-c247130656a7.png" alt="Android App" className="h-72 object-contain" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Android App</h2>
            <p className="text-muted-foreground mb-8">Download Lo for your Android device</p>
            <Button className="w-full h-14 text-lg" size="lg">
              <svg viewBox="0 0 24 24" className="h-6 w-6 mr-2" fill="currentColor">
                <path d="M16.61,5.23C16.16,4.78 15.58,4.53 15,4.53C14.42,4.53 13.84,4.78 13.39,5.23L12,6.62L10.61,5.23C10.16,4.78 9.58,4.53 9,4.53C8.42,4.53 7.84,4.78 7.39,5.23C6.93,5.69 6.68,6.27 6.68,6.85C6.68,7.43 6.93,8.01 7.39,8.47L12,13.08L16.61,8.47C17.07,8.01 17.32,7.43 17.32,6.85C17.32,6.27 17.07,5.69 16.61,5.23M5,16V20H19V16H5M19,14C19.55,14 20,14.45 20,15V21C20,21.55 19.55,22 19,22H5C4.45,22 4,21.55 4,21V15C4,14.45 4.45,14 5,14H19M7,1H17A2,2 0 0,1 19,3V6H17V3H7V6H5V3A2,2 0 0,1 7,1Z" />
              </svg>
              Google Play
            </Button>
          </div>
        </div>
      </main>
      
      <FooterSection />
    </div>
  );
};

export default DownloadApp;
