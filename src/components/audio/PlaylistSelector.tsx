'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PlaylistTrack, AudioFile } from '@/types/audio';
import { AudioUtils } from '@/utils/audioUtils';

interface PlaylistSelectorProps {
  onTrackSelect: (audioFile: AudioFile) => void;
  onError: (error: string) => void;
  isProcessing: boolean;
}

export default function PlaylistSelector({ onTrackSelect, onError, isProcessing }: PlaylistSelectorProps) {
  const [tracks, setTracks] = useState<PlaylistTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<PlaylistTrack | null>(null);

  const loadPlaylist = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get the base path from the current location
      const basePath = window.location.pathname.startsWith('/aquarius') ? '/aquarius' : '';
      
      // Try to load sample tracks metadata
      const response = await fetch(`${basePath}/audio/sample-tracks.json`);
      if (response.ok) {
        const sampleTracks = await response.json() as { name: string; filename: string; description?: string; duration?: number; bpm?: number; genre?: string }[];
        
        // Convert to PlaylistTrack format and add URLs
        const playlistTracks: PlaylistTrack[] = sampleTracks.map((track) => ({
          ...track,
          url: `${basePath}/audio/${track.filename}`
        }));
        
        // Filter tracks that actually exist by attempting to fetch them
        const existingTracks: PlaylistTrack[] = [];
        const missingTracks: string[] = [];
        
        for (const track of playlistTracks) {
          try {
            const audioResponse = await fetch(track.url, { method: 'HEAD' });
            if (audioResponse.ok) {
              existingTracks.push(track);
            } else {
              missingTracks.push(track.filename);
              console.warn(`Audio file not found: ${track.filename} (${audioResponse.status})`);
            }
          } catch (error) {
            missingTracks.push(track.filename);
            console.warn(`Failed to check audio file: ${track.filename}`, error);
          }
        }
        
        if (missingTracks.length > 0) {
          console.warn(`Missing audio files: ${missingTracks.join(', ')}`);
        }
        
        setTracks(existingTracks);
      } else {
        // sample-tracks.json not found
        console.warn(`Playlist metadata not found at ${basePath}/audio/sample-tracks.json`);
        onError(`Playlist metadata file not found. Please ensure sample-tracks.json exists in the public/audio/ directory.`);
        setTracks([]);
      }
    } catch (error) {
      console.error('Failed to load playlist:', error);
      onError('Failed to load playlist. Please check that audio files are available.');
      setTracks([]);
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    loadPlaylist();
  }, [loadPlaylist]);

  const handleTrackSelect = useCallback(async (track: PlaylistTrack) => {
    try {
      setSelectedTrack(track);
      
      // Create a temporary file object from the track URL
      const response = await fetch(track.url);
      if (!response.ok) {
        throw new Error(`Failed to load track "${track.name}": ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Validate file format
      if (!blob.type.startsWith('audio/') && !AudioUtils.isValidAudioExtension(track.filename)) {
        throw new Error(`Unsupported file format for "${track.name}". Expected audio file but got ${blob.type || 'unknown type'}.`);
      }
      
      const file = new File([blob], track.filename, { 
        type: blob.type || AudioUtils.getFormatFromExtension(track.filename) 
      });
      
      // Validate file size
      if (!AudioUtils.isValidFileSize(file)) {
        throw new Error(`File "${track.name}" is too large. Maximum size is 50MB.`);
      }
      
      // Create AudioFile object
      const audioFile = await AudioUtils.createAudioFile(file);
      
      // Add specified BPM if this is from playlist
      if (track.bpm) {
        audioFile.specifiedBpm = track.bpm;
      }
      
      onTrackSelect(audioFile);
    } catch (error) {
      onError(error instanceof Error ? error.message : `Failed to load selected track: ${track.name}`);
      setSelectedTrack(null);
    }
  }, [onTrackSelect, onError]);

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p style={{ color: 'var(--muted-foreground)' }}>Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                No Audio Files Found
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                To use the playlist feature, add audio files to the <code className="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">public/audio/</code> directory.
              </p>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">
                <p className="mb-2"><strong>Supported formats:</strong> MP3, WAV, OGG, M4A</p>
                <p className="mb-2"><strong>File size limit:</strong> 50MB per file</p>
                <p><strong>After adding files:</strong> Restart the development server</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          Choose from Playlist
        </h3>
        <p style={{ color: 'var(--muted-foreground)' }}>
          Select a track from the available audio files
        </p>
      </div>

      <div className="grid gap-4">
        {tracks.map((track, index) => (
          <div
            key={index}
            className={`
              p-4 border-2 rounded-lg transition-all duration-200 cursor-pointer
              ${selectedTrack === track
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
              }
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => !isProcessing && handleTrackSelect(track)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {track.name}
                  </h4>
                  {track.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {track.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {track.duration && (
                      <span>{track.duration}s</span>
                    )}
                    {track.bpm && (
                      <span>{track.bpm} BPM</span>
                    )}
                    {track.genre && (
                      <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {track.genre}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedTrack === track && (
                <div className="text-blue-600 dark:text-blue-400">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isProcessing && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading track...</p>
        </div>
      )}
    </div>
  );
}