import React, { useState, useCallback } from 'react';
import { fileToGenerativePart } from '../utils/fileUtils';
import { suggestPrompts } from '../services/geminiService';
import type { AspectRatio } from '../types';

interface VideoGeneratorFormProps {
  onGenerate: (image: { data: string; mimeType: string }, prompt: string, aspectRatio: AspectRatio) => void;
  isGenerating: boolean;
}

const UploadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

export const VideoGeneratorForm: React.FC<VideoGeneratorFormProps> = ({ onGenerate, isGenerating }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('Bring this memory to life with gentle, nostalgic motion.');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB.');
        return;
      }
      setError(null);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setSuggestions([]); // Reset suggestions on new file
    }
  };
  
  const handleSuggestPrompts = useCallback(async () => {
    if (!imageFile) return;

    setIsSuggesting(true);
    setError(null);
    setSuggestions([]);

    try {
        const imagePart = await fileToGenerativePart(imageFile);
        const newSuggestions = await suggestPrompts(imagePart);
        setSuggestions(newSuggestions);
    } catch (e) {
        setError(`Failed to get suggestions: ${(e as Error).message}`);
    } finally {
        setIsSuggesting(false);
    }
  }, [imageFile]);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (!imageFile || !prompt) {
      setError('Please provide an image and a prompt.');
      return;
    }
    setError(null);
    try {
      const imagePart = await fileToGenerativePart(imageFile);
      onGenerate(imagePart, prompt, aspectRatio);
    } catch (e) {
      setError(`Failed to process image: ${(e as Error).message}`);
    }
  }, [imageFile, prompt, aspectRatio, onGenerate]);
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="file-upload" className="block text-sm font-medium text-slate-300 mb-2">Upload Photo</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="mx-auto h-24 w-auto rounded-md" />
            ) : (
              <UploadIcon />
            )}
            <div className="flex text-sm text-slate-400">
              <label htmlFor="file-upload" className="relative cursor-pointer bg-slate-800 rounded-md font-medium text-cyan-400 hover:text-cyan-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-slate-900 focus-within:ring-cyan-500">
                <span>{imageFile ? 'Change photo' : 'Upload a photo'}</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
              </label>
              <p className="pl-1">{imageFile ? imageFile.name : 'or drag and drop'}</p>
            </div>
            <p className="text-xs text-slate-500">PNG, JPG, WEBP up to 10MB</p>
          </div>
        </div>
        {imageFile && (
            <div className="mt-4 text-center">
                <button
                    type="button"
                    onClick={handleSuggestPrompts}
                    disabled={isSuggesting || isGenerating}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
                >
                    {isSuggesting && (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {isSuggesting ? 'Analyzing Memory...' : '✨ Suggest Prompts'}
                </button>
            </div>
        )}
      </div>

      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-slate-300">Prompt</label>
        <textarea
          id="prompt"
          name="prompt"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="mt-1 block w-full bg-slate-900/50 border border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm text-white"
          placeholder="e.g., The gentle sway of the trees on that sunny afternoon"
        />
      </div>
      
      {suggestions.length > 0 && !isSuggesting && (
          <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-400">Suggestions</label>
              <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                      <button
                          key={index}
                          type="button"
                          onClick={() => setPrompt(suggestion)}
                          className="px-3 py-1 text-sm bg-slate-700 text-slate-200 rounded-full hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500"
                          title={suggestion}
                      >
                          {suggestion}
                      </button>
                  ))}
              </div>
          </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300">Aspect Ratio</label>
        <div className="mt-2 flex space-x-4">
          {(['16:9', '9:16'] as AspectRatio[]).map((ratio) => (
            <label key={ratio} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="aspectRatio"
                value={ratio}
                checked={aspectRatio === ratio}
                onChange={() => setAspectRatio(ratio)}
                className="form-radio h-4 w-4 text-cyan-600 bg-slate-700 border-slate-500 focus:ring-cyan-500"
              />
              <span className="text-slate-200">{ratio === '16:9' ? 'Landscape' : 'Portrait'} ({ratio})</span>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      
      <button
        type="submit"
        disabled={isGenerating || !imageFile || isSuggesting}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
      >
        {isGenerating ? 'Animating...' : 'Animate Memory'}
      </button>
    </form>
  );
};