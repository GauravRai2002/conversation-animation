# Conversation Animation

A Next.js application featuring an interactive conversation interface with animated spheres and ElevenLabs AI integration.

## Features

- **Dual Character Interface**: Choose between Maya and Miles for conversation
- **Dynamic Sphere Animation**: 
  - Main sphere reacts to user microphone input in real-time
  - Background sphere animates when AI is speaking with heartbeat effect
  - Smooth transitions between square and sphere modes
- **ElevenLabs Integration**: Real-time conversational AI with audio monitoring
- **Timer Display**: Shows elapsed conversation time with recording indicator
- **Responsive Design**: Clean, modern interface with hover effects

## Technology Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **ElevenLabs React SDK** for conversational AI
- **CSS-in-JS** for animations and styling
- **Web Audio API** for real-time audio level monitoring

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open [http://localhost:3000](http://localhost:3000)** to view the application

## How It Works

### Interface Modes

**Square Mode (Initial State):**
- Split interface showing Maya (top) and Miles (bottom)
- Hover effects expand the selected character section
- Click to initiate conversation

**Sphere Mode (Active Conversation):**
- Transforms into dual-sphere interface
- Main sphere (foreground) reacts to user speech
- Background sphere pulses when AI is speaking
- Expanding ring animation during AI speech

### Audio Monitoring

- **User Audio**: Monitors microphone input to animate the main sphere
- **AI Audio**: Detects when AI is speaking to trigger background animations
- **Real-time Processing**: Uses Web Audio API for low-latency audio analysis

### Animation Features

- **Morphing Transition**: Smooth transformation from square to spheres
- **Audio Reactivity**: Real-time scaling based on audio levels
- **Heartbeat Effect**: Background sphere pulses during AI speech
- **Speaking Rings**: Expanding ring animation when AI is active

## Project Structure

```
src/
├── app/
│   └── page.tsx          # Main homepage component with all functionality
├── components/           # (Future component organization)
└── styles/              # (Additional styling if needed)
```

## Key Components

### Main Features in `page.tsx`:

- **Conversation Management**: ElevenLabs integration and session handling
- **Audio Monitoring**: Real-time microphone and AI audio level detection
- **Animation Control**: State management for sphere animations and transitions
- **UI Components**: Header with timer, main interface, and footer

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [ElevenLabs React SDK](https://elevenlabs.io/docs)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

## Deploy on Vercel

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
