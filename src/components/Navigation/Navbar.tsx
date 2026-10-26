'use client';

import React from 'react';
import { usePlant, NavTab } from '@/context/PlantContext';
import { Home, Camera, Stethoscope, Sprout, Compass } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab } = usePlant();

  const navItems = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'identify' as NavTab, label: 'Identify', icon: Camera, isPrimaryScan: true },
    { id: 'doctor' as NavTab, label: 'Plant Doctor', icon: Stethoscope },
    { id: 'my-plants' as NavTab, label: 'My Plants', icon: Sprout },
    { id: 'explore' as NavTab, label: 'Explore', icon: Compass },
  ];

  return (
    /* MOBILE BOTTOM NAVIGATION BAR ONLY */
    <nav aria-label="Mobile navigation" className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-nav-mobile px-3 py-2 border-t border-[#183D32]/10">
      <div className="flex items-center justify-around relative max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          // Highlight the primary scan camera shutter button in the center
          if (item.isPrimaryScan) {
            return (
              <div key={item.id} className="relative -top-5">
                <button
                  onClick={() => setActiveTab('identify')}
                  className="w-14 h-14 rounded-full bg-[#183D32] text-[#F7F8F3] flex flex-col items-center justify-center shadow-xl border-4 border-[#F7F8F3] active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#3A725D]"
                  aria-label="Scan Plant"
                >
                  <Icon className="w-6 h-6 text-[#DCE8D9]" />
                  <span className="text-[10px] font-bold tracking-tight text-[#F1EBDD]">Scan</span>
                </button>
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive ? 'text-[#183D32] font-bold' : 'text-[#73847B] hover:text-[#183D32]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#183D32] stroke-[2.3]' : 'text-[#73847B]'}`} />
                {item.id === 'doctor' && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#D97706]" />
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
