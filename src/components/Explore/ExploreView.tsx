'use client';

import React, { useState } from 'react';
import { usePlant } from '@/context/PlantContext';
import { BOTANICAL_DATABASE } from '@/data/botanicalData';
import { PlantSpecies, PlantCategory } from '@/types/plant';
import {
  Compass,
  Search,
  Sun,
  Droplets,
  HeartHandshake,
  MessageSquareQuote,
  MapPin,
  ChevronRight,
  X,
} from 'lucide-react';

const CATEGORIES: Array<'All' | PlantCategory> = [
  'All',
  'Houseplant',
  'Flower',
  'Tree & Shrub',
  'Herb & Vegetable',
  'Succulent & Cactus',
  'Medicinal Plant',
  'Mushroom & Fungi',
];

export const ExploreView: React.FC = () => {
  const { userLocation, startChatForSpecies, setCurrentSpecies, setActiveTab } = usePlant();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | PlantCategory>('All');
  const [filterPetSafeOnly, setFilterPetSafeOnly] = useState(false);
  const [inspectingPlant, setInspectingPlant] = useState<PlantSpecies | null>(null);

  const filteredPlants = BOTANICAL_DATABASE.filter((plant) => {
    const matchesCategory = selectedCategory === 'All' || plant.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      plant.commonName.toLowerCase().includes(q) ||
      plant.scientificName.toLowerCase().includes(q) ||
      plant.family.toLowerCase().includes(q);
    const matchesPetSafety = !filterPetSafeOnly || !plant.toxicity?.isToxicToPets;

    return matchesCategory && matchesSearch && matchesPetSafety;
  });

  const handleOpenDetailedScan = (plant: PlantSpecies) => {
    setCurrentSpecies(plant);
    setActiveTab('identify');
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Hero Exploration Banner */}
      <div className="nature-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3A725D] mb-1">
            <Compass className="w-4 h-4 text-[#183D32]" />
            <span>Botanical Encyclopedia</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#183D32]">
            Explore Plant Species Worldwide
          </h2>
          <p className="text-xs sm:text-sm text-[#73847B] max-w-lg mt-1">
            Browse verified botanical taxonomies, native ranges, traditional medicinal lore, and climate adaptation guidelines.
          </p>
        </div>

        {/* Location-aware badge */}
        <div className="p-3.5 rounded-2xl bg-[#EDF4EB] border border-[#C8DBC4] text-xs space-y-1">
          <div className="font-bold text-[#183D32] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#3A725D]" />
            <span>Adapted for:</span>
          </div>
          <div className="text-[#475850] font-medium">{userLocation}</div>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73847B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search botanical database by common or scientific name (e.g. Tulsi, Rose, Pothos)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#183D32]/15 bg-[#FFFFFF] text-xs text-[#1A2420] focus:outline-none focus:ring-2 focus:ring-[#183D32]"
            />
          </div>

          {/* Pet Safe Filter Toggle */}
          <button
            type="button"
            onClick={() => setFilterPetSafeOnly(!filterPetSafeOnly)}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 whitespace-nowrap ${
              filterPetSafeOnly
                ? 'bg-[#183D32] text-[#F7F8F3] border-[#183D32]'
                : 'bg-[#FFFFFF] text-[#475850] border-[#183D32]/10 hover:border-[#183D32]/30'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Pet Safe Only</span>
          </button>
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#183D32] text-[#F7F8F3] shadow-xs'
                    : 'bg-[#FFFFFF] text-[#475850] border border-[#183D32]/10 hover:border-[#183D32]/30'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Botanical Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPlants.map((plant) => (
          <div
            key={plant.id}
            onClick={() => setInspectingPlant(plant)}
            className="nature-card overflow-hidden cursor-pointer hover:border-[#183D32]/40 group flex flex-col justify-between"
          >
            <div>
              {/* Photo */}
              <div className="aspect-16/10 relative overflow-hidden bg-stone-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={plant.imageUrl}
                  alt={plant.commonName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold">
                  {plant.category}
                </span>

                {plant.toxicity?.isToxicToPets && (
                  <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#FEF2F2]/90 backdrop-blur-xs text-[#991B1B] text-[10px] font-bold border border-[#FECACA]">
                    Toxic to Pets
                  </span>
                )}
              </div>

              {/* Information */}
              <div className="p-4 space-y-2">
                <div>
                  <h4 className="font-serif text-base font-bold text-[#183D32] group-hover:text-[#3A725D] transition-colors truncate">
                    {plant.commonName}
                  </h4>
                  <div className="text-xs text-[#73847B] italic truncate">
                    {plant.scientificName}
                  </div>
                </div>

                <p className="text-xs text-[#475850] line-clamp-2 leading-relaxed">
                  {plant.description}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-[#73847B] pt-2 border-t border-[#183D32]/5">
                  <div className="flex items-center gap-1">
                    <Sun className="w-3 h-3 text-[#D97706]" />
                    <span className="truncate max-w-[100px]">{plant.growingConditions?.sunlight}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-[#0284C7]" />
                    <span>{plant.growingConditions?.water}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-[#F7F8F3] border-t border-[#183D32]/10 flex items-center justify-between text-xs font-semibold text-[#183D32]">
              <span>View Botanical Specs</span>
              <ChevronRight className="w-4 h-4 text-[#3A725D] group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* QUICK PREVIEW / BOTANICAL SPEC MODAL */}
      {inspectingPlant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#183D32]/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-[#FFFFFF] rounded-3xl shadow-2xl border border-[#183D32]/15 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header Photo */}
            <div className="relative aspect-16/9 bg-stone-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={inspectingPlant.imageUrl}
                alt={inspectingPlant.commonName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <button
                type="button"
                onClick={() => setInspectingPlant(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-[10px] uppercase font-bold text-[#DCE8D9] tracking-wider">
                  {inspectingPlant.family} &middot; {inspectingPlant.category}
                </span>
                <h3 className="font-serif text-2xl font-bold">{inspectingPlant.commonName}</h3>
                <div className="text-xs text-stone-300 italic">{inspectingPlant.scientificName}</div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <p className="text-xs text-[#1A2420] leading-relaxed">
                {inspectingPlant.description}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10">
                  <div className="font-bold text-[#183D32] mb-0.5">Native Region</div>
                  <div className="text-[#475850]">{inspectingPlant.nativeRegion}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10">
                  <div className="font-bold text-[#183D32] mb-0.5">Typical Size</div>
                  <div className="text-[#475850]">{inspectingPlant.typicalSize}</div>
                </div>
              </div>

              {inspectingPlant.traditionalUses && inspectingPlant.traditionalUses.length > 0 && (
                <div className="p-3.5 rounded-xl bg-[#EDF4EB] border border-[#C8DBC4] space-y-1">
                  <div className="font-bold text-[#183D32]">Cultural & Medicinal Lore</div>
                  <p className="text-[#183D32] leading-relaxed">
                    {inspectingPlant.traditionalUses[0].description}
                  </p>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-4 border-t border-[#183D32]/10 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    startChatForSpecies(inspectingPlant);
                    setInspectingPlant(null);
                  }}
                  className="py-2.5 px-4 rounded-xl text-xs font-bold bg-[#F1EBDD] text-[#183D32] border border-[#E5DCB8] hover:bg-[#E8DFC9] flex items-center gap-1.5"
                >
                  <MessageSquareQuote className="w-4 h-4 text-[#183D32]" />
                  <span>Ask AI Botanist</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleOpenDetailedScan(inspectingPlant);
                    setInspectingPlant(null);
                  }}
                  className="py-2.5 px-5 rounded-xl text-xs font-bold bg-[#183D32] text-[#F7F8F3] hover:bg-[#122E26] shadow-sm flex items-center gap-1.5"
                >
                  <span>Open Full Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
