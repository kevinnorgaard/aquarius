'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { AudioVisualizationData, GLTFFile } from '@/types/audio';
import * as THREE from 'three';

interface AnimatedModelProps {
  gltfFile: GLTFFile;
  audioData: AudioVisualizationData | null;
}

function AnimatedModel({ gltfFile, audioData }: AnimatedModelProps) {
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

  // Split meshes for low and high frequency animation
  const lowFreqMeshes = useMemo(() => {
    return meshes.filter((_, index) => index < Math.ceil(meshes.length / 2));
  }, [meshes]);

  const highFreqMeshes = useMemo(() => {
    return meshes.filter((_, index) => index >= Math.ceil(meshes.length / 2));
  }, [meshes]);

  useFrame(() => {
    if (!audioData || !groupRef.current) return;

    const { lowFrequencyAverage, highFrequencyAverage, bpm, beatIntensity, isPlaying } = audioData;
    
    // For microphone input, we want smoother transitions rather than abrupt stops
    // We'll scale the animation intensity based on audio levels instead of stopping completely
    const animationScale = isPlaying ? 1.0 : 0.1; // Reduce animation intensity when not "playing" but don't stop completely

    // Animate low frequency meshes (bass response) - removed rotation
    lowFreqMeshes.forEach((mesh, index) => {
      const intensity = lowFrequencyAverage * 2; // Amplify the effect
      const offset = index * 0.1; // Stagger the animation
      
      // Scale animation (keep this)
      const scale = 1 + intensity * 0.3;
      mesh.scale.setScalar(scale);
      
      // Remove rotation, keep position animation
      mesh.position.y = Math.sin(Date.now() * 0.001 + offset) * intensity * 0.2;
    });

    // Animate high frequency meshes (treble response) - removed rapid rotation
    highFreqMeshes.forEach((mesh, index) => {
      const intensity = highFrequencyAverage * 2; // Amplify the effect
      const offset = index * 0.15; // Different stagger for variety
      
      // Position animation (more rapid movement for high frequencies)
      mesh.position.y = Math.sin(Date.now() * 0.005 + offset) * intensity * 0.5;
      mesh.position.z = Math.cos(Date.now() * 0.004 + offset) * intensity * 0.2;
    });

    // BPM-based left/right sliding animation for the whole model
    const beatTime = 60 / bpm; // Time between beats in seconds
    const beatPhase = (Date.now() / 1000) % beatTime; // Current position in beat cycle
    const beatProgress = beatPhase / beatTime; // 0-1 progress through current beat
    
    // Create a smooth sliding motion synchronized with the beat
    const slideX = Math.sin(beatProgress * Math.PI * 2) * 0.5 * (1 + beatIntensity);
    groupRef.current.position.x = slideX;
    
    // Add subtle vertical bounce on beat
    const bounceY = beatIntensity * Math.sin(beatProgress * Math.PI * 4) * 0.2;
    groupRef.current.position.y = bounceY;
    
    // Optional: slight Z-axis movement for depth
    const depthZ = Math.cos(beatProgress * Math.PI * 2) * 0.3 * beatIntensity;
    groupRef.current.position.z = depthZ;
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
        
        <div 
          className="relative border border-gray-600 rounded overflow-hidden"
          style={{ width: '100%', height: `${height}px`, maxWidth: `${width}px` }}
        >
          <Canvas
            camera={{ position: [0, 0, 5], fov: 50 }}
            style={{ width: '100%', height: '100%' }}
          >
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={0.3} />
            
            <AnimatedModel gltfFile={gltfFile} audioData={audioData} />
            
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
        
        <div className="mt-2 text-xs text-gray-400">
          <p>🎵 BPM detection drives left/right sliding • Low frequencies animate scale • High frequencies animate position</p>
        </div>
      </div>
    </div>
  );
}
