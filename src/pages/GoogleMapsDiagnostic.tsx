import React from 'react';
import GoogleMapsDiagnostic from '@/components/map/GoogleMapsDiagnostic';

const GoogleMapsDiagnosticPage: React.FC = () => {
  return (
    <div className="w-full h-screen overflow-y-auto">
      <GoogleMapsDiagnostic />
    </div>
  );
};

export default GoogleMapsDiagnosticPage;