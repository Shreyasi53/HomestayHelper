import React, { useState, useEffect } from 'react';
import { homestayDB } from './services/db';
import GuestCommunicator from './components/GuestCommunicator';
import BookingsLedger from './components/BookingsLedger';
import ListingPricing from './components/ListingPricing';
import HostReadinessChecklist from './components/HostReadinessChecklist';
import {
  Radio,
  MessageSquare,
  BookOpen,
  Sparkles,
  ClipboardCheck,
  Download
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('tabCommunicator');
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallNotice, setShowInstallNotice] = useState(false);

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

    // 4. Check Standalone & PWA Install Prompt Listener
    const checkStandalone = () => {
      const isStandaloneMode = (typeof window !== 'undefined') && (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true
      );
      setIsStandalone(Boolean(isStandaloneMode));
    };
    checkStandalone();

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      setShowInstallNotice(false);
      console.log('[PWA] Homestay Helper was successfully installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] Install prompt outcome: ${outcome}`);
      setDeferredPrompt(null);
    } else {
      setShowInstallNotice(true);
      setTimeout(() => setShowInstallNotice(false), 5000);
    }
  };

  const navItems = [
    { id: 'tabCommunicator', label: 'Communicator', Icon: MessageSquare },
    { id: 'tabLedger', label: 'Bookings & Ledger', Icon: BookOpen },
    { id: 'tabListing', label: 'AI Listing', Icon: Sparkles },
    { id: 'tabChecklist', label: 'Checklist', Icon: ClipboardCheck },
  ];

  return (
    <div className="min-h-screen bg-[#f4f7f5] pb-24 md:pb-12 text-slate-800">
      {/* App Header */}
      <header className="bg-gradient-to-r from-forest-900 to-forest-800 text-white px-4 py-3.5 sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto flex justify-between items-center gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="./icons/icon-192.png"
              alt="Homestay Helper Logo"
              className="w-11 h-11 rounded-xl border-2 border-amberGold object-contain bg-forest-900 shadow-sm shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight truncate">
                Homestay Helper
              </h1>
              <p className="text-xs text-emerald-200 truncate">
                Tea Garden Villages • Darjeeling Hills
              </p>
            </div>
          </div>

          {!isStandalone && (
            <div className="relative flex items-center shrink-0">
              <button
                onClick={handleInstallClick}
                title="Download and install Homestay Helper app on your device"
                aria-label="Download App"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg text-xs font-semibold bg-amberGold text-forest-900 hover:bg-amber-400 active:scale-95 transition-all shadow-sm border border-amber-300 shrink-0"
              >
                <Download className="w-4 h-4 text-forest-900 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Download App</span>
                <span className="sm:hidden">Download</span>
              </button>

              {showInstallNotice && (
                <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-2xl border border-slate-700 z-50 animate-fadeIn">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-amberGold flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" aria-hidden="true" /> Install Homestay Helper
                    </p>
                    <button
                      onClick={() => setShowInstallNotice(false)}
                      className="text-slate-400 hover:text-white text-xs px-1"
                      aria-label="Close"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-slate-200 text-[11px] leading-relaxed">
                    To install: open your browser menu (<span className="font-semibold text-white">⋮</span> or share button) and choose <strong>Add to Home screen</strong> or <strong>Install app</strong>.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Offline Notice Banner */}
      {isOffline && (
        <div className="bg-amber-100 border-b border-amber-200 text-amber-900 px-4 py-1.5 text-xs font-medium text-center flex items-center justify-center gap-2">
          <Radio className="w-4 h-4 text-amber-800 shrink-0" aria-hidden="true" />
          <span>Operating in 100% Offline Mode (Zero Signal). All guest data & AI translations are stored locally on device.</span>
        </div>
      )}

      {/* Navigation Tabs (Desktop / Tablet) */}
      <nav className="bg-white border-b border-slate-200 px-2 sticky top-[72px] z-30 shadow-sm hidden sm:flex justify-center">
        <div className="max-w-5xl w-full flex">
          {navItems.map((item) => {
            const ItemIcon = item.Icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex-1 py-3.5 px-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                  activeTab === item.id
                    ? 'text-forest-800 border-amberGold bg-forest-100/30'
                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <ItemIcon className="w-4 h-4" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
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
          <MessageSquare className={`w-5 h-5 ${activeTab === 'tabCommunicator' ? 'text-amberGold' : 'text-slate-400'}`} aria-hidden="true" />
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
          <BookOpen className={`w-5 h-5 ${activeTab === 'tabLedger' ? 'text-amberGold' : 'text-slate-400'}`} aria-hidden="true" />
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
          <Sparkles className={`w-5 h-5 ${activeTab === 'tabListing' ? 'text-amberGold' : 'text-slate-400'}`} aria-hidden="true" />
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
          <ClipboardCheck className={`w-5 h-5 ${activeTab === 'tabChecklist' ? 'text-amberGold' : 'text-slate-400'}`} aria-hidden="true" />
          <span>Checklist</span>
        </button>
      </nav>
    </div>
  );
}
