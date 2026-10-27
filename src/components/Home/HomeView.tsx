'use client';

import React from 'react';
import { usePlant } from '@/context/PlantContext';
import { BOTANICAL_FACTS_OF_THE_DAY, BOTANICAL_DATABASE } from '@/data/botanicalData';
import {
  Camera,
  Stethoscope,
  Sprout,
  Sparkles,
  Droplets,
  Clock,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';

export const HomeView: React.FC = () => {
  const {
    setActiveTab,
    savedPlants,
    careReminders,
    toggleReminderDone,
    recentScans,
    setCurrentSpecies,
    userLocation,
  } = usePlant();

  // Personalized time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning, Plant Enthusiast';
    if (hour < 17) return 'Good Afternoon, Botanical Explorer';
    return 'Good Evening, Nature Lover';
  };

  // Daily botanical fact (rotated deterministically)
  const todayFact = BOTANICAL_FACTS_OF_THE_DAY[new Date().getDate() % BOTANICAL_FACTS_OF_THE_DAY.length];

  const handleRecentClick = (species: typeof BOTANICAL_DATABASE[0]) => {
    setCurrentSpecies(species);
    setActiveTab('identify');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      {/* 1. GREETING & HERO CALLOUT */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#3A725D] flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#15803D] animate-pulse" />
            <span>Botanical Intelligence Active &middot; {userLocation}</span>
          </span>
          <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#183D32] tracking-tight">
            {getGreeting()}
          </h1>
          <p className="text-xs sm:text-sm text-[#475850] mt-1">
            Discover, diagnose, and cultivate any plant species anywhere in the world.
          </p>
        </div>
      </div>

      {/* 2. PRIMARY ACTION CARDS: SCAN & DIAGNOSE */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Large Identify Camera Card (Primary CTA) */}
        <div
          onClick={() => setActiveTab('identify')}
          className="md:col-span-7 nature-card p-6 sm:p-8 cursor-pointer relative overflow-hidden group bg-gradient-to-br from-[#183D32] to-[#245647] text-[#F7F8F3] shadow-lg flex flex-col justify-between min-h-[260px] active:scale-99 transition-all"
        >
          {/* Subtle botanical leafy background watermark */}
          <div className="absolute -right-6 -bottom-6 opacity-15 pointer-events-none transform group-hover:scale-110 transition-transform duration-500 overflow-hidden">
            <Sprout className="w-48 h-48 text-[#DCE8D9]" />
          </div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DCE8D9]/20 text-[#DCE8D9] text-xs font-bold border border-[#DCE8D9]/30 mb-4 backdrop-blur-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#34D399]" />
              <span>Universal Scanner</span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#F7F8F3] tracking-tight mb-2">
              Identify Any Plant
            </h2>
            <p className="text-xs sm:text-sm text-[#DCE8D9]/90 max-w-md leading-relaxed">
              Point your camera or upload a photo of flowers, trees, mushrooms, houseplants, weeds, or crops. No pre-selection needed.
            </p>
          </div>

          <div className="relative z-10 pt-6 flex items-center justify-between">
            <div className="py-2.5 px-5 rounded-2xl bg-[#DCE8D9] text-[#183D32] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md group-hover:bg-[#FFFFFF] transition-colors">
              <Camera className="w-4 h-4 text-[#183D32]" />
              <span>Scan a Plant Now</span>
            </div>

            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-5 h-5 text-[#DCE8D9]" />
            </div>
          </div>
        </div>

        {/* Secondary Card: Check Plant Health (Plant Doctor) */}
        <div
          onClick={() => setActiveTab('doctor')}
          className="md:col-span-5 nature-card-cream p-6 sm:p-8 cursor-pointer relative overflow-hidden group shadow-md flex flex-col justify-between min-h-[260px] active:scale-99 transition-all"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#183D32]/10 text-[#183D32] text-xs font-bold border border-[#183D32]/20 mb-4">
              <Stethoscope className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Plant Doctor</span>
            </div>

            <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#183D32] tracking-tight mb-2">
              Check Plant Health
            </h3>
            <p className="text-xs text-[#475850] leading-relaxed">
              Yellow leaves, brown tips, or wilting? Diagnose visible symptoms and get custom recovery protocols.
            </p>
          </div>

          <div className="pt-6 flex items-center justify-between">
            <span className="text-xs font-bold text-[#183D32] flex items-center gap-1.5">
              <span>Launch Pathology Triage</span>
              <ArrowRight className="w-4 h-4 text-[#3A725D] group-hover:translate-x-1 transition-transform" />
            </span>

            <div className="w-10 h-10 rounded-2xl bg-[#183D32] text-[#F1EBDD] flex items-center justify-center shadow-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. CARE REMINDERS & MY PLANTS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Plant Care Reminders */}
        <div className="md:col-span-6 nature-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#EDF4EB] flex items-center justify-center text-[#183D32]">
                  <Droplets className="w-4 h-4 text-[#0284C7]" />
                </div>
                <h3 className="font-serif text-base font-bold text-[#183D32]">
                  Plant Care Reminders
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[#3A725D]">
                {careReminders.filter((r) => !r.completed).length} pending
              </span>
            </div>

            <div className="space-y-2.5">
              {careReminders.slice(0, 3).map((reminder) => (
                <div
                  key={reminder.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                    reminder.completed
                      ? 'bg-[#F7F8F3]/50 border-stone-200 opacity-60'
                      : 'bg-[#F7F8F3] border-[#183D32]/10 hover:border-[#183D32]/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={reminder.plantImage}
                      alt={reminder.plantName}
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#183D32] truncate">
                        {reminder.plantNickname || reminder.plantName}
                      </div>
                      <div className="text-[11px] text-[#73847B] flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span className="capitalize">{reminder.type} &middot; {reminder.dueDate}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleReminderDone(reminder.id)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      reminder.completed
                        ? 'bg-[#EDF4EB] text-[#15803D]'
                        : 'bg-[#183D32] text-[#F7F8F3] hover:bg-[#122E26]'
                    }`}
                  >
                    {reminder.completed ? 'Done ✓' : 'Mark Done'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#183D32]/10 flex justify-between items-center text-xs">
            <span className="text-[#73847B]">Hydration keeps root microbiome active</span>
            <button
              onClick={() => setActiveTab('my-plants')}
              className="font-bold text-[#183D32] hover:underline"
            >
              View All Reminders
            </button>
          </div>
        </div>

        {/* My Plants Collection Summary */}
        <div className="md:col-span-6 nature-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#EDF4EB] flex items-center justify-center text-[#183D32]">
                  <Sprout className="w-4 h-4 text-[#183D32]" />
                </div>
                <h3 className="font-serif text-base font-bold text-[#183D32]">
                  My Collection ({savedPlants.length})
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('my-plants')}
                className="text-[11px] font-bold text-[#183D32] hover:underline flex items-center gap-1"
              >
                <span>Manage</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {savedPlants.slice(0, 3).map((plant) => (
                <div
                  key={plant.id}
                  onClick={() => setActiveTab('my-plants')}
                  className="rounded-2xl border border-[#183D32]/10 overflow-hidden bg-[#F7F8F3] hover:border-[#183D32] transition-all cursor-pointer group"
                >
                  <div className="aspect-square relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={plant.imageUrl}
                      alt={plant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-black/60 text-white">
                      {plant.location}
                    </span>
                  </div>
                  <div className="p-2">
                    <div className="text-xs font-bold text-[#183D32] truncate">
                      {plant.nickname || plant.name}
                    </div>
                    <div className="text-[10px] text-[#15803D] font-medium">Healthy</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#183D32]/10 flex justify-between items-center text-xs">
            <span className="text-[#73847B]">Includes photo timelines & care logs</span>
            <button
              onClick={() => setActiveTab('identify')}
              className="font-bold text-[#183D32] hover:underline"
            >
              + Add Plant
            </button>
          </div>
        </div>
      </div>

      {/* 4. RECENTLY SCANNED PLANTS CAROUSEL */}
      <div className="nature-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#183D32]">
              Recently Identified Plants
            </h3>
            <p className="text-xs text-[#73847B]">
              Taxonomies and care profiles from your previous scans
            </p>
          </div>

          <button
            onClick={() => setActiveTab('explore')}
            className="text-xs font-bold text-[#183D32] hover:underline flex items-center gap-1"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {recentScans.slice(0, 6).map((specimen) => (
            <div
              key={specimen.id}
              onClick={() => handleRecentClick(specimen)}
              className="rounded-2xl border border-[#183D32]/10 overflow-hidden bg-[#F7F8F3] hover:border-[#183D32] hover:shadow-sm transition-all cursor-pointer group text-left"
            >
              <div className="aspect-square relative overflow-hidden bg-stone-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={specimen.imageUrl}
                  alt={specimen.commonName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-black/70 text-white backdrop-blur-2xs">
                  {specimen.confidence}%
                </span>
              </div>
              <div className="p-2.5">
                <div className="text-xs font-bold text-[#183D32] truncate">
                  {specimen.commonName}
                </div>
                <div className="text-[10px] text-[#73847B] italic truncate">
                  {specimen.scientificName}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. DAILY BOTANICAL FACT CARD */}
      <div className="p-6 rounded-3xl bg-[#F1EBDD] border border-[#E5DCB8] flex items-start gap-4 shadow-sm">
        <div className="w-10 h-10 rounded-2xl bg-[#183D32] text-[#F1EBDD] flex items-center justify-center shrink-0 shadow-xs">
          <Lightbulb className="w-5 h-5 text-[#F1EBDD]" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#183D32] px-2 py-0.5 rounded-md bg-[#E8DFC9]">
              Botanical Fact of the Day
            </span>
            <span className="text-xs text-[#73847B] font-medium">{todayFact.category}</span>
          </div>
          <p className="text-xs sm:text-sm text-[#1A2420] leading-relaxed pt-0.5">
            {todayFact.fact}
          </p>
        </div>
      </div>
    </div>
  );
};
