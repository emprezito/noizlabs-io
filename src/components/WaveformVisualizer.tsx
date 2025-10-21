import { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  className?: string;
  color?: string;
  bars?: number;
}

export const WaveformVisualizer = ({ 
  className = '', 
  color = 'hsl(265, 80%, 65%)',
  bars = 50 
}: WaveformVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const barWidth = canvas.width / bars;
    let animationId: number;
    let phase = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < bars; i++) {
        const barHeight = Math.abs(
          Math.sin((i * 0.1) + phase) * 
          Math.cos((i * 0.05) + phase * 0.5) * 
          (canvas.height / 2) * 0.8
        );
        
        const x = i * barWidth;
        const y = (canvas.height - barHeight) / 2;
        
        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'hsl(320, 100%, 60%)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth - 2, barHeight);
      }
      
      phase += 0.05;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [bars, color]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={200}
      className={className}
    />
  );
};
