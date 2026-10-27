'use client';

import React, { useState } from 'react';
import { usePlant } from '@/context/PlantContext';
import { X, KeyRound, Sparkles, MapPin, CheckCircle2, Info, ExternalLink } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_LOCATIONS = [
  'Maharashtra, India (Deccan & Coastal)',
  'Bangalore / South India',
  'Northern Plains, India',
  'California, USA (Mediterranean)',
  'Florida, USA (Subtropical)',
  'London & Western Europe (Temperate)',
  'Pacific Northwest (Temperate Rainforest)',
  'Arid / Desert Zone (Arizona / Rajasthan)',
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { userApiKey, setUserApiKey, userLocation, setUserLocation, isDemoMode } = usePlant();
  const [inputKey, setInputKey] = useState(userApiKey);
  const [selectedLocation, setSelectedLocation] = useState(userLocation);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setUserApiKey(inputKey);
    setUserLocation(selectedLocation);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClearKey = () => {
    setInputKey('');
    setUserApiKey('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#183D32]/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#FFFFFF] rounded-2xl shadow-2xl border border-[#183D32]/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#EDF4EB] border-b border-[#C8DBC4] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#183D32] flex items-center justify-center text-[#DCE8D9]">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#183D32]">Settings & AI Provider</h3>
              <p className="text-xs text-[#475850]">Configure live models and local climate profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#DCE8D9] text-[#183D32] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto">
          {/* AI Mode Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            isDemoMode
              ? 'bg-[#F1EBDD]/60 border-[#E5DCB8] text-[#1A2420]'
              : 'bg-[#EDF4EB] border-[#C8DBC4] text-[#183D32]'
          }`}>
            {isDemoMode ? (
              <Info className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
            ) : (
              <Sparkles className="w-5 h-5 text-[#183D32] shrink-0 mt-0.5" />
            )}
            <div className="text-xs leading-relaxed">
              <div className="font-bold mb-1">
                {isDemoMode ? '⚡ Demo Vision Mode Active' : '✨ Live Gemini Vision Active'}
              </div>
              <p className="text-[#475850]">
                {isDemoMode
                  ? 'PlantLens AI is running our curated botanical vision simulation. You can identify sample plants (Rose, Money Plant, Tomato, Sunflower, Mango, Mushrooms) and test full diagnostic workflows. Add a Gemini API key below to enable live vision inference on any arbitrary photo.'
                  : 'Connected to Google Gemini Vision. PlantLens AI is analyzing images using live multimodal neural networks.'}
              </p>
            </div>
          </div>

          {/* Gemini API Key Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="geminiApiKey" className="text-sm font-semibold text-[#183D32] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#3A725D]" />
                Google Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-[#183D32] hover:underline flex items-center gap-1"
              >
                <span>Get free key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <input
                id="geminiApiKey"
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#183D32]/20 focus:outline-none focus:ring-2 focus:ring-[#183D32] focus:border-transparent text-sm font-mono text-[#1A2420] bg-[#F7F8F3]"
              />
              {inputKey && (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#73847B] hover:text-[#C2410C]"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-[11px] text-[#73847B]">
              Key is stored locally in your browser session and never sent to third-party tracking services. You can also configure <code className="bg-[#EDF4EB] px-1 py-0.5 rounded text-[#183D32]">GEMINI_API_KEY</code> in <code className="bg-[#EDF4EB] px-1 py-0.5 rounded text-[#183D32]">.env.local</code>.
            </p>
          </div>

          {/* Climate & Region Selection */}
          <div className="space-y-2">
            <label htmlFor="climateRegion" className="text-sm font-semibold text-[#183D32] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#3A725D]" />
              Your Climate & Growing Zone
            </label>
            <select
              id="climateRegion"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#183D32]/20 focus:outline-none focus:ring-2 focus:ring-[#183D32] text-sm text-[#1A2420] bg-[#F7F8F3]"
            >
              {POPULAR_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#73847B]">
              Customizes seasonal watering alerts, monsoon fungal risks, and climate suitability ratings.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#183D32]/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#475850] hover:bg-[#F1EBDD] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#183D32] text-[#F7F8F3] hover:bg-[#122E26] shadow-sm flex items-center gap-2 transition-all"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#DCE8D9]" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Preferences</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
