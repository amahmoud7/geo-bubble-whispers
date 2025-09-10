import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Navigation, Maximize2 } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface ARMessage {
  id: string;
  content: string;
  lat: number;
  lng: number;
  distance: number;
  bearing: number;
  user: {
    name: string;
    avatar?: string;
  };
}

interface ARMessageViewProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: { lat: number; lng: number } | null;
}

const ARMessageView: React.FC<ARMessageViewProps> = ({ isOpen, onClose, userLocation }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [deviceOrientation, setDeviceOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [nearbyMessages, setNearbyMessages] = useState<ARMessage[]>([]);
  const { messages } = useMessages();
  const animationFrameRef = useRef<number>();

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Calculate bearing between two points
  const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) -
              Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    return (θ * 180 / Math.PI + 360) % 360;
  };

  // Initialize camera
  useEffect(() => {
    if (!isOpen) return;

    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        toast({
          title: 'Camera Access Required',
          description: 'Please grant camera permissions to use AR view',
          variant: 'destructive'
        });
      }
    };

    initCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  // Handle device orientation
  useEffect(() => {
    if (!isOpen) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      setDeviceOrientation({
        alpha: event.alpha || 0,
        beta: event.beta || 0,
        gamma: event.gamma || 0
      });
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [isOpen]);

  // Process nearby messages
  useEffect(() => {
    if (!userLocation || !messages) return;

    const processedMessages = messages
      .filter(msg => msg.position)
      .map(msg => ({
        id: msg.id,
        content: msg.content,
        lat: msg.position.x,
        lng: msg.position.y,
        distance: calculateDistance(userLocation.lat, userLocation.lng, msg.position.x, msg.position.y),
        bearing: calculateBearing(userLocation.lat, userLocation.lng, msg.position.x, msg.position.y),
        user: msg.user
      }))
      .filter(msg => msg.distance < 1000) // Show messages within 1km
      .sort((a, b) => a.distance - b.distance);

    setNearbyMessages(processedMessages);
  }, [messages, userLocation]);

  // Render AR overlay
  useEffect(() => {
    if (!isOpen || !canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderAR = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Calculate field of view
      const FOV = 60; // degrees
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      nearbyMessages.forEach(msg => {
        // Calculate relative bearing based on device orientation
        const relativeBearing = (msg.bearing - deviceOrientation.alpha + 360) % 360;
        
        // Check if message is in field of view
        if (relativeBearing > 180 - FOV/2 && relativeBearing < 180 + FOV/2) {
          const x = centerX + (relativeBearing - 180) * (canvas.width / FOV);
          const y = centerY - (deviceOrientation.beta - 90) * 10; // Adjust for device tilt
          
          // Draw message bubble
          drawARMessage(ctx, x, y, msg);
        }
      });

      animationFrameRef.current = requestAnimationFrame(renderAR);
    };

    renderAR();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, nearbyMessages, deviceOrientation]);

  const drawARMessage = (ctx: CanvasRenderingContext2D, x: number, y: number, msg: ARMessage) => {
    // Glass morphism effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;

    // Calculate bubble size based on distance
    const maxWidth = 250;
    const padding = 15;
    const fontSize = Math.max(12, 16 - msg.distance / 100);
    
    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    
    // Measure text
    const lines = wrapText(ctx, msg.content, maxWidth - padding * 2);
    const lineHeight = fontSize * 1.5;
    const bubbleHeight = lines.length * lineHeight + padding * 2 + 30; // Extra space for user info
    const bubbleWidth = maxWidth;

    // Draw glass bubble with rounded corners
    const radius = 15;
    ctx.beginPath();
    ctx.moveTo(x - bubbleWidth/2 + radius, y - bubbleHeight/2);
    ctx.lineTo(x + bubbleWidth/2 - radius, y - bubbleHeight/2);
    ctx.quadraticCurveTo(x + bubbleWidth/2, y - bubbleHeight/2, x + bubbleWidth/2, y - bubbleHeight/2 + radius);
    ctx.lineTo(x + bubbleWidth/2, y + bubbleHeight/2 - radius);
    ctx.quadraticCurveTo(x + bubbleWidth/2, y + bubbleHeight/2, x + bubbleWidth/2 - radius, y + bubbleHeight/2);
    ctx.lineTo(x - bubbleWidth/2 + radius, y + bubbleHeight/2);
    ctx.quadraticCurveTo(x - bubbleWidth/2, y + bubbleHeight/2, x - bubbleWidth/2, y + bubbleHeight/2 - radius);
    ctx.lineTo(x - bubbleWidth/2, y - bubbleHeight/2 + radius);
    ctx.quadraticCurveTo(x - bubbleWidth/2, y - bubbleHeight/2, x - bubbleWidth/2 + radius, y - bubbleHeight/2);
    ctx.closePath();

    // Apply glass effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.stroke();

    // Add gradient overlay
    const gradient = ctx.createLinearGradient(x - bubbleWidth/2, y - bubbleHeight/2, x + bubbleWidth/2, y + bubbleHeight/2);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.1)');
    gradient.addColorStop(1, 'rgba(240, 147, 251, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw user name
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.fillText(msg.user.name, x - bubbleWidth/2 + padding, y - bubbleHeight/2 + padding + fontSize);

    // Draw message content
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    lines.forEach((line, i) => {
      ctx.fillText(line, x - bubbleWidth/2 + padding, y - bubbleHeight/2 + padding + 30 + (i + 1) * lineHeight);
    });

    // Draw distance indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = `${fontSize - 2}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    const distanceText = msg.distance < 100 ? `${Math.round(msg.distance)}m away` : `${(msg.distance / 1000).toFixed(1)}km away`;
    ctx.fillText(distanceText, x - bubbleWidth/2 + padding, y + bubbleHeight/2 - padding);

    // Draw direction indicator
    const arrowSize = 20;
    ctx.save();
    ctx.translate(x, y + bubbleHeight/2 + arrowSize);
    ctx.rotate((msg.bearing * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(0, -arrowSize/2);
    ctx.lineTo(-arrowSize/3, arrowSize/2);
    ctx.lineTo(arrowSize/3, arrowSize/2);
    ctx.closePath();
    ctx.fillStyle = 'rgba(102, 126, 234, 0.8)';
    ctx.fill();
    ctx.restore();
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Glass UI Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 glass-heavy rounded-b-3xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6 text-white" />
            <span className="text-white font-semibold">AR View</span>
            <span className="glass px-3 py-1 rounded-full text-xs text-white">
              {nearbyMessages.length} nearby Los
            </span>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 glass-heavy rounded-t-3xl">
        <div className="flex items-center justify-center gap-4">
          <Button className="liquid-button flex items-center gap-2">
            <Navigation className="w-4 h-4" />
            Navigate
          </Button>
          <Button className="glass px-6 py-2 rounded-full text-white border-white/20">
            <Maximize2 className="w-4 h-4 mr-2" />
            Expand View
          </Button>
        </div>
        <p className="text-center text-white/60 text-xs mt-3">
          Move your device to explore messages around you
        </p>
      </div>
    </div>
  );
};

export default ARMessageView;