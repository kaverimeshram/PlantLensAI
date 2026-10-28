'use client';

import React, { useState } from 'react';
import { usePlant } from '@/context/PlantContext';
import { Header } from '@/components/Navigation/Header';
import { Navbar } from '@/components/Navigation/Navbar';
import { HomeView } from '@/components/Home/HomeView';
import { UniversalScanner } from '@/components/Scanner/UniversalScanner';
import { IdentificationResultView } from '@/components/Scanner/IdentificationResultView';
import { PlantDoctorView } from '@/components/Doctor/PlantDoctorView';
import { MyPlantsView } from '@/components/MyPlants/MyPlantsView';
import { ExploreView } from '@/components/Explore/ExploreView';
import { PlantAssistantChat } from '@/components/Chat/PlantAssistantChat';
import { SettingsModal } from '@/components/Common/SettingsModal';
import { SafetyWarningModal } from '@/components/Common/SafetyWarningModal';
import { AuthModal } from '@/components/Auth/AuthModal';

export default function App() {
  const { activeTab, currentSpecies, setCurrentSpecies, isAuthModalOpen, setIsAuthModalOpen } = usePlant();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSafetyOpen, setIsSafetyOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8F3] text-[#1A2420]">
      {/* Top Global Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSafetyModal={() => setIsSafetyOpen(true)}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col">
        {/* Navigation Bar (Desktop subheader + Mobile bottom bar) */}
        <Navbar />

        {/* Dynamic Page Container */}
        <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full mx-auto pb-24 lg:pb-12">
          {activeTab === 'home' && <HomeView />}

          {activeTab === 'identify' && (
            <>
              {currentSpecies ? (
                <IdentificationResultView
                  species={currentSpecies}
                  onScanAnother={() => setCurrentSpecies(null)}
                />
              ) : (
                <UniversalScanner
                  onScanComplete={(species) => setCurrentSpecies(species)}
                />
              )}
            </>
          )}

          {activeTab === 'doctor' && <PlantDoctorView />}

          {activeTab === 'my-plants' && <MyPlantsView />}

          {activeTab === 'explore' && <ExploreView />}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <PlantAssistantChat />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <SafetyWarningModal
        isOpen={isSafetyOpen}
        onClose={() => setIsSafetyOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
