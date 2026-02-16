import React, { useState } from 'react';

interface ApiKeySelectorProps {
  onApiKeyReady: (apiKey: string) => void;
  error?: string | null;
}

export const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onApiKeyReady, error }) => {
  const [mode, setMode] = useState<'choose' | 'apikey' | 'password'>('choose');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const key = apiKeyInput.trim();
    if (!key) {
      setLocalError('Please enter your API key.');
      return;
    }
    onApiKeyReady(key);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pw = passwordInput.trim();
    if (!pw) {
      setLocalError('Please enter the password.');
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      const res = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLocalError(data.error || 'Verification failed.');
        return;
      }

      onApiKeyReady(data.apiKey);
    } catch {
      setLocalError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || error;

  if (mode === 'choose') {
    return (
      <div className="text-center p-4 rounded-lg bg-slate-900/70 border border-slate-700 space-y-4">
        <h2 className="text-2xl font-bold text-white">Get Started</h2>
        <p className="text-slate-300">
          Choose how to access the Gemini API for video generation.
        </p>
        {displayError && <p className="text-red-400 text-sm">{displayError}</p>}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => { setMode('apikey'); setLocalError(null); }}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75"
          >
            Enter My Own API Key
          </button>
          <button
            onClick={() => { setMode('password'); setLocalError(null); }}
            className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-opacity-75"
          >
            Enter Password to Use Hosted Key
          </button>
        </div>
        <a
          href="https://ai.google.dev/gemini-api/docs/billing"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 transition-colors underline text-sm block"
        >
          How to get a Gemini API key
        </a>
      </div>
    );
  }

  if (mode === 'apikey') {
    return (
      <div className="text-center p-4 rounded-lg bg-slate-900/70 border border-slate-700">
        <button
          onClick={() => { setMode('choose'); setLocalError(null); }}
          className="text-slate-400 hover:text-white text-sm mb-4 inline-flex items-center gap-1 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </button>
        <h2 className="text-2xl font-bold text-white mb-3">Enter Your API Key</h2>
        <p className="text-slate-300 mb-4 text-sm">
          Your key is used directly in the browser and is never sent to our server.
        </p>
        {displayError && <p className="text-red-400 text-sm mb-3">{displayError}</p>}
        <form onSubmit={handleApiKeySubmit} className="space-y-4">
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 px-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75"
          >
            Use This Key
          </button>
        </form>
      </div>
    );
  }

  // mode === 'password'
  return (
    <div className="text-center p-4 rounded-lg bg-slate-900/70 border border-slate-700">
      <button
        onClick={() => { setMode('choose'); setLocalError(null); }}
        className="text-slate-400 hover:text-white text-sm mb-4 inline-flex items-center gap-1 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back
      </button>
      <h2 className="text-2xl font-bold text-white mb-3">Enter Password</h2>
      <p className="text-slate-300 mb-4 text-sm">
        Enter the access password to use the hosted API key.
      </p>
      {displayError && <p className="text-red-400 text-sm mb-3">{displayError}</p>}
      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <input
          type="password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          placeholder="Access password"
          className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 px-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 disabled:bg-slate-500 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};
