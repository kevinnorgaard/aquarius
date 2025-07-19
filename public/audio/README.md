# Audio Files Directory

This directory contains audio files that users can select from the built-in playlist feature.

## Supported Formats
- MP3 (.mp3)
- WAV (.wav)
- OGG (.ogg)
- M4A (.m4a)
- AAC (.aac)
- MP4 (.mp4)

## Adding Audio Files

To add your own audio files to the playlist:

### Step 1: Add Audio Files
1. Place audio files directly in this directory (`public/audio/`)
2. Supported formats: MP3, WAV, OGG, M4A, AAC, MP4
3. Maximum file size: 50MB per file
4. Files must be accessible via the web server

### Step 2: Update Metadata (Required)
Edit the `sample-tracks.json` file to include metadata for your new tracks:

```json
[
  {
    "name": "Artist - Track Name",
    "filename": "your-audio-file.mp3",
    "description": "Genre description at BPM",
    "duration": 240,
    "bpm": 120,
    "genre": "Electronic"
  }
]
```

**Required fields:**
- `name`: Display name for the track
- `filename`: Exact filename of the audio file

**Optional fields:**
- `description`: Brief description (e.g., "Electronic at 128 BPM")
- `duration`: Track duration in seconds
- `bpm`: Beats per minute
- `genre`: Music genre

### Step 3: Verify Setup
1. Restart the development server (`npm run dev`)
2. Navigate to the Aquarius application at `/aquarius`
3. Select "Choose from Playlist" 
4. Verify your new tracks appear in the list

## File Organization

**Important:** Currently, all audio files must be placed directly in the `public/audio/` directory. Subdirectories are not supported by the playlist feature.

## Error Handling

The application includes comprehensive error handling:
- **Missing files**: Tracks in `sample-tracks.json` that don't exist will be filtered out
- **Invalid formats**: Unsupported file formats will show an error message
- **Large files**: Files exceeding 50MB will be rejected with an informative error
- **Network issues**: Connection problems will display appropriate error messages

## Troubleshooting

**Track not appearing in playlist:**
1. Check that the file exists in `public/audio/`
2. Verify the filename in `sample-tracks.json` matches exactly
3. Ensure the file format is supported
4. Check browser console for error messages

**Track fails to load:**
1. Verify file is not corrupted
2. Check file size is under 50MB
3. Ensure file format is supported
4. Check browser network tab for 404 errors

## Current Files

- `skrillex_with_you_friends.mp3` - Sample Dubstep track (130 BPM, 382s)
- `sample-tracks.json` - Metadata configuration file

## Development Notes

The playlist functionality:
- Automatically detects the Next.js basePath configuration
- Validates file existence before displaying in the playlist
- Provides detailed error messages for debugging
- Supports all common audio formats via the Web Audio API