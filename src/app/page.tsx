'use client';

import React, { useState, useCallback } from 'react';
import { AudioVisualizationData, AudioInputState } from '@/types/audio';
import AudioInputSelector from '@/components/audio/AudioInputSelector';
import AudioVisualizer from '@/components/audio/AudioVisualizer';

export default function Home() {
  const [audioData, setAudioData] = useState<AudioVisualizationData | null>(null);
  const [audioState, setAudioState] = useState<AudioInputState | null>(null);

  const handleAudioData = useCallback((data: AudioVisualizationData) => {
    setAudioData(data);
  }, []);

  const handleStateChange = useCallback((state: AudioInputState) => {
    setAudioState(state);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Aquarius
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Transform music into dynamic 3D visualizations in real-time
          </p>
          
          {/* Status Indicator */}
          {audioState && (
            <div className="mt-6 inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <div className={`w-2 h-2 rounded-full ${
                audioState.type === 'file' ? 'bg-blue-400' :
                audioState.type === 'microphone' ? 'bg-green-400' :
                'bg-gray-400'
              }`} />
              <span className="text-sm text-white">
                {audioState.type === 'file' ? 'File Input Active' :
                 audioState.type === 'microphone' ? 'Microphone Active' :
                 'No Input'}
                {audioState.isRecording && ' • Recording'}
                {audioState.isProcessing && ' • Processing'}
              </span>
            </div>
          )}
        </header>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Audio Input Section */}
          <section className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <AudioInputSelector
              onAudioData={handleAudioData}
              onStateChange={handleStateChange}
            />
          </section>

          {/* Visualization Section */}
          {(audioData || audioState?.type) && (
            <section className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <AudioVisualizer
                audioData={audioData}
                width={800}
                height={200}
              />
            </section>
          )}

          {/* Information Section */}
          <section className="text-center text-gray-300">
            <h2 className="text-2xl font-semibold mb-4">
              How It Works
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="space-y-3">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium">Upload Audio Files</h3>
                <p className="text-sm">
                  Drag and drop or select audio files in MP3, WAV, OGG, or M4A format. 
                  Files are processed locally for privacy and performance.
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium">Live Microphone Input</h3>
                <p className="text-sm">
                  Record audio directly from your microphone for real-time visualization. 
                  Perfect for live music, singing, or any ambient audio.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
