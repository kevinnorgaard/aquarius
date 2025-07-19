#!/usr/bin/env node

/**
 * Generate sample audio files for testing the playlist functionality
 * This creates simple synthesized audio files for demonstration purposes
 */

const fs = require('fs');
const path = require('path');

// Create placeholder info file instead of actual audio (to avoid large files in repo)
const sampleTracks = [
  {
    name: 'Electronic Beat 120 BPM',
    filename: 'electronic-beat-120.mp3',
    description: 'Synthesized electronic beat at 120 BPM',
    duration: 30,
    bpm: 120,
    genre: 'Electronic'
  },
  {
    name: 'Rock Rhythm 140 BPM', 
    filename: 'rock-rhythm-140.mp3',
    description: 'Rock-style drum pattern at 140 BPM',
    duration: 30,
    bpm: 140,
    genre: 'Rock'
  },
  {
    name: 'Ambient Pulse 80 BPM',
    filename: 'ambient-pulse-80.mp3', 
    description: 'Slow ambient pulse at 80 BPM',
    duration: 30,
    bpm: 80,
    genre: 'Ambient'
  }
];

const audioDir = path.join(__dirname, '../public/audio');

// Create sample tracks metadata
const metadataPath = path.join(audioDir, 'sample-tracks.json');
fs.writeFileSync(metadataPath, JSON.stringify(sampleTracks, null, 2));

console.log('Sample track metadata created at:', metadataPath);
console.log('\nTo test with actual audio files:');
console.log('1. Add MP3/WAV files to public/audio/ directory');
console.log('2. Use filenames from sample-tracks.json or add your own');
console.log('3. Restart the development server');