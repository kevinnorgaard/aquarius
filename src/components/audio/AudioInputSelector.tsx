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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Audio context and analysis
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  // Store the last selected file in a ref to use if audioFile state is null
  const lastSelectedFileRef = useRef<AudioFile | null>(null);

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

  const handlePlayPause = useCallback(() => {
    if (audioElementRef.current) {
      if (isPlaying) {
        audioElementRef.current.pause();
        setIsPlaying(false);
      } else {
        audioElementRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [isPlaying]);

  const handleSeek = useCallback((newTime: number) => {
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  // Update time tracking
  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioFile]);

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
    setCurrentTime(0);
    setDuration(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const updateVisualizationData = useCallback(() => {
    if (analyserRef.current && onAudioData) {
      // Use lastSelectedFileRef if audioFile is null
      const effectiveFile = audioFile || lastSelectedFileRef.current;
      
      // Debug log
      console.log('AudioInputSelector - updateVisualizationData', {
        audioFile,
        lastSelectedFile: lastSelectedFileRef.current,
        effectiveFile,
        specifiedBpm: effectiveFile?.specifiedBpm,
        inputType
      });
      
      const { frequencyData, timeData, volume, lowFrequencyAverage, highFrequencyAverage, bpm, beatIntensity } = AudioUtils.analyzeAudio(
        analyserRef.current, 
        isPlaying, 
        effectiveFile?.specifiedBpm
      );
      
      // For microphone input, determine isPlaying based on actual audio activity
      let actualIsPlaying = isPlaying;
      if (inputType === 'microphone' && isRecording) {
        // Consider audio as "playing" if volume is above a reasonable threshold
        const volumeThreshold = 0.01; // Adjust threshold as needed
        actualIsPlaying = volume > volumeThreshold;
      }
      
      // Ensure specifiedBpm is passed correctly
      const visualizationData: AudioVisualizationData = {
        frequencyData,
        timeData,
        volume,
        lowFrequencyAverage,
        highFrequencyAverage,
        bpm: bpm,
        beatIntensity,
        timestamp: Date.now(),
        isPlaying: actualIsPlaying,
        isBpmSpecified: effectiveFile?.specifiedBpm !== undefined
      };
      
      // Only add specifiedBpm if it's defined
      if (effectiveFile?.specifiedBpm !== undefined) {
        visualizationData.specifiedBpm = effectiveFile.specifiedBpm;
        console.log('Setting specifiedBpm in visualization data:', effectiveFile.specifiedBpm);
      }
      
      onAudioData(visualizationData);
      
      animationFrameRef.current = requestAnimationFrame(updateVisualizationData);
    }
  }, [onAudioData, isPlaying, audioFile?.specifiedBpm, inputType, isRecording]);

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

      // Debug log
      console.log('AudioInputSelector - handleFileSelect - selectedFile:', selectedFile);
      
      // Store the selected file in the ref for use if audioFile state is null
      lastSelectedFileRef.current = selectedFile;
      
      // Set audioFile state first
      setAudioFile(selectedFile);
      
      // Then set input type
      setInputType(inputType === 'playlist' ? 'playlist' : 'file');
      setIsProcessing(false);

      // Auto-play and start visualization
      await audio.play();
      setIsPlaying(true);
      
      // Force update audioFile in updateVisualizationData
      const updatedVisualizationData = () => {
        if (analyserRef.current && onAudioData) {
          console.log('AudioInputSelector - updatedVisualizationData - selectedFile:', selectedFile);
          
          const { frequencyData, timeData, volume, lowFrequencyAverage, highFrequencyAverage, bpm, beatIntensity } = AudioUtils.analyzeAudio(
            analyserRef.current, 
            true, 
            selectedFile.specifiedBpm
          );
          
          // Ensure specifiedBpm is passed correctly
          const visualizationData: AudioVisualizationData = {
            frequencyData,
            timeData,
            volume,
            lowFrequencyAverage,
            highFrequencyAverage,
            bpm: bpm,
            beatIntensity,
            timestamp: Date.now(),
            isPlaying: true,
            isBpmSpecified: selectedFile.specifiedBpm !== undefined
          };
          
          // Only add specifiedBpm if it's defined
          if (selectedFile.specifiedBpm !== undefined) {
            visualizationData.specifiedBpm = selectedFile.specifiedBpm;
            console.log('Setting specifiedBpm in visualization data:', selectedFile.specifiedBpm);
          }
          
          onAudioData(visualizationData);
          
          // Start the regular update loop
          animationFrameRef.current = requestAnimationFrame(updateVisualizationData);
        }
      };
      
      // Call the updated visualization data function
      updatedVisualizationData();
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
      // Note: isPlaying will be determined dynamically based on audio activity
      updateVisualizationData();
    } catch (error) {
      handleError(error instanceof Error ? error.message : 'Failed to start microphone input');
    }
  }, [updateVisualizationData, cleanup, handleError]);

  const handleMicrophoneStop = useCallback(() => {
    setIsRecording(false);
    // Note: isPlaying will automatically be set to false when audio stops being detected
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
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          currentTime={currentTime}
          duration={duration}
        />
      )}

      {/* Input Type Selection */}
      {!inputType && (
        <div className="text-center space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
              Choose Audio Input
            </h2>
            <p style={{ color: 'var(--muted-foreground, #d1d5db)' }}>
              Select how you&apos;d like to provide audio for visualization
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* File Upload Option */}
            <button
              onClick={() => handleInputTypeSelect('file')}
              className="p-8 border rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ 
                borderColor: 'var(--border)',
                borderWidth: '1px'
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
                <div className="mx-auto w-12 h-12" style={{ color: 'var(--primary-light)' }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
                    Upload Audio File
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground, #9ca3af)' }}>
                    Choose an audio file from your device
                  </p>
                </div>
              </div>
            </button>

            {/* Playlist Option */}
            <button
              onClick={() => handleInputTypeSelect('playlist')}
              className="p-8 border rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ 
                borderColor: 'var(--border)',
                borderWidth: '1px'
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
                  <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground, #9ca3af)' }}>
                    Select from available audio tracks
                  </p>
                </div>
              </div>
            </button>

            {/* Microphone Option */}
            <button
              onClick={() => handleInputTypeSelect('microphone')}
              className="p-8 border rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ 
                borderColor: 'var(--border)',
                borderWidth: '1px'
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
                <div className="mx-auto w-12 h-12" style={{ color: 'var(--primary-light)' }}>
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium" style={{ color: 'var(--foreground)' }}>
                    Use Microphone
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground, #9ca3af)' }}>
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
              color: 'var(--muted-foreground, #9ca3af)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--foreground)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--muted-foreground, #9ca3af)';
            }}
          >
            ← Choose Different Input
          </button>
        </div>
      )}
    </div>
  );
}
