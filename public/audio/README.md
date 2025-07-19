# Audio Files Directory

This directory contains sample audio files that users can select from the built-in playlist.

## Supported Formats
- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)
- M4A (.m4a)

## Adding Audio Files

To add your own audio files to the playlist:

1. Place audio files in this directory (`public/audio/`)
2. The application will automatically detect and include them in the playlist
3. Supported formats: MP3, WAV, OGG, M4A
4. Recommended file size: Under 50MB per file

## File Organization

You can organize files in subdirectories if desired:
- `public/audio/electronic/`
- `public/audio/rock/`
- `public/audio/classical/`

The application will scan all subdirectories for audio files.

## Sample Files

Due to copyright restrictions, sample audio files are not included in the repository. Users should add their own royalty-free or licensed audio files for testing the visualization features.

## Usage

Once audio files are added:
1. Restart the development server (`npm run dev`)
2. Navigate to the Aquarius application
3. Select "Choose from Playlist" in the audio input section
4. Browse and select from available audio files