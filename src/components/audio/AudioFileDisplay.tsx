'use client';

import React from 'react';
import { AudioFile } from '@/types/audio';
import { AudioUtils } from '@/utils/audioUtils';

interface AudioFileDisplayProps {
  audioFile: AudioFile;
  onRemove: () => void;
  isPlaying?: boolean;
}

export default function AudioFileDisplay({ audioFile, onRemove, isPlaying = false }: AudioFileDisplayProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onRemove();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          {/* Audio Icon */}
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
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-green-500 rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 16 + 8}px`,
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

      {/* Progress Bar for Playing Files */}
      {isPlaying && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300 animate-pulse"
              style={{ width: '30%' }} // This would be dynamic based on playback position
            />
          </div>
        </div>
      )}
    </div>
  );
}