import React, { useState } from 'react';
import { HOMESTAY_PHRASES } from '../data/phrases';
import { appTTS } from '../services/tts';

export default function GuestCommunicator() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [guestLang, setGuestLang] = useState('en');
  const [searchVal, setSearchVal] = useState('');
  const [activeSpeakingId, setActiveSpeakingId] = useState(null);
  const [customPhrase, setCustomPhrase] = useState('');

  const categories = [
    { id: 'all', label: '🌟 All Phrases' },
    { id: 'arrival', label: '🛏 Arrival & Room' },
    { id: 'meals', label: '🍲 Meals & Tea' },
    { id: 'payments', label: '💵 Rates & Cash' },
    { id: 'transport', label: '🚘 Travel & Sights' },
  ];

  const filteredPhrases = HOMESTAY_PHRASES.filter(p => {
    const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
    const query = searchVal.toLowerCase();
    const matchSearch = !query ||
      p.en.toLowerCase().includes(query) ||
      p.ne.toLowerCase().includes(query) ||
      (p.ne_trans && p.ne_trans.toLowerCase().includes(query));
    return matchCat && matchSearch;
  });

  const handleSpeakPhrase = (phrase) => {
    const textToSpeak = phrase[guestLang] || phrase.en;
    setActiveSpeakingId(phrase.id);
    appTTS.speak(
      textToSpeak,
      guestLang,
      () => setActiveSpeakingId(phrase.id),
      () => setActiveSpeakingId(null)
    );
  };

  const handleCustomSpeak = () => {
    const val = customPhrase.trim();
    if (!val) return;
    appTTS.speak(val, guestLang);
  };

  return (
    <div className="bg-white rounded-2xl p-5 mb-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-lg font-bold text-forest-800 flex items-center gap-2">
          <span>🗣️</span> Zero-Bars Guest Communicator
        </span>
        <span className="text-xs font-bold px-2.5 py-1 rounded-pill bg-forest-100 text-forest-800 uppercase tracking-wide">
          100% Offline Audio
        </span>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        Two-way phrasebook for tea garden homestays. Tap 🔊 to speak aloud in guest language.
      </p>

      {/* Language Controls Bar */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl mb-4 border border-slate-200 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase">
            Guest Language:
          </label>
          <select
            value={guestLang}
            onChange={(e) => setGuestLang(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-forest-700 bg-white"
          >
            <option value="en">English 🇬🇧</option>
            <option value="hi">Hindi (हिंदी) 🇮🇳</option>
            <option value="bn">Bengali (বাংলা) 🇮🇳</option>
            <option value="ne">Nepali (नेपाली) 🇳🇵</option>
          </select>
        </div>
        <div className="flex-1 max-w-xs">
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="🔍 Search phrases (tea, key, rate)..."
            className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
          />
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-pill text-sm font-semibold whitespace-nowrap transition-all border ${
              selectedCategory === cat.id
                ? 'bg-forest-800 text-white border-forest-800 shadow-md'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Phrase Cards */}
      <div className="space-y-3">
        {filteredPhrases.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No matching phrases found.</p>
          </div>
        ) : (
          filteredPhrases.map((phrase) => {
            const guestText = phrase[guestLang] || phrase.en;
            const isSpeaking = activeSpeakingId === phrase.id;

            return (
              <div
                key={phrase.id}
                className="bg-white rounded-xl p-4 border border-slate-200 flex flex-col gap-2.5 transition-all hover:border-forest-700 hover:shadow-md"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-pill bg-forest-100 text-forest-800 uppercase tracking-wide">
                    {phrase.category}
                  </span>
                  <span className="text-xs text-slate-500 italic">
                    {phrase.ne_trans || ''}
                  </span>
                </div>

                <div className="text-base font-bold text-forest-800 leading-snug">
                  {phrase.ne}
                </div>

                <div className="text-sm text-slate-600 bg-slate-50 p-2.5 rounded-lg border-l-4 border-amberGold">
                  <strong className="text-slate-800">[{guestLang.toUpperCase()}]:</strong> {guestText}
                </div>

                <div className="flex items-center justify-end mt-1">
                  <button
                    onClick={() => handleSpeakPhrase(phrase)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-semibold transition-all ${
                      isSpeaking
                        ? 'bg-amberGold text-white animate-pulse-custom'
                        : 'bg-forest-100 text-forest-800 hover:bg-forest-800 hover:text-white'
                    }`}
                  >
                    {isSpeaking ? '🔊 Speaking...' : '🔊 Speak Guest Text'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Phrase Builder */}
      <div className="mt-6 bg-gradient-to-r from-forest-800 to-forest-700 text-white rounded-xl p-5 shadow-md">
        <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
          <span>✨</span> Instant Homestay Message Helper
        </h3>
        <p className="text-xs opacity-90 mb-3">
          Type a custom message for your guest to speak out loud:
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customPhrase}
            onChange={(e) => setCustomPhrase(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCustomSpeak();
            }}
            placeholder="e.g. Please leave your shoes at the entrance door..."
            className="flex-1 bg-white text-slate-800 px-3 py-2 rounded-lg text-sm border-none focus:outline-none"
          />
          <button
            onClick={handleCustomSpeak}
            className="bg-amberGold hover:bg-amberGold-hover text-white font-semibold text-xs px-4 py-2 rounded-lg shadow transition-colors inline-flex items-center gap-1"
          >
            🔊 Speak Aloud
          </button>
        </div>
      </div>
    </div>
  );
}
