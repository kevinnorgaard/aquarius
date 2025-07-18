'use client';

import React, { useState, useRef, useCallback } from 'react';
import { AudioFile } from '@/types/audio';
import { AudioUtils } from '@/utils/audioUtils';

interface FileUploadProps {
  onFileSelect: (audioFile: AudioFile) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
}

export default function FileUpload({ onFileSelect, onError, isProcessing }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = useCallback(async (file: File) => {
    try {
      setUploadProgress(10);
      const audioFile = await AudioUtils.createAudioFile(file);
      setUploadProgress(100);
      onFileSelect(audioFile);
    } catch (error) {
      setUploadProgress(0);
      onError(error instanceof Error ? error.message : 'Failed to process file');
    }
  }, [onFileSelect, onError]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    handleFileProcess(file);
  }, [handleFileProcess]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);

  const handleClick = useCallback(() => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  }, [isProcessing]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label="Upload audio file"
        aria-describedby="file-upload-description"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
          onChange={handleInputChange}
          className="hidden"
          aria-hidden="true"
          disabled={isProcessing}
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 text-gray-400">
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
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {isProcessing ? 'Processing...' : isDragOver ? 'Drop your audio file here' : 'Choose an audio file'}
            </p>
            <p 
              id="file-upload-description"
              className="text-sm text-gray-500 dark:text-gray-400 mt-1"
            >
              or drag and drop it here
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Supports MP3, WAV, OGG, M4A files up to 50MB
            </p>
          </div>
          
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}