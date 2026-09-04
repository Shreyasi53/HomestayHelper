import React, { useState, useEffect } from 'react';
import { homestayDB } from '../services/db';
import { homestayAI } from '../services/ai';
import { calculatePricing } from '../services/pricingCalculator';
import { ShareUtils } from '../services/share';
import {
  Sparkles,
  Mountain,
  Coffee,
  Utensils,
  ShowerHead,
  Flame,
  Car,
  Plus,
  X,
  Lightbulb,
  FileText,
  Share2,
  Languages,
  Copy,
  Check,
  AlertTriangle
} from 'lucide-react';

export default function ListingPricing() {
  const [profile, setProfile] = useState({
    name: "Maya's Tea Village Homestay",
    hostName: "Maya Gurung",
    village: "Takdah Cantonment",
    roomType: "attached_bath",
    roomCount: 2,
    amenities: ["Kanchenjunga View", "Organic Tea Tasting", "Home-cooked Meals", "Geyser facilities"]
  });

  const [pricingInfo, setPricingInfo] = useState(null);
  const [generatedOutput, setGeneratedOutput] = useState(null); // { en: string, hi: string }
  const [engineStatus, setEngineStatus] = useState('checking');
  const [engineError, setEngineError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Custom Amenities state
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customAmenityInput, setCustomAmenityInput] = useState('');
  const [customAmenities, setCustomAmenities] = useState([]);
  const [copyFeedback, setCopyFeedback] = useState(null);

  const standardAmenities = [
    { name: 'Kanchenjunga View', Icon: Mountain },
    { name: 'Organic Tea Tasting', Icon: Coffee },
    { name: 'Home-cooked Meals', Icon: Utensils },
    { name: 'Geyser facilities', Icon: ShowerHead },
    { name: 'Evening Bonfire', Icon: Flame },
    { name: 'Shared Cab Guidance', Icon: Car },
  ];

  useEffect(() => {
    // 1. Load saved listing profile from IndexedDB
    async function loadProfile() {
      try {
        const saved = await homestayDB.getListingProfile();
        if (saved) {
          // Migrate old amenity names if present
          const cleanedAmenities = (saved.amenities || []).map((a) => {
            if (a === 'Hot Bucket Water') return 'Geyser facilities';
            return a;
          }).filter((a) => a !== 'Tea Garden Trail Walk' && a !== 'Solar Light Backup');

          // Extract any saved custom amenities that are not standard
          const standardNames = standardAmenities.map(s => s.name);
          const savedCustom = cleanedAmenities.filter(a => !standardNames.includes(a));
          if (savedCustom.length > 0) {
            setCustomAmenities(savedCustom);
          }

          setProfile({
            ...saved,
            amenities: cleanedAmenities
          });
        }
      } catch (err) {
        console.warn('[ListingPricing] Failed to load saved profile:', err);
      }
    }
    loadProfile();

    // 2. Subscribe to AI engine status & run initial health check
    const unsubscribe = homestayAI.subscribeStatus((status, error) => {
      setEngineStatus(status);
      setEngineError(error);
    });

    homestayAI.checkEngineStatus();

    return () => {
      unsubscribe();
    };
  }, []);

  const toggleAmenity = (name) => {
    const current = profile.amenities || [];
    if (current.includes(name)) {
      setProfile({ ...profile, amenities: current.filter(a => a !== name) });
    } else {
      setProfile({ ...profile, amenities: [...current, name] });
    }
  };

  const handleAddCustomAmenity = (e) => {
    e?.preventDefault();
    const trimmed = customAmenityInput.trim();
    if (!trimmed) return;

    // Prevent duplicates (case-insensitive)
    const allCurrent = [...standardAmenities.map(a => a.name), ...customAmenities];
    const isDuplicate = allCurrent.some(a => a.toLowerCase() === trimmed.toLowerCase());

    if (isDuplicate) {
      alert('This amenity is already in your list!');
      return;
    }

    setCustomAmenities([...customAmenities, trimmed]);
    setProfile({
      ...profile,
      amenities: [...(profile.amenities || []), trimmed]
    });
    setCustomAmenityInput('');
    setIsAddingCustom(false);
  };

  const handleRemoveCustomAmenity = (nameToRemove, e) => {
    e.stopPropagation();
    setCustomAmenities(customAmenities.filter(a => a !== nameToRemove));
    setProfile({
      ...profile,
      amenities: (profile.amenities || []).filter(a => a !== nameToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Save profile to IndexedDB
    try {
      await homestayDB.saveListingProfile(profile);
    } catch (dbErr) {
      console.warn('[ListingPricing] IndexedDB save error:', dbErr);
    }

    // 2. Calculate Pricing deterministically (Pure math, no AI, counts all amenities)
    const pricing = calculatePricing({
      roomCategory: profile.roomType,
      amenities: profile.amenities
    });
    setPricingInfo(pricing);

    // 3. Generate natural-language bilingual listing with real on-device Gemma 4 E2B
    setIsGenerating(true);
    try {
      const listing = await homestayAI.generateListingText(profile);
      setGeneratedOutput(listing);
    } catch (err) {
      console.error('[ListingPricing] AI generation error:', err);
      if (engineStatus === 'offline' || err.message?.includes('fetch') || err.message?.includes('reach')) {
        setErrorMessage('Gemma is unavailable. Please start Ollama.');
      } else if (engineStatus === 'unavailable') {
        setErrorMessage('Gemma 4 E2B model (gemma4:e2b) was not found in Ollama.');
      } else {
        setErrorMessage(err.message || 'Failed to generate listing with Gemma.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareAll = async () => {
    if (!generatedOutput || !pricingInfo) return;
    const shareStr = `${profile.name}\n\nENGLISH:\n${generatedOutput.en || ''}\n\nHINDI:\n${generatedOutput.hi || ''}\n\nRECOMMENDED RATES:\n• Off-Peak: ${pricingInfo.offPeak} per night\n• Peak Season: ${pricingInfo.peak} per night`;
    await ShareUtils.shareText(`${profile.name} - Homestay Listing`, shareStr);
  };

  const copyToClipboard = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback(type);
      setTimeout(() => setCopyFeedback(null), 2000);
    });
  };

  // Render Engine Status Badge
  const renderStatusBadge = () => {
    if (isGenerating || engineStatus === 'generating') {
      return (
        <span className="text-xs font-bold px-2.5 py-1 rounded-pill bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          GENERATING
        </span>
      );
    }
    if (engineStatus === 'ready') {
      return (
        <span className="text-xs font-bold px-2.5 py-1 rounded-pill bg-forest-100 text-forest-800 border border-forest-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          ON-DEVICE AI READY
        </span>
      );
    }
    if (engineStatus === 'checking') {
      return (
        <span className="text-xs font-bold px-2.5 py-1 rounded-pill bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
          Checking...
        </span>
      );
    }
    if (engineStatus === 'offline') {
      return (
        <span className="text-xs font-bold px-2.5 py-1 rounded-pill bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          OFFLINE
        </span>
      );
    }
    return (
      <span className="text-xs font-bold px-2.5 py-1 rounded-pill bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-rose-500" />
        AI ERROR
      </span>
    );
  };

  return (
    <div>
      <div className="bg-white rounded-2xl p-5 mb-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <span className="text-lg font-bold text-forest-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-forest-800" aria-hidden="true" />
            <span>AI Listing & Smart Pricing Helper</span>
          </span>
          {renderStatusBadge()}
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Create an attractive bilingual homestay description with on-device Gemma AI & calculate optimal nightly pricing for your village.
        </p>

        {errorMessage && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Homestay Name *</label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="e.g. Maya's Tea Village Homestay"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Host Name(s) *</label>
              <input
                type="text"
                required
                value={profile.hostName}
                onChange={(e) => setProfile({ ...profile, hostName: e.target.value })}
                placeholder="e.g. Maya & Karma Gurung"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Village / Location *</label>
              <input
                type="text"
                required
                value={profile.village}
                onChange={(e) => setProfile({ ...profile, village: e.target.value })}
                placeholder="e.g. Takdah, Mirik, Sourenee"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Room Category</label>
              <select
                value={profile.roomType}
                onChange={(e) => setProfile({ ...profile, roomType: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-forest-700 bg-white"
              >
                <option value="attached_bath">Standard Attached Bath</option>
                <option value="shared_bath">Traditional Shared Bath</option>
                <option value="family_suite">Family Suite (4 Bed)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Total Rooms Available</label>
              <input
                type="number"
                min="1"
                max="10"
                value={profile.roomCount}
                onChange={(e) => setProfile({ ...profile, roomCount: Number(e.target.value || 1) })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Select Homestay Highlights & Amenities:</label>
            <div className="flex flex-wrap gap-2 items-center">
              {/* Standard Amenities */}
              {standardAmenities.map((amenity) => {
                const isChecked = (profile.amenities || []).includes(amenity.name);
                const AmenityIcon = amenity.Icon;
                return (
                  <button
                    type="button"
                    key={amenity.name}
                    onClick={() => toggleAmenity(amenity.name)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-semibold border transition-all ${
                      isChecked
                        ? 'bg-forest-100 border-forest-800 text-forest-800 font-bold shadow-sm'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <AmenityIcon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{amenity.name}</span>
                  </button>
                );
              })}

              {/* Custom Added Amenities */}
              {customAmenities.map((custom) => {
                const isChecked = (profile.amenities || []).includes(custom);
                return (
                  <button
                    type="button"
                    key={custom}
                    onClick={() => toggleAmenity(custom)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-semibold border transition-all ${
                      isChecked
                        ? 'bg-emerald-100 border-emerald-700 text-emerald-900 font-bold shadow-sm'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                    <span>{custom}</span>
                    <span
                      onClick={(e) => handleRemoveCustomAmenity(custom, e)}
                      title="Remove custom amenity"
                      className="ml-1 text-slate-400 hover:text-rose-600 font-bold p-0.5 rounded-full hover:bg-slate-200 inline-flex items-center justify-center"
                    >
                      <X className="w-3 h-3" aria-hidden="true" />
                    </span>
                  </button>
                );
              })}

              {/* + More Button */}
              {!isAddingCustom ? (
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-bold border border-dashed border-forest-600 text-forest-800 bg-forest-50/50 hover:bg-forest-100 hover:border-forest-800 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>+ More</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-forest-300 shadow-sm animate-fadeIn">
                  <input
                    type="text"
                    autoFocus
                    value={customAmenityInput}
                    onChange={(e) => setCustomAmenityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomAmenity();
                      } else if (e.key === 'Escape') {
                        setIsAddingCustom(false);
                      }
                    }}
                    placeholder="e.g. Free Wi-Fi, BBQ..."
                    className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-forest-700 w-36 sm:w-44 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAmenity}
                    className="bg-forest-800 text-white text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-forest-700 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustom(false);
                      setCustomAmenityInput('');
                    }}
                    className="text-slate-500 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200 inline-flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className={`w-full text-white font-bold text-sm py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 ${
              isGenerating
                ? 'bg-forest-900 cursor-not-allowed opacity-80'
                : 'bg-forest-800 hover:bg-forest-700 active:scale-[0.99]'
            }`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Generating AI Listing with Gemma...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Generate AI Listing & Recommended Pricing</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results Section */}
      {pricingInfo && (
        <div className="space-y-5">
          {/* Pricing Card (Deterministic) */}
          <div className="bg-white rounded-2xl p-5 border-l-4 border-amberGold border-slate-200 border shadow-sm">
            <div className="text-base font-bold text-forest-800 mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-600" aria-hidden="true" />
              <span>Recommended Nightly Pricing Calculator</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase">Off-Peak Season Rate</div>
                <div className="text-xl font-bold text-forest-800 mt-1">{pricingInfo.offPeak}</div>
                <p className="text-xs text-slate-400 mt-1">Includes stay + breakfast per night</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase">Peak Tourist Season Rate (Mar-May & Oct-Nov)</div>
                <div className="text-xl font-bold text-amberGold-hover mt-1">{pricingInfo.peak}</div>
                <p className="text-xs text-slate-400 mt-1">High demand timing</p>
              </div>
            </div>
          </div>

          {/* Bilingual Listing Cards (Generated by Gemma 4 E2B) */}
          {generatedOutput && (
            <div className="space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <span className="text-base font-bold text-forest-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-forest-800" aria-hidden="true" />
                  <span>Generated Homestay Listings (Gemma 4 E2B)</span>
                </span>
                <button
                  onClick={handleShareAll}
                  className="bg-amberGold hover:bg-amberGold-hover text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Share / Copy All Listings</span>
                </button>
              </div>

              {/* English Listing Card */}
              {generatedOutput.en && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-forest-800 flex items-center gap-2">
                      <Languages className="w-4 h-4 text-forest-800" aria-hidden="true" />
                      <span>English Listing</span>
                    </h4>
                    <button
                      onClick={() => copyToClipboard(generatedOutput.en, 'en')}
                      className="text-xs text-forest-800 bg-forest-50 hover:bg-forest-100 border border-forest-200 px-2.5 py-1 rounded-lg font-semibold transition-colors inline-flex items-center gap-1.5"
                    >
                      {copyFeedback === 'en' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Copy English</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-slate-50 border border-dashed border-forest-600 rounded-xl p-4 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {generatedOutput.en}
                  </div>
                </div>
              )}

              {/* Hindi Listing Card */}
              {generatedOutput.hi && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-forest-800 flex items-center gap-2">
                      <Languages className="w-4 h-4 text-forest-800" aria-hidden="true" />
                      <span>Hindi Listing (हिंदी)</span>
                    </h4>
                    <button
                      onClick={() => copyToClipboard(generatedOutput.hi, 'hi')}
                      className="text-xs text-forest-800 bg-forest-50 hover:bg-forest-100 border border-forest-200 px-2.5 py-1 rounded-lg font-semibold transition-colors inline-flex items-center gap-1.5"
                    >
                      {copyFeedback === 'hi' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Copy Hindi</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-slate-50 border border-dashed border-forest-600 rounded-xl p-4 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {generatedOutput.hi}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
