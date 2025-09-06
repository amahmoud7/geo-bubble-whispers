import React, { useState, useEffect } from 'react';
import { Camera, Mic, MapPin, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionsService } from '@/services/permissionsService';

interface PermissionRequestProps {
  onComplete?: () => void;
}

const PermissionRequest: React.FC<PermissionRequestProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false,
    location: false
  });
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    checkExistingPermissions();
  }, []);

  const checkExistingPermissions = async () => {
    const status = await PermissionsService.checkPermissions();
    setPermissions(status);
    setHasChecked(true);
    
    // Only show dialog if not all permissions are granted
    const allGranted = status.camera && status.microphone && status.location;
    if (!allGranted) {
      // Show after a short delay for better UX
      setTimeout(() => setIsVisible(true), 1000);
    } else {
      onComplete?.();
    }
  };

  const handleRequestPermissions = async () => {
    setIsRequesting(true);
    
    try {
      const results = await PermissionsService.requestAllPermissions();
      setPermissions(results);
      
      // Check if all permissions are granted
      const allGranted = results.camera && results.microphone && results.location;
      
      if (allGranted) {
        setTimeout(() => {
          setIsVisible(false);
          onComplete?.();
        }, 1000);
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    onComplete?.();
  };

  if (!isVisible || !hasChecked) return null;

  const allPermissionsGranted = permissions.camera && permissions.microphone && permissions.location;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-br from-lo-navy to-lo-dark-blue p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Welcome to Lo!</h2>
            <button
              onClick={handleSkip}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-white/80">
            To get the best experience, Lo needs access to a few features on your device.
          </p>
        </div>

        {/* Permissions List */}
        <div className="p-6 space-y-4">
          {/* Camera Permission */}
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${
              permissions.camera ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {permissions.camera ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <Camera className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Camera</h3>
              <p className="text-sm text-gray-600">
                Take photos and videos to share at your location
              </p>
            </div>
          </div>

          {/* Microphone Permission */}
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${
              permissions.microphone ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {permissions.microphone ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <Mic className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Microphone</h3>
              <p className="text-sm text-gray-600">
                Record audio for videos and live streaming
              </p>
            </div>
          </div>

          {/* Location Permission */}
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${
              permissions.location ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {permissions.location ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <MapPin className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Location</h3>
              <p className="text-sm text-gray-600">
                Share posts from your current location and discover nearby content
              </p>
            </div>
          </div>

          {/* Info Box */}
          {!allPermissionsGranted && (
            <div className="flex items-start space-x-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                You can change these permissions anytime in your device settings
              </p>
            </div>
          )}

          {allPermissionsGranted && (
            <div className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">
                All permissions granted! You're ready to use Lo
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0 space-y-3">
          {!allPermissionsGranted ? (
            <>
              <Button
                onClick={handleRequestPermissions}
                disabled={isRequesting}
                className="w-full bg-gradient-to-r from-lo-teal to-emerald-500 hover:from-emerald-600 hover:to-lo-teal text-white"
              >
                {isRequesting ? 'Requesting...' : 'Grant Permissions'}
              </Button>
              <Button
                onClick={handleSkip}
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-800"
              >
                Skip for now
              </Button>
            </>
          ) : (
            <Button
              onClick={() => {
                setIsVisible(false);
                onComplete?.();
              }}
              className="w-full bg-gradient-to-r from-lo-teal to-emerald-500 hover:from-emerald-600 hover:to-lo-teal text-white"
            >
              Get Started
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PermissionRequest;