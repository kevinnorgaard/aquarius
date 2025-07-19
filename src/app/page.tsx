'use client';

import React, { useState, useCallback } from 'react';
import { AudioVisualizationData, AudioInputState, GLTFFile, GLTFState } from '@/types/audio';
import AudioInputSelector from '@/components/audio/AudioInputSelector';
import AudioVisualizer from '@/components/audio/AudioVisualizer';
import GLTFUpload from '@/components/audio/GLTFUpload';
import GLTFVisualizer from '@/components/audio/GLTFVisualizer';

export default function Home() {
  const [audioData, setAudioData] = useState<AudioVisualizationData | null>(null);
  const [audioState, setAudioState] = useState<AudioInputState | null>(null);
  const [gltfState, setGltfState] = useState<GLTFState>({
    gltfFile: null,
    isLoading: false,
    error: null
  });

  const handleAudioData = useCallback((data: AudioVisualizationData) => {
    setAudioData(data);
  }, []);

  const handleStateChange = useCallback((state: AudioInputState) => {
    setAudioState(state);
  }, []);

  const handleGLTFFileSelect = useCallback((file: GLTFFile) => {
    setGltfState(prev => ({
      ...prev,
      gltfFile: file,
      isLoading: false,
      error: null
    }));
  }, []);

  const handleGLTFError = useCallback((error: string) => {
    setGltfState(prev => ({
      ...prev,
      error,
      isLoading: false
    }));
  }, []);

  const handleRemoveGLTF = useCallback(() => {
    if (gltfState.gltfFile) {
      URL.revokeObjectURL(gltfState.gltfFile.url);
    }
    setGltfState({
      gltfFile: null,
      isLoading: false,
      error: null
    });
  }, [gltfState.gltfFile]);

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
                audioState.type === 'playlist' ? 'bg-purple-400' :
                audioState.type === 'microphone' ? 'bg-green-400' :
                'bg-gray-400'
              }`} />
              <span className="text-sm text-white">
                {audioState.type === 'file' ? 'File Input Active' :
                 audioState.type === 'playlist' ? 'Playlist Track Active' :
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

          {/* glTF Upload Section */}
          <section className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white mb-2">
                3D Model Upload
              </h2>
              <p className="text-gray-300">
                Upload a glTF file to create audio-responsive 3D visualizations
              </p>
            </div>
            
            {gltfState.error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-700 dark:text-red-400">{gltfState.error}</p>
                </div>
              </div>
            )}

            {gltfState.gltfFile ? (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{gltfState.gltfFile.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {Math.round(gltfState.gltfFile.size / 1024)} KB • {gltfState.gltfFile.format}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveGLTF}
                    className="text-red-600 hover:text-red-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <GLTFUpload
                onFileSelect={handleGLTFFileSelect}
                onError={handleGLTFError}
                isProcessing={gltfState.isLoading}
              />
            )}
          </section>

          {/* 3D Visualization Section */}
          {gltfState.gltfFile && (
            <section className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <GLTFVisualizer
                gltfFile={gltfState.gltfFile}
                audioData={audioData}
                width={800}
                height={800}
              />
            </section>
          )}

          {/* 2D Audio Visualization Section */}
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
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium">Upload 3D Models</h3>
                <p className="text-sm">
                  Upload glTF (.gltf or .glb) files to create stunning 3D visualizations that respond to audio frequencies with dynamic animations.
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
