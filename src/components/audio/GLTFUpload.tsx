'use client';

import React, { useCallback, useState } from 'react';
import { GLTFFile } from '@/types/audio';
import { GLTFUtils } from '@/utils/gltfUtils';

interface GLTFUploadProps {
  onFileSelect: (file: GLTFFile) => void;
  onError: (error: string) => void;
  isProcessing?: boolean;
}

export default function GLTFUpload({ onFileSelect, onError, isProcessing = false }: GLTFUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      const gltfFile = await GLTFUtils.createGLTFFile(file);
      onFileSelect(gltfFile);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to process glTF file');
    }
  }, [onFileSelect, onError]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--foreground)' }}>
          Upload 3D Model (glTF)
        </h3>
        <p className="text-sm" style={{ color: '#9ca3af' }}>
          Upload a glTF (.gltf or .glb) file to visualize with audio-responsive animations
        </p>
      </div>

      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        style={{
          borderColor: isDragging ? 'var(--primary)' : 'var(--border)',
          backgroundColor: isDragging ? 'rgba(107, 127, 57, 0.1)' : 'transparent'
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onMouseEnter={(e) => {
          if (!isDragging && !isProcessing) {
            e.currentTarget.style.borderColor = 'var(--primary-light)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isDragging && !isProcessing) {
            e.currentTarget.style.borderColor = 'var(--border)';
          }
        }}
      >
        <input
          type="file"
          accept=".gltf,.glb,model/gltf+json,model/gltf-binary,application/octet-stream,application/json"
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />

        <div className="space-y-4">
          {isProcessing ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
              <span style={{ color: '#9ca3af' }}>Processing...</span>
            </div>
          ) : (
            <>
              <div className="mx-auto w-12 h-12" style={{ color: 'var(--muted)' }}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              <div>
                <p className="font-medium" style={{ color: 'var(--foreground)' }}>
                  {isDragging ? 'Drop your glTF file here' : 'Drop a glTF file here, or click to browse'}
                </p>
                <p className="text-sm mt-1" style={{ color: '#9ca3af' }}>
                  Supports .gltf and .glb files up to 100MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 text-xs" style={{ color: '#9ca3af' }}>
        <p className="mb-1">
          <strong>Supported formats:</strong> glTF (.gltf), Binary glTF (.glb)
        </p>
        <p>
          <strong>Tip:</strong> The model will animate in response to audio frequencies - low frequencies will animate one part, high frequencies another.
        </p>
      </div>
    </div>
  );
}