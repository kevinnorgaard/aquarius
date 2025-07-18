'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AudioUtils } from '@/utils/audioUtils';

interface MicrophoneInputProps {
  onStreamStart: (stream: MediaStream) => void;
  onStreamStop: () => void;
  onError: (error: string) => void;
  isRecording: boolean;
}

export default function MicrophoneInput({ 
  onStreamStart, 
  onStreamStop, 
  onError, 
  isRecording 
}: MicrophoneInputProps) {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);
  const [volume, setVolume] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Check microphone availability on mount
  useEffect(() => {
    AudioUtils.isMicrophoneAvailable().then(setIsAvailable);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return stopRecording;
  }, [stopRecording]);

  const updateVolumeLevel = useCallback(() => {
    if (analyserRef.current) {
      const { volume: currentVolume } = AudioUtils.analyzeAudio(analyserRef.current);
      setVolume(currentVolume);
      animationFrameRef.current = requestAnimationFrame(updateVolumeLevel);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setIsRequestingAccess(true);
      
      const config = AudioUtils.getDefaultMicrophoneConfig();
      const stream = await AudioUtils.requestMicrophoneAccess(config);
      
      // Create audio context and analyser for volume monitoring
      const audioContext = AudioUtils.createAudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      streamRef.current = stream;
      analyserRef.current = analyser;
      audioContextRef.current = audioContext;
      
      // Start volume monitoring
      updateVolumeLevel();
      
      onStreamStart(stream);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to start recording');
    } finally {
      setIsRequestingAccess(false);
    }
  }, [onStreamStart, onError, updateVolumeLevel]);

  const stopRecording = useCallback(() => {
    // Stop volume monitoring
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    setVolume(0);
    onStreamStop();
  }, [onStreamStop]);

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggleRecording();
    }
  }, [handleToggleRecording]);

  if (isAvailable === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          Checking microphone availability...
        </span>
      </div>
    );
  }

  if (!isAvailable) {
    return (
      <div className="text-center p-8">
        <div className="mx-auto w-16 h-16 text-red-400 mb-4">
          <svg
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 1v6m0 6v6"
            />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
          No Microphone Available
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Please connect a microphone to use this feature
        </p>
      </div>
    );
  }

  return (
    <div className="text-center p-8">
      <div className="space-y-6">
        {/* Microphone Icon with Volume Visualization */}
        <div className="relative mx-auto w-20 h-20">
          <button
            onClick={handleToggleRecording}
            onKeyDown={handleKeyDown}
            disabled={isRequestingAccess}
            className={`
              w-full h-full rounded-full flex items-center justify-center
              transition-all duration-200 ease-in-out
              ${isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
              }
              ${isRequestingAccess ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            `}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRequestingAccess ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
            ) : (
              <svg
                className="w-8 h-8"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
              </svg>
            )}
          </button>
          
          {/* Volume Level Indicator */}
          {isRecording && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-100"
                  style={{ width: `${Math.min(volume * 100 * 3, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Status Text */}
        <div>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {isRequestingAccess 
              ? 'Requesting microphone access...' 
              : isRecording 
                ? 'Recording from microphone' 
                : 'Click to start recording'
            }
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isRecording 
              ? 'Click the microphone to stop recording' 
              : 'Your microphone will be used for real-time audio visualization'
            }
          </p>
        </div>

        {/* Recording Status Indicator */}
        {isRecording && (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-red-500 font-medium">
              LIVE
            </span>
          </div>
        )}
      </div>
    </div>
  );
}