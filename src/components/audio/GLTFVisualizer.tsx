'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AudioVisualizationData, GLTFFile } from '@/types/audio';
import * as THREE from 'three';

// Custom oscillator component that shows frequency threshold
function FrequencyVisualizer({ 
  audioData, 
  freqThreshold, 
  width = 200, 
  height = 100 
}: { 
  audioData: AudioVisualizationData | null; 
  freqThreshold: number;
  width?: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { frequencyData } = audioData;
    
    // Clear canvas
    ctx.fillStyle = 'rgb(31, 41, 55)'; // gray-800
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
    
    // Draw threshold line
    const thresholdX = width * freqThreshold;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(thresholdX, 0);
    ctx.lineTo(thresholdX, height);
    ctx.stroke();
    
    // Add labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('Low', thresholdX / 2, 12);
    ctx.fillText('High', thresholdX + (width - thresholdX) / 2, 12);
    
  }, [audioData, freqThreshold, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-auto border border-gray-600 rounded"
    />
  );
}

interface AnimatedModelProps {
  gltfFile: GLTFFile;
  audioData: AudioVisualizationData | null;
  freqThreshold: number;
  pulseIntensity: number;
}

function AnimatedModel({ gltfFile, audioData, freqThreshold, pulseIntensity }: AnimatedModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const gltf = useLoader(GLTFLoader, gltfFile.url);
  
  // Create a cloned scene to avoid modifying the original
  const scene = useMemo(() => gltf.scene.clone(), [gltf]);
  
  // Get meshes for animation
  const meshes = useMemo(() => {
    const allMeshes: THREE.Mesh[] = [];
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        allMeshes.push(child);
      }
    });
    return allMeshes;
  }, [scene]);

  // Split meshes for low and high frequency animation based on freqThreshold
  const lowFreqMeshes = useMemo(() => {
    const threshold = Math.floor(meshes.length * freqThreshold);
    return meshes.filter((_, index) => index < threshold);
  }, [meshes, freqThreshold]);

  const highFreqMeshes = useMemo(() => {
    const threshold = Math.floor(meshes.length * freqThreshold);
    return meshes.filter((_, index) => index >= threshold);
  }, [meshes, freqThreshold]);

  useFrame(() => {
    if (!audioData || !groupRef.current) return;

    const { frequencyData, bpm, beatIntensity, isPlaying } = audioData;
    
    // Only apply animation if audio is playing
    if (!isPlaying) return;
    
    // Calculate custom low frequency average based on the threshold slider
    const thresholdIndex = Math.floor(frequencyData.length * freqThreshold);
    let lowFreqSum = 0;
    for (let i = 0; i < thresholdIndex; i++) {
      lowFreqSum += frequencyData[i];
    }
    const customLowFreqAverage = thresholdIndex > 0 ? 
      lowFreqSum / thresholdIndex / 255 : 0; // Normalize to 0-1
    
    // Animate low frequency meshes (bass response)
    lowFreqMeshes.forEach((mesh) => {
      const intensity = customLowFreqAverage * 2; // Amplify the effect
      
      // Scale animation with user-controlled intensity
      const scale = 1 + intensity * pulseIntensity;
      mesh.scale.setScalar(scale);
    });
    
    // Calculate beat timing for the whole model
    const beatTime = 60 / bpm; // Time between beats in seconds
    const beatPhase = (Date.now() / 1000) % beatTime; // Current position in beat cycle
    const beatProgress = beatPhase / beatTime; // 0-1 progress through current beat
    
    // Create a subtle pulsing effect synchronized with the beat
    const pulseScale = 1 + Math.sin(beatProgress * Math.PI * 2) * 0.05 * beatIntensity * pulseIntensity;
    
    // Apply subtle scaling to the entire model based on the beat
    groupRef.current.scale.setScalar(pulseScale);
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

interface GLTFVisualizerProps {
  gltfFile: GLTFFile | null;
  audioData: AudioVisualizationData | null;
  width?: number;
  height?: number;
}

export default function GLTFVisualizer({ gltfFile, audioData, width = 800, height = 400 }: GLTFVisualizerProps) {
  // Add state for frequency threshold and pulse intensity
  const [freqThreshold, setFreqThreshold] = React.useState(0.33); // Default: 33% (1/3 of frequency range)
  const [pulseIntensity, setPulseIntensity] = React.useState(0.3); // Default: 0.3 (30% intensity)
  if (!gltfFile) {
    return (
      <div className="w-full">
        <div className="bg-slate-900 rounded-lg p-4 border border-gray-700">
          <div className="mb-2">
            <h3 className="text-lg font-medium text-white mb-1">
              3D Model Visualization
            </h3>
            <p className="text-sm text-gray-400">
              Upload a glTF file to see audio-responsive 3D animations
            </p>
          </div>
          
          <div 
            className="relative border border-gray-600 rounded flex items-center justify-center bg-gray-800"
            style={{ width: '100%', height: `${height}px`, maxWidth: `${width}px` }}
          >
            <div className="text-center text-gray-400">
              <div className="w-16 h-16 mx-auto mb-4 opacity-50">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p className="text-sm">No 3D model loaded</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-slate-900 rounded-lg p-4 border border-gray-700">
        <div className="mb-2">
          <h3 className="text-lg font-medium text-white mb-1">
            3D Model Visualization
          </h3>
          <p className="text-sm text-gray-400">
            {audioData 
              ? `Audio-responsive 3D animation: ${gltfFile.name}` 
              : `3D model loaded: ${gltfFile.name} (waiting for audio)`
            }
          </p>
        </div>
        
        <div className="flex gap-4">
          <div 
            className="relative border border-gray-600 rounded overflow-hidden flex-grow"
            style={{ height: `${height}px` }}
          >
            <Canvas
              camera={{ position: [0, 0, 5], fov: 50 }}
              style={{ width: '100%', height: '100%' }}
            >
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <pointLight position={[-10, -10, -10]} intensity={0.5} />
              <directionalLight position={[5, 5, 5]} intensity={0.3} />
              
              <AnimatedModel 
                gltfFile={gltfFile} 
                audioData={audioData} 
                freqThreshold={freqThreshold}
                pulseIntensity={pulseIntensity}
              />
              
              <OrbitControls 
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                autoRotate={!audioData} // Auto-rotate when no audio
                autoRotateSpeed={0.5}
              />
            </Canvas>
            
            {audioData && (
              <div className="absolute top-2 right-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
                <div>BPM: {Math.round(audioData.bpm)}{audioData.isBpmSpecified ? ' (Specified)' : ' (Detected)'}</div>
                <div>Beat: {Math.round(audioData.beatIntensity * 100)}%</div>
                <div>Low Freq: {Math.round(audioData.lowFrequencyAverage * 100)}%</div>
                <div>High Freq: {Math.round(audioData.highFrequencyAverage * 100)}%</div>
                <div>Playing: {audioData.isPlaying ? 'Yes' : 'No'}</div>
              </div>
            )}
          </div>
          
          {/* Controls panel */}
          <div className="w-64 bg-gray-800 rounded p-3 border border-gray-700 flex flex-col gap-4">
            {/* Frequency visualizer */}
            {audioData && (
              <div>
                <label className="block text-xs text-gray-300 mb-1">Frequency Spectrum</label>
                <FrequencyVisualizer 
                  audioData={audioData} 
                  freqThreshold={freqThreshold} 
                  width={240} 
                  height={80}
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs text-gray-300 mb-1">Frequency Threshold</label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={freqThreshold} 
                onChange={(e) => setFreqThreshold(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0 Hz</span>
                <span>{Math.round(freqThreshold * 22050)} Hz</span>
                <span>22050 Hz</span>
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-300 mb-1">Pulse Intensity</label>
              <input 
                type="range" 
                min="0" 
                max="1.0" 
                step="0.01" 
                value={pulseIntensity} 
                onChange={(e) => setPulseIntensity(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>{Math.round(pulseIntensity * 100)}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-400">
          <p>🎵 Audio visualization with frequency spectrum analysis • Model pulses subtly to the beat</p>
        </div>
      </div>
    </div>
  );
}
