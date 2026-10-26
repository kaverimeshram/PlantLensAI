'use client';

import React from 'react';
import { usePlant, NavTab } from '@/context/PlantContext';
import {
  Sparkles,
  MapPin,
  KeyRound,
  ShieldAlert,
  Cpu,
  Leaf,
  Home,
  Camera,
  Stethoscope,
  Sprout,
  Compass,
  MessageSquareQuote,
} from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenSafetyModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, onOpenSafetyModal }) => {
  const { userLocation, isDemoMode, activeTab, setActiveTab, setIsChatOpen } = usePlant();

  const navItems = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'identify' as NavTab, label: 'Identify', icon: Camera },
    { id: 'doctor' as NavTab, label: 'Plant Doctor', icon: Stethoscope },
    { id: 'my-plants' as NavTab, label: 'My Plants', icon: Sprout },
    { id: 'explore' as NavTab, label: 'Explore', icon: Compass },
  ];

  return (
    <header className="sticky top-0 z-30 glass-header px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between border-b border-[#183D32]/10 transition-all shadow-xs">
      {/* Brand Logo */}
      <div
        onClick={() => setActiveTab('home')}
        className="flex items-center gap-2.5 cursor-pointer select-none shrink-0"
      >
        <div className="w-9 h-9 rounded-xl bg-[#183D32] flex items-center justify-center text-[#DCE8D9] shadow-sm shrink-0">
          <Leaf className="w-5 h-5 text-[#DCE8D9]" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#183D32]">
              PlantLens<span className="text-[#3A725D] font-sans font-light text-base ml-0.5">AI</span>
            </span>
            <span className="hidden xl:inline-flex items-center text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full bg-[#DCE8D9] text-[#183D32] border border-[#C8DBC4]">
              Botanical AI
            </span>
          </div>
        </div>
      </div>

      {/* DESKTOP CENTER NAVIGATION TABS */}
      <nav aria-label="Desktop primary" className="hidden lg:flex items-center gap-1 bg-[#EDF4EB]/80 p-1 rounded-2xl border border-[#C8DBC4]/60">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-[#183D32] text-[#F7F8F3] shadow-xs'
                  : 'text-[#475850] hover:text-[#183D32] hover:bg-[#DCE8D9]/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#DCE8D9]' : 'text-[#475850]'}`} />
              <span>{item.label}</span>
              {item.id === 'doctor' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* RIGHT ACTION BUTTONS */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Quick AI Botanist Assistant Trigger */}
        <button
          onClick={() => setIsChatOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#F1EBDD] text-[#183D32] border border-[#E5DCB8] hover:bg-[#E8DFC9] transition-all shadow-2xs"
        >
          <MessageSquareQuote className="w-3.5 h-3.5 text-[#183D32]" />
          <span>Ask AI</span>
        </button>

        {/* Location selector */}
        <button
          onClick={onOpenSettings}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#F1EBDD] text-[#1A2420] hover:bg-[#E8DFC9] border border-[#E5DCB8] transition-colors"
          title="Change Climate / Location"
        >
          <MapPin className="w-3.5 h-3.5 text-[#183D32]" />
          <span className="max-w-[120px] truncate">{userLocation}</span>
        </button>

        {/* AI Mode badge */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            isDemoMode
              ? 'bg-[#EDF4EB] text-[#183D32] border border-[#C8DBC4] hover:bg-[#DCE8D9]'
              : 'bg-[#183D32] text-[#DCE8D9] shadow-sm hover:bg-[#122E26]'
          }`}
          title="AI Provider Settings"
        >
          {isDemoMode ? (
            <>
              <Cpu className="w-3.5 h-3.5 text-[#183D32]" />
              <span className="hidden sm:inline">Demo Vision</span>
              <span className="sm:hidden">Demo</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 text-[#F1EBDD]" />
              <span className="hidden sm:inline">Live Gemini</span>
              <span className="sm:hidden">Live</span>
            </>
          )}
        </button>

        {/* Mushroom & Toxic Safety Button */}
        <button
          onClick={onOpenSafetyModal}
          className="p-2 rounded-full text-[#C2410C] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] transition-colors"
          title="Mushroom & Toxic Safety Guidance"
          aria-label="Safety Guidance"
        >
          <ShieldAlert className="w-4 h-4" />
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full text-[#183D32] bg-[#FFFFFF] hover:bg-[#F1EBDD] border border-[#183D32]/10 transition-colors shadow-2xs"
          title="Settings & API Key"
          aria-label="Settings"
        >
          <KeyRound className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
