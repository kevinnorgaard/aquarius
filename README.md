# Aquarius

A website that transforms music into dynamic 3D visualizations in real-time.

## Features

- **Audio File Upload**: Support for MP3, WAV, OGG, and M4A formats
- **Built-in Playlist**: Choose from pre-loaded audio tracks for instant visualization
- **Live Microphone Input**: Real-time audio visualization from microphone
- **BPM Detection**: Automatic beats per minute detection for rhythm-based animations
- **3D Model Visualization**: Upload glTF models that respond to audio with beat-synchronized movement
- **Dynamic Visualizations**: Real-time frequency and time domain analysis
- **Responsive Design**: Built with Tailwind CSS for all screen sizes
- **Privacy First**: All audio processing happens locally in the browser

## Demo

Visit the live demo at: [https://kevinnorgaard.github.io/aquarius/](https://kevinnorgaard.github.io/aquarius/)

## Audio Playlist Setup

To use the playlist feature:

1. Add audio files to the `public/audio/` directory
2. Supported formats: MP3, WAV, OGG, M4A (max 50MB per file)
3. Restart the development server
4. Navigate to "Choose from Playlist" in the audio input section

See `public/audio/README.md` for detailed instructions.

## 3D Model Visualization

Upload glTF (.gltf or .glb) files to create audio-responsive 3D visualizations:

- **BPM Synchronization**: Models slide left/right in sync with detected beats
- **Frequency Response**: Low frequencies control scaling, high frequencies control positioning
- **Real-time Analysis**: Live BPM detection and beat intensity tracking

## Getting Started

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Building for Production

To build the project for production:

```bash
npm run build
```

To export as static files for GitHub Pages:

```bash
npm run export
```

The static files will be generated in the `out` directory.

## Deployment

This project is configured for automatic deployment to GitHub Pages using GitHub Actions. Any push to the `main` branch will trigger a build and deployment.

### Manual Deployment

1. Build the static export: `npm run export`
2. Deploy the contents of the `out` directory to your web server

## Technology Stack

- **Next.js 15.2.0** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Web Audio API** - Audio processing and visualization

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
