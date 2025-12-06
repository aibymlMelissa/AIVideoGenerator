import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ApiKeySelector } from './components/ApiKeySelector';
import { VideoGeneratorForm } from './components/VideoGeneratorForm';
import { LoadingIndicator } from './components/LoadingIndicator';
import { generateVideo } from './services/geminiService';
import { shareVideoToDrive } from './services/googleDriveService';
import type { AspectRatio } from './types';

// Extend the Window interface to include the aistudio object and Google Identity Services
declare global {
  // FIX: The original anonymous type for `aistudio` conflicted with another declaration.
  // Defining a named `AIStudio` interface resolves this type conflict.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (tokenResponse: { access_token: string; error?: string; error_description?: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
        };
      };
    };
  }
}

const App: React.FC = () => {
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
  const [isCheckingApiKey, setIsCheckingApiKey] = useState<boolean>(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  const checkApiKey = useCallback(async () => {
    setIsCheckingApiKey(true);
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setApiKeySelected(hasKey);
    } else {
      // If aistudio is not available, assume we are in a different environment
      // and a key might be set via process.env. For this app, we'll hide the selector.
      setApiKeySelected(true); 
    }
    setIsCheckingApiKey(false);
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  // Clean up the object URL when the component unmounts or the URL changes to prevent memory leaks
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);


  const handleApiKeySelected = () => {
    setApiKeySelected(true);
  };
  
  const handleGenerationStart = () => {
    setIsGenerating(true);
    // Setting videoUrl to null will trigger the useEffect cleanup for the old URL
    setVideoUrl(null);
    setError(null);
    setShareUrl(null); // Reset share URL on new generation
    setShareError(null); // Reset share error
  };

  const handleGeneration = async (images: { data: string; mimeType: string }[], prompt: string, aspectRatio: AspectRatio) => {
    handleGenerationStart();
    try {
        const url = await generateVideo(images, prompt, aspectRatio, setLoadingMessage);
        setVideoUrl(url);
    } catch (e) {
        const err = e as Error;
        console.error(err);
        if (err.message.includes("Requested entity was not found")) {
            setError("API Key validation failed. Please select a valid API key.");
            setApiKeySelected(false); // Force re-selection
        } else {
            setError(`An error occurred during video generation: ${err.message}`);
        }
    } finally {
        setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = 'ai-memory.mp4';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (!videoUrl) return;
    setIsSharing(true);
    setShareUrl(null);
    setShareError(null);
    try {
      const url = await shareVideoToDrive(videoUrl);
      setShareUrl(url);
    } catch (e) {
      setShareError((e as Error).message);
    } finally {
      setIsSharing(false);
    }
  };

  const renderContent = () => {
    if (isCheckingApiKey) {
      return <div className="text-white">Checking API Key status...</div>;
    }
    if (!apiKeySelected) {
      return <ApiKeySelector onApiKeySelected={handleApiKeySelected} error={error} />;
    }
    return <VideoGeneratorForm onGenerate={handleGeneration} isGenerating={isGenerating} />;
  };

  return (
    <div className="relative min-h-screen w-full bg-slate-900 text-white overflow-hidden">
      {videoUrl && (
        <video
          key={videoUrl}
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
          src={videoUrl}
          autoPlay
          loop
          muted
          playsInline
        />
      )}
      <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-60 z-10"></div>
      
      <main className="relative z-20 flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Video Generator - Memory Animator
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-slate-300">
            Bring cherished memories to life. Turn static photos into a beautiful, animated memory video.
          </p>
        </div>

        <div className="w-full max-w-2xl bg-slate-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-700">
          {isGenerating ? <LoadingIndicator message={loadingMessage} /> : renderContent()}
        </div>

        {videoUrl && !isGenerating && (
          <div className="mt-8 flex flex-col items-center space-y-4">
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={handleDownload}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-green-500 flex items-center space-x-2 shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span>Download Memory</span>
              </button>
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500 flex items-center space-x-2 shadow-lg disabled:bg-slate-500 disabled:cursor-not-allowed"
              >
                {isSharing ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                )}
                <span>{isSharing ? 'Sharing...' : 'Share to Drive'}</span>
              </button>
            </div>
            
            {shareUrl && (
              <div className="mt-4 p-3 w-full max-w-md bg-green-900/50 rounded-lg text-center">
                <p className="text-green-300">Share successful! Link:</p>
                <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-300 hover:text-cyan-200 break-all underline">
                  {shareUrl}
                </a>
              </div>
            )}
            
            {shareError && (
              <div className="mt-4 p-3 w-full max-w-md bg-red-900/50 rounded-lg text-center text-red-400">
                <p>{shareError}</p>
              </div>
            )}

          </div>
        )}

        {error && !isGenerating && !apiKeySelected && (
           <div className="mt-4 text-center text-red-400 font-semibold p-3 bg-red-900/50 rounded-lg">
             {error}
           </div>
        )}
      </main>
    </div>
  );
};

export default App;