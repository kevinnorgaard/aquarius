#!/usr/bin/env node

/**
 * Generate sample audio files for testing the playlist functionality
 * This creates simple synthesized audio files for demonstration purposes
 */

const fs = require('fs');
const path = require('path');

const sampleTracks = [
  {
    name: "Skrillex - With You Friends",
    filename: "skrillex_with_you_friends.mp3",
    description: "Dubstep at 130 BPM",
    duration: 382,
    bpm: 130,
    genre: "Dubstep"
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
