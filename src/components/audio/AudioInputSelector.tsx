'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AudioFile, AudioInputState, AudioInputType, AudioVisualizationData } from '@/types/audio';
import { AudioUtils } from '@/utils/audioUtils';
import FileUpload from './FileUpload';
import MicrophoneInput from './MicrophoneInput';
import AudioFileDisplay from './AudioFileDisplay';
import PlaylistSelector from './PlaylistSelector';

interface AudioInputSelectorProps {
  onAudioData?: (data: AudioVisualizationData) => void;
  onStateChange?: (state: AudioInputState) => void;
}

export default function AudioInputSelector({ onAudioData, onStateChange }: AudioInputSelectorProps) {
  const [inputType, setInputType] = useState<AudioInputType | null>(null);
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Audio context and analysis
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Notify parent of state changes
  useEffect(() => {
    const audioState: AudioInputState = {
      type: inputType,
      isRecording,
      isProcessing,
      error,
      audioFile,
      audioContext: audioContextRef.current,
      analyser: analyserRef.current,
      source: sourceRef.current
    };
    onStateChange?.(audioState);
  }, [inputType, isRecording, isProcessing, error, audioFile, onStateChange]);

  const cleanup = useCallback(() => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop audio source
    if (sourceRef.current) {
      if ('stop' in sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch {
          // Ignore errors when stopping already stopped sources
        }
      }
      if ('disconnect' in sourceRef.current) {
        sourceRef.current.disconnect();
      }
      sourceRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Cleanup audio element
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = '';
      audioElementRef.current = null;
    }

    analyserRef.current = null;
    setIsPlaying(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const updateVisualizationData = useCallback(() => {
    if (analyserRef.current && onAudioData) {
      const { frequencyData, timeData, volume, lowFrequencyAverage, highFrequencyAverage, bpm, beatIntensity } = AudioUtils.analyzeAudio(analyserRef.current);
      
      onAudioData({
        frequencyData,
        timeData,
        volume,
        lowFrequencyAverage,
        highFrequencyAverage,
        bpm,
        beatIntensity,
        timestamp: Date.now()
      });
      
      animationFrameRef.current = requestAnimationFrame(updateVisualizationData);
    }
  }, [onAudioData]);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setIsProcessing(false);
    setIsRecording(false);
    cleanup();
  }, [cleanup]);

  const handleFileSelect = useCallback(async (selectedFile: AudioFile) => {
    try {
      setError(null);
      setIsProcessing(true);
      cleanup();

      // Reset BPM detection for new audio
      AudioUtils.resetBPMDetection();

      // Create audio context
      const audioContext = AudioUtils.createAudioContext();
      audioContextRef.current = audioContext;

      // Create analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Create audio element
      const audio = new Audio(selectedFile.url);
      audio.crossOrigin = 'anonymous';
      audio.loop = true;
      audioElementRef.current = audio;

      // Create media element source
      const source = audioContext.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      sourceRef.current = source;

      setAudioFile(selectedFile);
      setInputType(inputType === 'playlist' ? 'playlist' : 'file');
      setIsProcessing(false);

      // Auto-play and start visualization
      await audio.play();
      setIsPlaying(true);
      updateVisualizationData();
    } catch (error) {
      handleError(error instanceof Error ? error.message : 'Failed to process audio file');
    }
  }, [updateVisualizationData, cleanup, handleError, inputType]);

  const handleMicrophoneStart = useCallback(async (stream: MediaStream) => {
    try {
      setError(null);
      cleanup();

      // Reset BPM detection for new audio
      AudioUtils.resetBPMDetection();

      // Create audio context
      const audioContext = AudioUtils.createAudioContext();
      audioContextRef.current = audioContext;

      // Create analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Create media stream source
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      sourceRef.current = source;

      setInputType('microphone');
      setIsRecording(true);
      updateVisualizationData();
    } catch (error) {
      handleError(error instanceof Error ? error.message : 'Failed to start microphone input');
    }
  }, [updateVisualizationData, cleanup, handleError]);

  const handleMicrophoneStop = useCallback(() => {
    setIsRecording(false);
    cleanup();
  }, [cleanup]);

  const handleRemoveFile = useCallback(() => {
    cleanup();
    setAudioFile(null);
    setInputType(null);
    if (audioFile) {
      URL.revokeObjectURL(audioFile.url);
    }
  }, [cleanup, audioFile]);

  const handleInputTypeSelect = useCallback((type: AudioInputType) => {
    if (inputType !== type) {
      cleanup();
      setInputType(type);
      setError(null);
    }
  }, [inputType, cleanup]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Error Display */}
      {error && (
        <div className="border rounded-lg p-4" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', borderColor: 'rgba(220, 38, 38, 0.2)' }}>
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3" style={{ color: 'var(--destructive)' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p style={{ color: 'var(--destructive)' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Current Audio File Display */}
      {audioFile && (inputType === 'file' || inputType === 'playlist') && (
        <AudioFileDisplay
          audioFile={audioFile}
          onRemove={handleRemoveFile}
          isPlaying={isPlaying}
        />
      )}

      {/* Input Type Selection */}
      {!inputType && (
        <div className="text-center space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Choose Audio Input
            </h2>
            <p style={{ color: '#d1d5db' }}>
              Select how you&apos;d like to provide audio for visualization
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* File Upload Option */}
            <button
              onClick={() => handleInputTypeSelect('file')}
              className="p-8 border-2 rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ 
                borderColor: 'var(--border)',
                ':hover': { borderColor: 'var(--primary-light)', backgroundColor: 'rgba(143, 165, 92, 0.1)' }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-light)';
                e.currentTarget.style.backgroundColor = 'rgba(143, 165, 92, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12" style={{ color: 'var(--primary-light)' }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
                    Upload Audio File
                  </h3>
                  <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
                    Choose an audio file from your device
                  </p>
                </div>
              </div>
            </button>

            {/* Playlist Option */}
            <button
              onClick={() => handleInputTypeSelect('playlist')}
              className="p-8 border-2 rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ 
                borderColor: 'var(--border)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.backgroundColor = 'rgba(107, 127, 57, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12" style={{ color: 'var(--primary)' }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
                    Choose from Playlist
                  </h3>
                  <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
                    Select from available audio tracks
                  </p>
                </div>
              </div>
            </button>

            {/* Microphone Option */}
            <button
              onClick={() => handleInputTypeSelect('microphone')}
              className="p-8 border-2 rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ 
                borderColor: 'var(--border)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-light)';
                e.currentTarget.style.backgroundColor = 'rgba(143, 165, 92, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12" style={{ color: 'var(--primary-light)' }}>
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
                    Use Microphone
                  </h3>
                  <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
                    Record audio from your microphone
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* File Upload Interface */}
      {inputType === 'file' && !audioFile && (
        <FileUpload
          onFileSelect={handleFileSelect}
          onError={handleError}
          isProcessing={isProcessing}
        />
      )}

      {/* Playlist Interface */}
      {inputType === 'playlist' && !audioFile && (
        <PlaylistSelector
          onTrackSelect={handleFileSelect}
          onError={handleError}
          isProcessing={isProcessing}
        />
      )}

      {/* Microphone Interface */}
      {inputType === 'microphone' && (
        <MicrophoneInput
          onStreamStart={handleMicrophoneStart}
          onStreamStop={handleMicrophoneStop}
          onError={handleError}
          isRecording={isRecording}
        />
      )}

      {/* Back Button */}
      {inputType && (
        <div className="text-center">
          <button
            onClick={() => {
              cleanup();
              setInputType(null);
              setAudioFile(null);
              setError(null);
            }}
            className="px-4 py-2 text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded"
            style={{ 
              color: '#9ca3af',
              ':hover': { color: 'var(--foreground)' }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--foreground)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            ← Choose Different Input
          </button>
        </div>
      )}
    </div>
  );
}