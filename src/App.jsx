import React, { useState, useEffect } from 'react';
import { homestayDB } from './services/db';
import GuestCommunicator from './components/GuestCommunicator';
import BookingsLedger from './components/BookingsLedger';
import ListingPricing from './components/ListingPricing';
import HostReadinessChecklist from './components/HostReadinessChecklist';

export default function App() {
  const [activeTab, setActiveTab] = useState('tabCommunicator');
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

  useEffect(() => {
    // 1. Initialize IndexedDB & Seed sample data
    async function initDB() {
      try {
        await homestayDB.init();
        await homestayDB.seedInitialSampleData();
      } catch (err) {
        console.error('[App] Database init failed:', err);
      }
    }
    initDB();

    // 2. Offline Status Listener
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('[PWA] Service Worker registered:', reg.scope))
        .catch(err => console.warn('[PWA] Service Worker registration failed:', err));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { id: 'tabCommunicator', label: 'Guest Communicator', icon: '🗣️' },
    { id: 'tabLedger', label: 'Bookings & Cash Ledger', icon: '📖' },
    { id: 'tabListing', label: 'AI Listing & Pricing', icon: '✨' },
    { id: 'tabChecklist', label: 'Host Readiness Checklist', icon: '✅' },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f5] pb-24 md:pb-12 text-slate-800">
      {/* App Header */}
      <header className="bg-gradient-to-r from-forest-900 to-forest-800 text-white px-4 py-3.5 sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="./icons/icon-192.png"
              alt="Homestay Helper Logo"
              className="w-11 h-11 rounded-xl border-2 border-amberGold object-cover shadow-sm"
            />
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 leading-tight">
                Homestay Helper <span>🏔️</span>
              </h1>
              <p className="text-xs text-emerald-200">
                Tea Garden Villages • Darjeeling Hills
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill text-[11px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
              {isOffline ? 'Zero Bars (Offline)' : 'Online'}
            </span>
          </div>
        </div>
      </header>

      {/* Offline Notice Banner */}
      {isOffline && (
        <div className="bg-amber-100 border-b border-amber-200 text-amber-900 px-4 py-1.5 text-xs font-medium text-center flex items-center justify-center gap-2">
          <span>📡</span> Operating in 100% Offline Mode (Zero Signal). All guest data & AI translations are stored locally on device.
        </div>
      )}

      {/* Navigation Tabs (Desktop / Tablet) */}
      <nav className="bg-white border-b border-slate-200 px-2 sticky top-[72px] z-30 shadow-sm hidden sm:flex justify-center">
        <div className="max-w-5xl w-full flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex-1 py-3.5 px-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeTab === item.id
                  ? 'text-forest-800 border-amberGold bg-forest-100/30'
                  : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 py-5">
        {activeTab === 'tabCommunicator' && <GuestCommunicator />}
        {activeTab === 'tabLedger' && <BookingsLedger />}
        {activeTab === 'tabListing' && <ListingPricing />}
        {activeTab === 'tabChecklist' && <HostReadinessChecklist />}
      </main>

      {/* Bottom Navigation Bar (Mobile View) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-forest-900 border-t border-white/10 z-50 flex justify-around py-2 px-1 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        <button
          onClick={() => {
            setActiveTab('tabCommunicator');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[11px] font-medium transition-all w-1/4 ${
            activeTab === 'tabCommunicator'
              ? 'text-white bg-white/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <svg className={`w-5 h-5 ${activeTab === 'tabCommunicator' ? 'fill-amberGold text-amberGold' : 'fill-current'}`} viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          <span>Translate</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('tabLedger');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[11px] font-medium transition-all w-1/4 ${
            activeTab === 'tabLedger'
              ? 'text-white bg-white/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <svg className={`w-5 h-5 ${activeTab === 'tabLedger' ? 'fill-amberGold text-amberGold' : 'fill-current'}`} viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
          <span>Ledger</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('tabListing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[11px] font-medium transition-all w-1/4 ${
            activeTab === 'tabListing'
              ? 'text-white bg-white/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <svg className={`w-5 h-5 ${activeTab === 'tabListing' ? 'fill-amberGold text-amberGold' : 'fill-current'}`} viewBox="0 0 24 24">
            <path d="M12 2L1 21h22L12 2zm0 3.45L19.5 19h-15L12 5.45z"/>
          </svg>
          <span>AI Listing</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('tabChecklist');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-[11px] font-medium transition-all w-1/4 ${
            activeTab === 'tabChecklist'
              ? 'text-white bg-white/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <svg className={`w-5 h-5 ${activeTab === 'tabChecklist' ? 'fill-amberGold text-amberGold' : 'fill-current'}`} viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          <span>Checklist</span>
        </button>
      </nav>
    </div>
  );
}
