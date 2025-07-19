# Shadcn UI Integration Documentation

## Overview

This document outlines the integration of Shadcn UI styling into the Aquarius project, implementing a black background with olive green accents theme.

## Integration Steps

### 1. Dependencies Installation

The following packages were installed to support Shadcn UI:

```bash
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react tailwindcss-animate
```

### 2. CSS Custom Properties Setup

Created a comprehensive color system using CSS custom properties in `src/app/globals.css`:

```css
:root {
  /* Base colors */
  --background: #000000; /* Pure black */
  --foreground: #f8f9fa; /* Near white */
  
  /* Olive green palette */
  --primary: #6b7f39; /* Olive green */
  --primary-light: #8fa55c; /* Lighter olive */
  --primary-dark: #4a5527; /* Darker olive */
  
  /* UI colors */
  --card: #0a0a0a; /* Very dark gray */
  --muted: #404040; /* Medium gray */
  --border: #262626; /* Dark border */
  --destructive: #dc2626; /* Red for errors */
}
```

### 3. Utility Function

Created `src/lib/utils.ts` for className merging:

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Color Scheme Implementation

### Background Colors
- **Main Background**: Pure black (`#000000`) replacing the previous purple gradient
- **Card Backgrounds**: Semi-transparent dark cards (`rgba(10, 10, 10, 0.5)`) with backdrop blur
- **Borders**: Dark gray borders (`#262626`) for subtle definition

### Accent Colors
- **Primary Olive**: `#6b7f39` - Used for main interactive elements and primary icons
- **Lighter Olive**: `#8fa55c` - Used for secondary accents and hover states
- **Darker Olive**: `#4a5527` - Used for darker variants when needed

### Text Colors
- **Primary Text**: Near-white (`#f8f9fa`) for headings and important text
- **Secondary Text**: Light gray (`#d1d5db`) for descriptions and secondary content
- **Muted Text**: Medium gray (`#9ca3af`) for less important text and hints

## Component Updates

### Main Page (`src/app/page.tsx`)
- Replaced `bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900` with `style={{ backgroundColor: 'var(--background)' }}`
- Updated all text colors to use CSS custom properties
- Changed accent colors from blue/purple/green to olive green variants

### Audio Input Selector (`src/components/audio/AudioInputSelector.tsx`)
- Updated button hover states to use olive green colors
- Replaced gray-based color scheme with CSS custom properties
- Added hover effects using inline styles for better control

### GLTF Upload (`src/components/audio/GLTFUpload.tsx`)
- Updated drag-and-drop interface colors
- Changed loading spinner color to olive green
- Updated all text colors to match the new theme

## Design System Features

### Interactive States
- **Hover Effects**: Buttons change border color to olive green variants on hover
- **Active States**: Selected inputs show olive green indicators
- **Loading States**: Spinners and progress indicators use olive green

### Accessibility
- High contrast maintained with near-white text on black background
- Focus states preserved with appropriate ring colors
- Color combinations tested for readability

### Responsive Design
- All existing responsive breakpoints maintained
- Color scheme works consistently across all screen sizes
- Dark theme optimized for different viewing conditions

## Browser Compatibility

The implementation uses modern CSS custom properties and is compatible with:
- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 16+

## Testing

All components have been tested for:
- Visual consistency across the interface
- Interactive state functionality
- Error state styling
- Loading state animations
- Responsive behavior

## Maintenance

To update colors in the future:
1. Modify CSS custom properties in `src/app/globals.css`
2. Colors will automatically propagate throughout the application
3. No need to update individual component files

## Performance Impact

- Minimal performance impact as CSS custom properties are native browser features
- No additional runtime JavaScript for color management
- Smaller bundle size compared to CSS-in-JS solutions