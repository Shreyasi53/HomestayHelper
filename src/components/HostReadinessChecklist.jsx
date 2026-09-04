import React, { useState, useEffect } from 'react';
import { HOST_CHECKLIST, LOCAL_HILL_FACTS } from '../data/checklist';

export default function HostReadinessChecklist() {
  const [completedIds, setCompletedIds] = useState(() => {
    try {
      const saved = localStorage.getItem('homestay_chk_state');
      return saved ? JSON.parse(saved) : ['room_1', 'room_3', 'hyg_2'];
    } catch (e) {
      return ['room_1', 'room_3', 'hyg_2'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('homestay_chk_state', JSON.stringify(completedIds));
    } catch (e) {
      console.warn('Could not save checklist state:', e);
    }
  }, [completedIds]);

  const toggleItem = (id) => {
    if (completedIds.includes(id)) {
      setCompletedIds(completedIds.filter((i) => i !== id));
    } else {
      setCompletedIds([...completedIds, id]);
    }
  };

  let totalItems = 0;
  HOST_CHECKLIST.forEach((cat) => (totalItems += cat.items.length));
  const doneCount = completedIds.length;
  const progressPct = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0;

  return (
    <div>
      {/* Progress Bar Banner */}
      <div className="bg-gradient-to-br from-forest-900 to-forest-800 text-white rounded-2xl p-5 mb-5 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <span>✅</span> Homestay Hosting Readiness
            </h3>
            <p className="text-xs text-emerald-200 mt-0.5">
              Preparation checklist for hosting guests comfortably.
            </p>
          </div>
          <div className="text-2xl font-bold text-amberGold">{progressPct}%</div>
        </div>
        <div className="w-full bg-slate-700/50 rounded-pill h-2.5 overflow-hidden mb-2">
          <div
            className="bg-gradient-to-r from-emerald-400 to-amberGold h-full transition-all duration-300 rounded-pill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-right opacity-80">{doneCount} of {totalItems} items completed</p>
      </div>

      {/* Interactive Checklist Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {HOST_CHECKLIST.map((cat) => (
          <div key={cat.category} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="text-base font-bold text-forest-800 mb-3 flex items-center gap-2">
              <span>{cat.icon}</span> {cat.category}
            </div>
            <div className="space-y-2">
              {cat.items.map((item) => {
                const isChecked = completedIds.includes(item.id);
                return (
                  <label
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                      isChecked
                        ? 'bg-slate-100 border-slate-200 opacity-70 line-through text-slate-500'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // Handled by label click
                      className="mt-0.5 w-4 h-4 accent-forest-800 rounded cursor-pointer"
                    />
                    <span className="text-sm leading-snug">{item.text}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Local Hill Lore & DHR Facts Cheat-sheet */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <span className="text-base font-bold text-forest-800 flex items-center gap-2">
            <span>📜</span> Local Hill & DHR Heritage Guide for Guests
          </span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-pill bg-forest-100 text-forest-800">
            Storytelling
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Share these authentic facts with guests during tea or dinner time!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {LOCAL_HILL_FACTS.map((fact) => (
            <div key={fact.title} className="bg-slate-50 p-4 rounded-xl border-l-4 border-forest-700 border border-slate-200">
              <h4 className="text-sm font-bold text-forest-800 mb-1">
                {fact.title}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {fact.fact}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
