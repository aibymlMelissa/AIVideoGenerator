
import React from 'react';

interface ApiKeySelectorProps {
  onApiKeySelected: () => void;
  error?: string | null;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onApiKeySelected, error }) => {
  const handleSelectKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        // Assume success after the dialog is closed to handle race conditions.
        onApiKeySelected();
      } catch (e) {
        console.error("Error opening API key selection:", e);
      }
    } else {
      alert("API key selection is not available in this environment.");
    }
  };

  return (
    <div className="text-center p-4 rounded-lg bg-slate-900/70 border border-slate-700">
      <h2 className="text-2xl font-bold text-white mb-3">API Key Required</h2>
      <p className="text-slate-300 mb-4">
        To generate videos with Veo, you need to select an enabled API key for a project with billing enabled.
      </p>
      <a
        href="https://ai.google.dev/gemini-api/docs/billing"
        target="_blank"
        rel="noopener noreferrer"
        className="text-cyan-400 hover:text-cyan-300 transition-colors underline mb-6 block"
      >
        Learn more about billing
      </a>
      {error && <p className="text-red-400 mb-4">{error}</p>}
      <button
        onClick={handleSelectKey}
        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75"
      >
        Select API Key
      </button>
    </div>
  );
};
