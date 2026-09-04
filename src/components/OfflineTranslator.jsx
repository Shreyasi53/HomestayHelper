import React, { useState, useEffect } from 'react';
import { translationService } from '../services/translation';
import { speechRecognitionService } from '../services/speechRecognition';
import { ttsService } from '../services/tts';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'ne', label: 'Nepali', native: 'नेपाली' }
];

export default function OfflineTranslator() {
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('ne');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [aiStatus, setAiStatus] = useState({
    status: 'UNAVAILABLE',
    message: 'Local AI translation model is not available yet.'
  });

  useEffect(() => {
    // Subscribe to translation service status
    const unsubscribe = translationService.onStatusChange((status) => {
      setAiStatus(status);
    });
    return () => unsubscribe();
  }, []);

  const handleSwapLanguages = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    // Also swap text if both exist
    if (outputText && !errorMessage) {
      setInputText(outputText);
      setOutputText(inputText);
    }
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setErrorMessage('Please enter text to translate.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const result = await translationService.translateText(
        inputText.trim(),
        sourceLang,
        targetLang
      );
      setOutputText(result);
    } catch (err) {
      setErrorMessage(err.message || 'Translation failed');
      setOutputText('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSpeech = () => {
    if (!speechRecognitionService.isSupported()) {
      setErrorMessage('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      speechRecognitionService.stop();
      setIsListening(false);
      return;
    }

    setErrorMessage('');
    setIsListening(true);

    speechRecognitionService.start(
      sourceLang,
      (transcript) => {
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      },
      (error) => {
        setErrorMessage(error);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );
  };

  const handleSpeakOutput = () => {
    if (!outputText) return;
    ttsService.speak(outputText, targetLang);
  };

  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setErrorMessage('');
  };

  const getStatusBadge = () => {
    if (aiStatus.status === 'READY') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          AI READY
        </span>
      );
    }
    if (aiStatus.status === 'LOADING') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          LOADING AI MODEL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
        <span className="w-2 h-2 rounded-full bg-slate-400"></span>
        AI UNAVAILABLE
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 md:p-6 mb-6">
      {/* Header with Title and AI Model Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl" role="img" aria-label="Globe">🌐</span>
          <div>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Offline AI Translator</h2>
            <p className="text-xs text-slate-500">Local on-device translation engine</p>
          </div>
        </div>
        <div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Language Selection Row */}
      <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2 mb-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            FROM
          </label>
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium text-sm rounded-xl px-3 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          >
            {LANGUAGES.map((lang) => (
              <option key={`src-${lang.code}`} value={lang.code}>
                {lang.label} ({lang.native})
              </option>
            ))}
          </select>
        </div>

        <div className="pt-6 flex justify-center">
          <button
            type="button"
            onClick={handleSwapLanguages}
            aria-label="Swap Languages"
            className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 active:scale-95 transition-all shadow-sm"
          >
            ⇄
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            TO
          </label>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium text-sm rounded-xl px-3 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          >
            {LANGUAGES.map((lang) => (
              <option key={`tgt-${lang.code}`} value={lang.code}>
                {lang.label} ({lang.native})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Input Area */}
      <div className="mb-4">
        <div className="relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            rows={4}
            className="w-full p-3.5 pb-10 text-slate-800 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y placeholder-slate-400 leading-relaxed"
          />

          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <button
              type="button"
              onClick={handleToggleSpeech}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                isListening
                  ? 'bg-rose-50 text-rose-600 border-rose-300 animate-pulse'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{isListening ? '⏹️' : '🎤'}</span>
              <span>{isListening ? 'Listening...' : 'Speak'}</span>
            </button>

            {inputText && (
              <button
                type="button"
                onClick={() => setInputText('')}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
              >
                Clear input
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Row: Translate Button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={handleTranslate}
          disabled={isLoading || !inputText.trim()}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Translating...</span>
            </>
          ) : (
            <>
              <span>✨</span>
              <span>Translate</span>
            </>
          )}
        </button>
      </div>

      {/* Error / Notice State */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
          <span className="text-base leading-none">⚠️</span>
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* Output / Result Card */}
      {(outputText || errorMessage) && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              TRANSLATION
            </span>
            <div className="flex items-center gap-2">
              {outputText && (
                <>
                  <button
                    type="button"
                    onClick={handleSpeakOutput}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                  >
                    🔊 Speak
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"
                  >
                    {copySuccess ? '✓ Copied' : '📋 Copy'}
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center px-2 py-1 text-xs font-medium text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="text-slate-800 text-base font-medium min-h-[48px] whitespace-pre-wrap leading-relaxed">
            {outputText || (
              <span className="text-slate-400 italic font-normal text-sm">
                No translation available yet.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
