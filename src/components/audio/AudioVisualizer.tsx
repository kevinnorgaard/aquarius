'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { AudioVisualizationData } from '@/types/audio';

interface AudioVisualizerProps {
  audioData: AudioVisualizationData | null;
  width?: number;
  height?: number;
}

export default function AudioVisualizer({ audioData, width = 800, height = 200 }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { frequencyData, volume } = audioData;
    
    // Clear canvas
    ctx.fillStyle = 'rgb(15, 23, 42)'; // slate-900
    ctx.fillRect(0, 0, width, height);

    // Draw frequency bars
    const barWidth = width / frequencyData.length;
    
    for (let i = 0; i < frequencyData.length; i++) {
      const barHeight = (frequencyData[i] / 255) * height * 0.8;
      
      // Create gradient based on frequency
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
      if (i < frequencyData.length / 3) {
        // Low frequencies - red to orange
        gradient.addColorStop(0, 'rgb(239, 68, 68)'); // red-500
        gradient.addColorStop(1, 'rgb(251, 146, 60)'); // orange-400
      } else if (i < (frequencyData.length * 2) / 3) {
        // Mid frequencies - orange to yellow
        gradient.addColorStop(0, 'rgb(251, 146, 60)'); // orange-400
        gradient.addColorStop(1, 'rgb(250, 204, 21)'); // yellow-400
      } else {
        // High frequencies - yellow to green
        gradient.addColorStop(0, 'rgb(250, 204, 21)'); // yellow-400
        gradient.addColorStop(1, 'rgb(34, 197, 94)'); // green-500
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
    }

    // Draw volume indicator
    const volumeWidth = width * 0.8;
    const volumeHeight = 10;
    const volumeX = (width - volumeWidth) / 2;
    const volumeY = height - 30;

    // Volume background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(volumeX, volumeY, volumeWidth, volumeHeight);

    // Volume level
    const volumeLevel = Math.min(volume * 2, 1); // Amplify volume for better visibility
    ctx.fillStyle = volumeLevel > 0.8 ? 'rgb(239, 68, 68)' : volumeLevel > 0.6 ? 'rgb(251, 146, 60)' : 'rgb(34, 197, 94)';
    ctx.fillRect(volumeX, volumeY, volumeWidth * volumeLevel, volumeHeight);

    // Schedule next frame
    animationFrameRef.current = requestAnimationFrame(draw);
  }, [audioData, width, height]);

  useEffect(() => {
    if (audioData) {
      draw();
    } else {
      // Clear canvas when no audio data
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'rgb(15, 23, 42)';
          ctx.fillRect(0, 0, width, height);
          
          // Draw "No Audio" message
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.font = '16px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText('No audio input', width / 2, height / 2);
        }
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioData, draw, width, height]);

  return (
    <div className="w-full">
      <div className="bg-slate-900 rounded-lg p-4 border border-gray-700">
        <div className="mb-2">
          <h3 className="text-lg font-medium text-white mb-1">
            Audio Visualization
          </h3>
          <p className="text-sm text-gray-400">
            {audioData ? 'Real-time audio frequency analysis' : 'No audio input detected'}
          </p>
        </div>
        
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="w-full h-auto border border-gray-600 rounded"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          
          {audioData && (
            <div className="absolute top-2 right-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
              Volume: {Math.round(audioData.volume * 100)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}