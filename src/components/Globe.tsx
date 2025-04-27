
import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface Bubble {
  id: number;
  size: number;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

const Globe: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const globeRef = useRef<HTMLDivElement | null>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const rafRef = useRef<number | null>(null);
  
  const navigate = useNavigate();

  const generateBubbles = (): Bubble[] => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      size: Math.random() * 5 + 2,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      opacity: Math.random() * 0.5 + 0.3,
    }));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize bubbles
    bubblesRef.current = generateBubbles();

    // Set canvas dimensions
    const updateDimensions = () => {
      if (canvas && ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    
    window.addEventListener('resize', updateDimensions);
    updateDimensions();

    // Animation function
    const animate = () => {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw globe
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) * 0.3;
      
      // Create gradient for globe
      const gradient = ctx.createRadialGradient(
        centerX, centerY, 0, 
        centerX, centerY, radius
      );
      gradient.addColorStop(0, 'rgba(159, 147, 235, 0.7)');
      gradient.addColorStop(0.5, 'rgba(142, 128, 236, 0.5)');
      gradient.addColorStop(1, 'rgba(124, 109, 237, 0.2)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Draw grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 0.5;
      
      // Draw latitude lines
      for (let i = -90; i <= 90; i += 15) {
        const latRadius = Math.cos((i * Math.PI) / 180) * radius;
        const y = centerY + Math.sin((i * Math.PI) / 180) * radius;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, latRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Draw longitude lines
      for (let i = 0; i < 360; i += 15) {
        const angle = (i * Math.PI) / 180;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius);
        ctx.bezierCurveTo(
          centerX + radius * Math.cos(angle + Math.PI / 2) * 0.5,
          centerY - radius * Math.sin(angle + Math.PI / 2) * 0.5,
          centerX + radius * Math.cos(angle - Math.PI / 2) * 0.5,
          centerY - radius * Math.sin(angle - Math.PI / 2) * 0.5,
          centerX,
          centerY + radius
        );
        ctx.stroke();
      }
      
      // Draw bubbles
      bubblesRef.current.forEach((bubble) => {
        bubble.x += bubble.speedX;
        bubble.y += bubble.speedY;
        
        // Bounce off the edges
        if (bubble.x <= 0 || bubble.x >= canvas.width) bubble.speedX *= -1;
        if (bubble.y <= 0 || bubble.y >= canvas.height) bubble.speedY *= -1;
        
        // Draw bubble
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity})`;
        ctx.shadowColor = 'rgba(147, 112, 219, 0.6)';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animate();

    // Cleanup
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  return (
    <div className="globe-container" ref={globeRef}>
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
      />
    </div>
  );
};

export default Globe;
