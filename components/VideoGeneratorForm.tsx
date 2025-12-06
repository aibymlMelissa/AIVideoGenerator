import React, { useState, useCallback } from 'react';
import { fileToGenerativePart } from '../utils/fileUtils';
import { suggestPrompts } from '../services/geminiService';
import type { AspectRatio } from '../types';

interface VideoGeneratorFormProps {
  onGenerate: (images: { data: string; mimeType: string }[], prompt: string, aspectRatio: AspectRatio) => void;
  isGenerating: boolean;
}

const UploadIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

export const VideoGeneratorForm: React.FC<VideoGeneratorFormProps> = ({ onGenerate, isGenerating }) => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [prompt, setPrompt] = useState<string>('Bring this memory to life with gentle, nostalgic motion.');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);

      // Validate: max 3 images
      if (imageFiles.length + fileArray.length > 3) {
        setError('You can upload a maximum of 3 images.');
        return;
      }

      // Validate: each file must be under 10MB
      const oversizedFile = fileArray.find(file => file.size > 10 * 1024 * 1024);
      if (oversizedFile) {
        setError(`File "${oversizedFile.name}" exceeds 10MB limit.`);
        return;
      }

      setError(null);

      // Add new files to existing ones
      const newFiles = [...imageFiles, ...fileArray];
      setImageFiles(newFiles);

      // Create previews for new files
      const newPreviews = fileArray.map(file => URL.createObjectURL(file));
      setImagePreviews([...imagePreviews, ...newPreviews]);

      setSuggestions([]); // Reset suggestions on new files
    }
  };

  const handleRemoveImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    // Revoke the object URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);

    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
    setSuggestions([]); // Reset suggestions when images change
  };
  
  const handleSuggestPrompts = useCallback(async () => {
    if (imageFiles.length === 0) return;

    setIsSuggesting(true);
    setError(null);
    setSuggestions([]);

    try {
        // Use the first image for suggestions
        const imagePart = await fileToGenerativePart(imageFiles[0]);
        const newSuggestions = await suggestPrompts(imagePart);
        setSuggestions(newSuggestions);
    } catch (e) {
        setError(`Failed to get suggestions: ${(e as Error).message}`);
    } finally {
        setIsSuggesting(false);
    }
  }, [imageFiles]);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (imageFiles.length === 0 || !prompt) {
      setError('Please provide at least one image and a prompt.');
      return;
    }
    setError(null);
    try {
      // Convert all images to the format needed by the API
      const imageParts = await Promise.all(
        imageFiles.map(file => fileToGenerativePart(file))
      );
      onGenerate(imageParts, prompt, aspectRatio);
    } catch (e) {
      setError(`Failed to process images: ${(e as Error).message}`);
    }
  }, [imageFiles, prompt, aspectRatio, onGenerate]);
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="file-upload" className="block text-sm font-medium text-slate-300 mb-2">
          Upload Photos {imageFiles.length > 0 && `(${imageFiles.length}/3)`}
        </label>

        {/* Image Previews */}
        {imagePreviews.length > 0 && (
          <div className="mb-4 grid grid-cols-3 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative group">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-md border-2 border-slate-600"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="absolute bottom-1 left-1 bg-slate-900/80 px-2 py-1 rounded text-xs text-slate-300">
                  {imageFiles[index].name.length > 15
                    ? imageFiles[index].name.substring(0, 12) + '...'
                    : imageFiles[index].name}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Area - only show if less than 3 images */}
        {imageFiles.length < 3 && (
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <UploadIcon />
              <div className="flex text-sm text-slate-400">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-slate-800 rounded-md font-medium text-cyan-400 hover:text-cyan-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-slate-900 focus-within:ring-cyan-500">
                  <span>{imageFiles.length > 0 ? 'Add more photos' : 'Upload photos'}</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    multiple
                    className="sr-only"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-slate-500">PNG, JPG, WEBP up to 10MB each (max 3 images)</p>
            </div>
          </div>
        )}

        {imageFiles.length > 0 && (
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
        disabled={isGenerating || imageFiles.length === 0 || isSuggesting}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors"
      >
        {isGenerating ? 'Generating Your Video...' : 'Animate Memory or Generate Your Video'}
      </button>
    </form>
  );
};