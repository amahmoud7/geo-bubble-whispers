
import React from 'react';
import { Link } from 'react-router-dom';

const FooterSection: React.FC = () => {
  return (
    <footer className="bg-black text-white">
      <div className="container max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Connect your world.</h2>
          <p className="text-gray-400">
            Download Lo for free and start connecting with your community today.
          </p>
        </div>
        
        <div className="flex justify-center gap-6 mb-12">
          <Link to="/download" className="border border-white/30 rounded-lg px-6 py-3 flex items-center gap-2 hover:bg-white/10 transition-colors">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
              <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
            </svg>
            <span>App Store</span>
          </Link>
          <Link to="/download" className="border border-white/30 rounded-lg px-6 py-3 flex items-center gap-2 hover:bg-white/10 transition-colors">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
              <path d="M16.61,5.23C16.16,4.78 15.58,4.53 15,4.53C14.42,4.53 13.84,4.78 13.39,5.23L12,6.62L10.61,5.23C10.16,4.78 9.58,4.53 9,4.53C8.42,4.53 7.84,4.78 7.39,5.23C6.93,5.69 6.68,6.27 6.68,6.85C6.68,7.43 6.93,8.01 7.39,8.47L12,13.08L16.61,8.47C17.07,8.01 17.32,7.43 17.32,6.85C17.32,6.27 17.07,5.69 16.61,5.23M5,16V20H19V16H5M19,14C19.55,14 20,14.45 20,15V21C20,21.55 19.55,22 19,22H5C4.45,22 4,21.55 4,21V15C4,14.45 4.45,14 5,14H19M7,1H17A2,2 0 0,1 19,3V6H17V3H7V6H5V3A2,2 0 0,1 7,1Z" />
            </svg>
            <span>Google Play</span>
          </Link>
        </div>
        
        <hr className="border-white/20 mb-8" />
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="text-gray-400 hover:text-white text-sm">About</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white text-sm">Careers</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white text-sm">Press</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white text-sm">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="text-gray-400 hover:text-white text-sm">Help Center</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white text-sm">Contact Us</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white text-sm">Community</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white text-sm">Status</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white text-sm">Terms of Service</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white text-sm">Cookie Policy</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white text-sm">GDPR</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Social</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="text-gray-400 hover:text-white text-sm">Twitter</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white text-sm">Instagram</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white text-sm">Facebook</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white text-sm">LinkedIn</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lo-purple to-lo-blue flex items-center justify-center">
              <span className="text-white font-bold">Lo</span>
            </div>
            <span className="text-xl font-semibold">Lo</span>
          </div>
          
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Lo. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
