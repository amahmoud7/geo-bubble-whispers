import React, { useState } from 'react';
import { Camera, Image, Video, Mic, X, Check } from 'lucide-react';
import MobileHeader from '../MobileHeader';
import TouchableArea from '../TouchableArea';
import { MobileButton } from '../MobileForm';
import MobileModal from '../MobileModal';

const MobileCamera: React.FC = () => {
  const [captureMode, setCaptureMode] = useState<'photo' | 'video' | 'live'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);

  const handleCapture = () => {
    if (captureMode === 'video' && !isRecording) {
      setIsRecording(true);
      // Start video recording
    } else if (captureMode === 'video' && isRecording) {
      setIsRecording(false);
      // Stop video recording and show preview
      setShowPreview(true);
    } else {
      // Take photo or start live stream
      setShowPreview(true);
    }
  };

  const handleRetake = () => {
    setShowPreview(false);
    setCapturedMedia(null);
    setIsRecording(false);
  };

  const handleUse = () => {
    // Navigate to message creation with captured media
    console.log('Use captured media');
  };

  return (
    <div className="h-full bg-black relative">
      <MobileHeader
        title=""
        leftButton="close"
        transparent
        className="absolute top-0 left-0 right-0 z-20"
      />

      {/* Camera Preview Area */}
      <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <Camera size={64} className="mx-auto mb-4 opacity-50" />
          <p className="ios-body">Camera preview would go here</p>
          <p className="ios-caption-1 opacity-75 mt-2">
            In a real app, this would show live camera feed
          </p>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-safe-area-bottom">
        {/* Capture Mode Selector */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-black/50 rounded-full p-1 backdrop-blur-sm">
            {[
              { mode: 'photo' as const, icon: Camera, label: 'Photo' },
              { mode: 'video' as const, icon: Video, label: 'Video' },
              { mode: 'live' as const, icon: Mic, label: 'Live' }
            ].map(({ mode, icon: Icon, label }) => (
              <TouchableArea
                key={mode}
                onPress={() => setCaptureMode(mode)}
                className={`px-4 py-2 rounded-full transition-colors ${
                  captureMode === mode ? 'bg-white' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon 
                    size={20} 
                    className={captureMode === mode ? 'text-black' : 'text-white'} 
                  />
                  <span className={`ios-caption-1 font-medium ${
                    captureMode === mode ? 'text-black' : 'text-white'
                  }`}>
                    {label}
                  </span>
                </div>
              </TouchableArea>
            ))}
          </div>
        </div>

        {/* Capture Controls */}
        <div className="flex items-center justify-center px-6 pb-6">
          <div className="flex items-center justify-between w-full max-w-xs">
            {/* Gallery Button */}
            <TouchableArea className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Image size={24} className="text-white" />
            </TouchableArea>

            {/* Capture Button */}
            <TouchableArea
              onPress={handleCapture}
              className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-red-600 scale-110' 
                  : captureMode === 'live' 
                    ? 'bg-red-600' 
                    : 'bg-white'
              }`}
            >
              {captureMode === 'photo' && (
                <div className="w-16 h-16 rounded-full bg-white" />
              )}
              {captureMode === 'video' && (
                <div className={`transition-all ${
                  isRecording 
                    ? 'w-6 h-6 bg-white rounded-sm' 
                    : 'w-16 h-16 bg-red-600 rounded-full'
                }`} />
              )}
              {captureMode === 'live' && (
                <div className="w-6 h-6 bg-white rounded-full animate-pulse" />
              )}
            </TouchableArea>

            {/* Switch Camera Button */}
            <TouchableArea className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white rounded-full relative">
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
              </div>
            </TouchableArea>
          </div>
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-20 left-6 flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white ios-caption-1 font-medium">REC</span>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <MobileModal
        isOpen={showPreview}
        onClose={handleRetake}
        presentationStyle="fullScreen"
        showCloseButton={false}
      >
        <div className="h-full bg-black relative">
          {/* Preview Area */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <Image size={64} className="mx-auto mb-4 opacity-50" />
              <p className="ios-body">Media preview would go here</p>
            </div>
          </div>

          {/* Preview Controls */}
          <div className="absolute bottom-0 left-0 right-0 pb-safe-area-bottom">
            <div className="flex items-center justify-center gap-12 px-6 pb-6">
              <TouchableArea
                onPress={handleRetake}
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
              >
                <X size={32} className="text-white" />
              </TouchableArea>

              <TouchableArea
                onPress={handleUse}
                className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center"
              >
                <Check size={32} className="text-white" />
              </TouchableArea>
            </div>
          </div>
        </div>
      </MobileModal>
    </div>
  );
};

export default MobileCamera;