import React, { useState, useEffect } from 'react';
import { homestayDB } from '../services/db';
import { homestayAI } from '../services/ai';
import { ShareUtils } from '../services/share';

export default function ListingPricing() {
  const [profile, setProfile] = useState({
    name: "Maya's Tea Village Homestay",
    hostName: "Maya Gurung",
    village: "Takdah Cantonment",
    roomType: "attached_bath",
    roomCount: 2,
    amenities: ["Kanchenjunga View", "Organic Tea Tasting", "Home-cooked Meals", "Hot Bucket Water"]
  });

  const [pricingInfo, setPricingInfo] = useState(null);
  const [generatedOutput, setGeneratedOutput] = useState(null);

  const availableAmenities = [
    { name: 'Kanchenjunga View', icon: '🏔' },
    { name: 'Organic Tea Tasting', icon: '🍵' },
    { name: 'Home-cooked Meals', icon: '🍲' },
    { name: 'Hot Bucket Water', icon: '🚰' },
    { name: 'Evening Bonfire', icon: '🔥' },
    { name: 'Tea Garden Trail Walk', icon: '🌿' },
    { name: 'Solar Light Backup', icon: '💡' },
    { name: 'Shared Cab Guidance', icon: '🚘' },
  ];

  useEffect(() => {
    async function loadProfile() {
      const saved = await homestayDB.getListingProfile();
      if (saved) {
        setProfile(saved);
      }
    }
    loadProfile();
  }, []);

  const toggleAmenity = (name) => {
    const current = profile.amenities || [];
    if (current.includes(name)) {
      setProfile({ ...profile, amenities: current.filter(a => a !== name) });
    } else {
      setProfile({ ...profile, amenities: [...current, name] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Save profile to IndexedDB
    await homestayDB.saveListingProfile(profile);

    // Calculate Pricing
    const pricing = homestayAI.calculatePricing(profile.village, profile.roomType, profile.amenities);
    setPricingInfo(pricing);

    // Generate AI Listing Text
    const listing = await homestayAI.generateListingText(profile);
    setGeneratedOutput(listing);
  };

  const handleShare = async () => {
    if (!generatedOutput || !pricingInfo) return;
    const textEN = typeof generatedOutput === 'string' ? generatedOutput : generatedOutput.en;
    const shareStr = `${textEN}\n\nRecommended Rate: ${pricingInfo.offPeak} per night.`;
    await ShareUtils.shareText(`${profile.name} - Homestay Listing`, shareStr);
  };

  const textEN = generatedOutput ? (typeof generatedOutput === 'string' ? generatedOutput : generatedOutput.en) : '';
  const textHI = generatedOutput && typeof generatedOutput === 'object' ? generatedOutput.hi : '';

  return (
    <div>
      <div className="bg-white rounded-2xl p-5 mb-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-lg font-bold text-forest-800 flex items-center gap-2">
            <span>✨</span> AI Listing & Smart Pricing Helper
          </span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-pill bg-forest-100 text-forest-800">
            On-Device AI
          </span>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Create an attractive homestay description for guests & calculate optimal nightly pricing for your village.
        </p>

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
            <div className="flex flex-wrap gap-2">
              {availableAmenities.map((amenity) => {
                const isChecked = (profile.amenities || []).includes(amenity.name);
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
                    <span>{amenity.icon}</span> {amenity.name}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-forest-800 hover:bg-forest-700 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-md transition-colors"
          >
            ✨ Generate AI Listing & Recommended Pricing
          </button>
        </form>
      </div>

      {/* Results Section */}
      {pricingInfo && generatedOutput && (
        <div className="space-y-5">
          {/* Pricing Card */}
          <div className="bg-white rounded-2xl p-5 border-l-4 border-amberGold border-slate-200 border shadow-sm">
            <div className="text-base font-bold text-forest-800 mb-3 flex items-center gap-2">
              <span>💡</span> Recommended Nightly Pricing Calculator
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

          {/* Listing Copy Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <span className="text-base font-bold text-forest-800 flex items-center gap-2">
                <span>📢</span> Generated Homestay Listing Text
              </span>
              <button
                onClick={handleShare}
                className="bg-amberGold hover:bg-amberGold-hover text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1"
              >
                📲 Share / Copy Listing
              </button>
            </div>

            <div className="bg-slate-50 border border-dashed border-forest-700 rounded-xl p-4">
              <h4 className="text-xs font-bold text-forest-800 mb-2 uppercase tracking-wide">English Version:</h4>
              <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {textEN}
              </div>

              {textHI && (
                <>
                  <hr className="my-4 border-slate-200 border-dashed" />
                  <h4 className="text-xs font-bold text-forest-800 mb-2 uppercase tracking-wide">Hindi Version (हिंदी):</h4>
                  <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {textHI}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
