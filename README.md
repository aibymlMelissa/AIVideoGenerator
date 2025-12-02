# AI Video Generator - Memory Animator

Transform your cherished photos into beautiful, animated videos using Google's Gemini Veo AI model.

![AI Memory Animator](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## Overview

AI Memory Animator is a React-based web application that brings your static photos to life. Upload an image, describe how you want it animated, and watch as Google's Gemini Veo model generates a dynamic video from your memory.

## Features

- **AI-Powered Video Generation**: Leverages Google Gemini's Veo model to create animated videos from static images
- **Customizable Prompts**: Describe exactly how you want your image animated
- **Flexible Aspect Ratios**: Support for 16:9, 9:16, and 1:1 video formats
- **Google Drive Integration**: Share your generated videos directly to Google Drive
- **Download Videos**: Save your animated memories locally
- **Beautiful UI**: Modern, responsive interface with animated backgrounds
- **API Key Management**: Seamless integration with Google AI Studio for API key selection

## Tech Stack

- **Frontend**: React 19.2 with TypeScript
- **Build Tool**: Vite 6.2
- **AI Integration**: Google Generative AI SDK (@google/genai)
- **Styling**: Tailwind CSS (via inline classes)
- **Deployment**: Compatible with Google AI Studio

## Project Structure

```
ai-videogenerator/
├── components/
│   ├── ApiKeySelector.tsx      # Google AI API key selection component
│   ├── LoadingIndicator.tsx    # Loading state UI with animated messages
│   └── VideoGeneratorForm.tsx  # Main form for image upload and prompt input
├── services/
│   ├── geminiService.ts        # Gemini API integration for video generation
│   └── googleDriveService.ts   # Google Drive sharing functionality
├── utils/
│   └── fileUtils.ts            # File handling utilities
├── App.tsx                     # Main application component
├── index.tsx                   # Application entry point
├── types.ts                    # TypeScript type definitions
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Project dependencies
└── metadata.json              # App metadata for AI Studio
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- A Google Gemini API key ([Get one here](https://aistudio.google.com/apikey))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/aibymlMelissa/AIQuickChat.git
   cd AIQuickChat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your Gemini API key:
   - Create a `.env.local` file in the project root
   - Add your API key:
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Select API Key**: On first launch, select your Google Gemini API key
2. **Upload Image**: Click to upload a photo you want to animate
3. **Choose Aspect Ratio**: Select 16:9 (landscape), 9:16 (portrait), or 1:1 (square)
4. **Write Prompt**: Describe how you want the image animated (e.g., "gentle camera pan with subtle motion")
5. **Generate**: Click "Generate Memory" and wait for the AI to create your video
6. **Download or Share**: Save the video locally or share directly to Google Drive

## Key Components

### ApiKeySelector
Handles Google Gemini API key selection and validation through the AI Studio interface.

### VideoGeneratorForm
Main form component that manages:
- Image upload and preview
- Aspect ratio selection
- Prompt input
- Video generation trigger

### LoadingIndicator
Displays animated loading states with progress messages during video generation.

### geminiService
Core service that:
- Uploads images to Gemini API
- Initiates video generation requests
- Polls for completion status
- Returns generated video URLs

### googleDriveService
Manages Google Drive OAuth and file upload for sharing functionality.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Environment Variables

- `GEMINI_API_KEY` - Your Google Gemini API key (optional, can be set via AI Studio)

## Deployment

This app is designed to work with [Google AI Studio](https://ai.studio/). You can also deploy it to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

## Browser Support

Modern browsers with support for:
- ES2020+
- Web APIs (File, Blob, URL)
- Video playback
- OAuth 2.0

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Powered by [Google Gemini Veo](https://deepmind.google/technologies/veo/)
- Built with [React](https://react.dev/) and [Vite](https://vitejs.dev/)

## Support

For issues and questions, please open an issue on GitHub or contact aibyml.com@gmail.com
