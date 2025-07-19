'use client';

import React from 'react';
import { AudioFile } from '@/types/audio';
import { AudioUtils } from '@/utils/audioUtils';

interface AudioFileDisplayProps {
  audioFile: AudioFile;
  onRemove: () => void;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onSeek?: (position: number) => void;
  currentTime?: number;
  duration?: number;
}

export default function AudioFileDisplay({ 
  audioFile, 
  onRemove, 
  isPlaying = false, 
  onPlayPause,
  onSeek,
  currentTime = 0,
  duration = 0
}: AudioFileDisplayProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRemove();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    onSeek?.(newTime);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {/* Play/Pause Button */}
          {onPlayPause && (
            <button
              onClick={onPlayPause}
              className={`
                w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200
                ${isPlaying 
                  ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50' 
                  : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                }
              `}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
          )}

          {/* Audio Icon (when no play/pause functionality) */}
          {!onPlayPause && (
            <div className={`
              w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
              ${isPlaying 
                ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              }
            `}>
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              )}
            </div>
          )}

          {/* File Information */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
              {audioFile.name}
            </h3>
            
            <div className="mt-2 space-y-1">
              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                <span>
                  Size: {AudioUtils.formatFileSize(audioFile.size)}
                </span>
                {audioFile.duration && (
                  <span>
                    Duration: {AudioUtils.formatDuration(audioFile.duration)}
                  </span>
                )}
                <span>
                  Format: {audioFile.format.split('/')[1]?.toUpperCase() || 'Unknown'}
                </span>
              </div>
              
              {isPlaying && (
                <div className="flex items-center space-x-2" style={{ height: '24px' }}>
                  <div className="flex space-x-1 items-end" style={{ height: '16px' }}>
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-green-500 rounded-full animate-pulse"
                        style={{
                          height: `${[8, 12, 10][i]}px`,
                          animationDelay: `${i * 150}ms`
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Playing
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Remove Button */}
        <button
          onClick={onRemove}
          onKeyDown={handleKeyDown}
          className="
            ml-4 p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400
            rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
          "
          aria-label="Remove audio file"
          title="Remove audio file"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Interactive Progress Slider for Playing Files */}
      {isPlaying && (
        <div className="mt-4 space-y-2">
          {/* Time display */}
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          
          {/* Progress slider */}
          <div className="relative">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              disabled={!onSeek}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
              style={{
                background: `linear-gradient(to right, #10b981 0%, #10b981 ${progress}%, #e5e7eb ${progress}%, #e5e7eb 100%)`
              }}
            />
            <style jsx>{`
              .slider::-webkit-slider-thumb {
                appearance: none;
                height: 16px;
                width: 16px;
                border-radius: 50%;
                background: #10b981;
                cursor: pointer;
                border: 2px solid #ffffff;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              }
              .slider::-moz-range-thumb {
                height: 16px;
                width: 16px;
                border-radius: 50%;
                background: #10b981;
                cursor: pointer;
                border: 2px solid #ffffff;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              }
              .slider:disabled {
                opacity: 0.5;
                cursor: not-allowed;
              }
              .slider:disabled::-webkit-slider-thumb {
                cursor: not-allowed;
              }
              .slider:disabled::-moz-range-thumb {
                cursor: not-allowed;
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}