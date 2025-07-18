# Aquarius

A website that transforms music into dynamic 3D visualizations in real-time.

## Features

- **Audio File Upload**: Support for MP3, WAV, OGG, and M4A formats
- **Live Microphone Input**: Real-time audio visualization from microphone
- **Dynamic Visualizations**: Real-time frequency and time domain analysis
- **Responsive Design**: Built with Tailwind CSS for all screen sizes
- **Privacy First**: All audio processing happens locally in the browser

## Demo

Visit the live demo at: [https://kevinnorgaard.github.io/aquarius/](https://kevinnorgaard.github.io/aquarius/)

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
