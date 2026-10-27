'use client';

import React, { useState } from 'react';
import { usePlant } from '@/context/PlantContext';
import { PlantSpecies } from '@/types/plant';
import confetti from 'canvas-confetti';
import {
  BookmarkPlus,
  Stethoscope,
  MessageSquareQuote,
  Share2,
  RotateCcw,
  ShieldAlert,
  Sun,
  Droplets,
  Sprout,
  Compass,
  CheckCircle2,
  Sparkles,
  Layers,
  Thermometer,
  TreeDeciduous,
  Leaf,
  Flower2,
  HeartHandshake,
} from 'lucide-react';

interface IdentificationResultViewProps {
  species: PlantSpecies;
  onScanAnother: () => void;
}

export const IdentificationResultView: React.FC<IdentificationResultViewProps> = ({
  species,
  onScanAnother,
}) => {
  const {
    savePlantToCollection,
    savedPlants,
    startDiagnosisForSpecies,
    startChatForSpecies,
  } = usePlant();

  const [isSaved, setIsSaved] = useState(
    savedPlants.some((p) => p.scientificName === species.scientificName)
  );
  const [activeTab, setActiveTab] = useState<'care' | 'characteristics' | 'ecology' | 'facts'>('care');
  const [copiedShare, setCopiedShare] = useState(false);

  // Trigger celebration confetti on saving
  const handleSaveToCollection = () => {
    savePlantToCollection(species);
    setIsSaved(true);

    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#183D32', '#DCE8D9', '#F1EBDD', '#34D399'],
      });
    } catch {}
  };

  // Share plant identification
  const handleShare = async () => {
    const text = `Identified with PlantLens AI: ${species.commonName} (${species.scientificName}) - ${species.confidence}% confidence.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `PlantLens AI - ${species.commonName}`,
          text,
          url: window.location.href,
        });
        return;
      } catch {}
    }

    navigator.clipboard.writeText(`${text}\n${window.location.href}`);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  if (species.isPlantOrganism === false) {
    return (
      <div className="w-full max-w-2xl mx-auto p-8 rounded-3xl bg-white border-2 border-[#183D32]/10 shadow-xl text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-3xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center mx-auto text-[#DC2626]">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF2F2] text-[#DC2626] text-xs font-bold uppercase tracking-wider">
            Non-Plant Subject Detected
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#183D32]">
            No Plant Organism Found
          </h2>
          <p className="text-sm text-[#475850] max-w-md mx-auto leading-relaxed">
            {species.nonPlantDetectedReason ||
              'The uploaded image appears to contain an object, vehicle, furniture, animal, or non-botanical subject.'}
          </p>
        </div>

        {species.imageUrl && (
          <div className="w-48 h-48 mx-auto rounded-2xl overflow-hidden border border-[#183D32]/10 shadow-inner bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={species.imageUrl} alt="Uploaded non-plant preview" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-4 rounded-2xl bg-[#F7F8F3] border border-[#183D32]/10 text-left text-xs space-y-2">
          <div className="font-bold text-[#183D32] uppercase tracking-wider">
            Tips for Plant Identification:
          </div>
          <ul className="space-y-1 text-[#475850] list-disc list-inside">
            <li>Take a clear, well-lit photo of a flower, leaf, or tree bark.</li>
            <li>Fill at least 50% of the frame with the plant foliage.</li>
            <li>Avoid heavy motion blur or extreme distance.</li>
          </ul>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onScanAnother}
            className="py-3 px-6 rounded-xl bg-[#183D32] text-[#F7F8F3] font-bold text-sm hover:bg-[#122E26] shadow-md transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Scan Another Image</span>
          </button>
        </div>
      </div>
    );
  }

  const isMushroomOrToxic =
    species.category === 'Mushroom & Fungi' ||
    species.toxicity?.severity === 'severe' ||
    species.toxicity?.severity === 'fatal_risk' ||
    species.safetyWarning;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* SIMULATED DEMO MODE TRANSPARENCY NOTICE */}
      {species.isDemoMode && (
        <div className="p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-between gap-3 text-xs text-[#92400E]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D97706] animate-pulse" />
            <span className="font-medium">
              <strong>Demonstration Mode:</strong> No Gemini API key detected. Botanical data is referenced from our verified catalog. For live vision identification on custom photos, add a key in Settings.
            </span>
          </div>
        </div>
      )}

      {/* CRITICAL MUSHROOM / TOXICITY SAFETY BANNER IF APPLICABLE */}
      {isMushroomOrToxic && (
        <div className="p-4 rounded-2xl bg-[#FEF2F2] border-2 border-[#FECACA] shadow-sm flex items-start gap-3.5">
          <ShieldAlert className="w-6 h-6 text-[#DC2626] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-[#991B1B] text-sm uppercase tracking-wider flex items-center gap-2">
              <span>Mushroom & Safety Caution</span>
              <span className="px-2 py-0.5 rounded-full bg-[#DC2626] text-white text-[10px]">Strict Advice</span>
            </h4>
            <p className="text-[#7F1D1D] leading-relaxed">
              {species.safetyWarning ||
                'Never consume or forage wild plants or mushrooms identified from camera photographs. Similar species can contain fatal toxins.'}
            </p>
            <p className="text-[11px] text-[#991B1B] font-semibold">
              Emergency Poison Hotline: US 1-800-222-1222 | India 1800-116-117 (AIIMS)
            </p>
          </div>
        </div>
      )}

      {/* HERO BOTANICAL CARD */}
      <div className="nature-card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Main Plant Photograph with Zoom and Confidence Badge */}
          <div className="md:col-span-5 relative aspect-4/3 md:aspect-auto md:min-h-[360px] bg-stone-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={species.imageUrl}
              alt={species.commonName}
              className="w-full h-full object-cover"
            />
            {/* Gradient Scrim for readable badges */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent md:hidden" />

            {/* Confidence Badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#183D32]/90 backdrop-blur-md text-[#DCE8D9] border border-[#DCE8D9]/30 text-xs font-bold shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-[#34D399]" />
              <span>{species.confidence}% Confidence</span>
            </div>

            {/* Category Tag */}
            <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 text-xs font-medium">
              {species.category}
            </div>

            {/* Verification status pill */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-medium text-stone-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
              <span>{species.verifiedStatus === 'botanically_verified' ? 'Verified Taxonomy' : 'AI Estimated'}</span>
            </div>
          </div>

          {/* Plant Identity & Quick Facts */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3A725D] mb-1">
                <span>{species.family}</span>
                <span>&bull;</span>
                <span>{species.lifespan || 'Perennial'}</span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl font-extrabold text-[#183D32] tracking-tight leading-snug">
                {species.commonName}
              </h1>

              <div className="text-base sm:text-lg text-[#475850] italic font-serif mt-0.5 mb-4">
                {species.scientificName}
              </div>

              <p className="text-xs sm:text-sm text-[#1A2420] leading-relaxed mb-6">
                {species.description}
              </p>

              {/* 3 Quick Botanical Metric Badges */}
              <div className="grid grid-cols-3 gap-2.5 mb-6">
                <div className="p-2.5 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10 text-center">
                  <Sun className="w-4 h-4 text-[#D97706] mx-auto mb-1" />
                  <div className="text-[10px] uppercase font-bold text-[#73847B]">Light</div>
                  <div className="text-xs font-semibold text-[#183D32] truncate">
                    {species.growingConditions?.sunlight || 'Bright'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10 text-center">
                  <Droplets className="w-4 h-4 text-[#0284C7] mx-auto mb-1" />
                  <div className="text-[10px] uppercase font-bold text-[#73847B]">Water</div>
                  <div className="text-xs font-semibold text-[#183D32] truncate">
                    {species.growingConditions?.water || 'Moderate'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10 text-center">
                  <HeartHandshake className="w-4 h-4 text-[#C2410C] mx-auto mb-1" />
                  <div className="text-[10px] uppercase font-bold text-[#73847B]">Pets</div>
                  <div className="text-xs font-semibold text-[#183D32] truncate">
                    {species.toxicity?.isToxicToPets ? 'Toxic' : 'Pet Safe'}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[#183D32]/10">
              <button
                type="button"
                onClick={handleSaveToCollection}
                disabled={isSaved}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isSaved
                    ? 'bg-[#EDF4EB] text-[#183D32] border border-[#C8DBC4]'
                    : 'bg-[#183D32] text-[#F7F8F3] hover:bg-[#122E26] shadow-sm'
                }`}
              >
                <BookmarkPlus className="w-4 h-4" />
                <span>{isSaved ? 'In My Plants' : 'Save to My Plants'}</span>
              </button>

              <button
                type="button"
                onClick={() => startDiagnosisForSpecies(species)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold bg-[#F1EBDD] text-[#183D32] border border-[#E5DCB8] hover:bg-[#E8DFC9] transition-all flex items-center gap-1.5"
              >
                <Stethoscope className="w-4 h-4 text-[#D97706]" />
                <span>Check Health</span>
              </button>

              <button
                type="button"
                onClick={() => startChatForSpecies(species)}
                className="py-2.5 px-4 rounded-xl text-xs font-bold bg-[#F7F8F3] text-[#183D32] border border-[#183D32]/10 hover:bg-[#DCE8D9]/50 transition-all flex items-center gap-1.5"
              >
                <MessageSquareQuote className="w-4 h-4 text-[#3A725D]" />
                <span>Ask AI</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="p-2.5 rounded-xl text-xs text-[#475850] hover:text-[#183D32] hover:bg-[#F1EBDD] transition-colors"
                title="Share Identification"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onScanAnother}
                className="py-2.5 px-3 rounded-xl text-xs font-medium text-[#475850] hover:text-[#183D32] hover:bg-[#EDF4EB] ml-auto transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Scan Another</span>
              </button>
            </div>
            {copiedShare && (
              <div className="text-[11px] text-[#15803D] font-medium mt-1">
                Link copied to clipboard!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ALTERNATIVE SPECIES CANDIDATES IF ANY */}
      {species.alternativeCandidates && species.alternativeCandidates.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#183D32]/10 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-[#3A725D]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#183D32]">
              Alternative Species Candidates
            </span>
            <span className="text-[11px] text-[#73847B] ml-auto">
              Considered by botanical vision
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {species.alternativeCandidates.map((alt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10 text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-bold text-[#183D32]">
                  <span>{alt.commonName}</span>
                  <span className="font-mono text-[11px] text-[#73847B]">{alt.confidence}%</span>
                </div>
                <div className="text-[#475850] italic text-[11px]">{alt.scientificName}</div>
                <p className="text-[11px] text-[#73847B]">{alt.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DETAILED INFORMATION TABS */}
      <div className="nature-card p-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#183D32]/10 pb-3 mb-6 overflow-x-auto">
          {[
            { id: 'care' as const, label: 'Growing & Care Guide', icon: Sun },
            { id: 'characteristics' as const, label: 'Plant Anatomy', icon: Leaf },
            { id: 'ecology' as const, label: 'Uses & Ecology', icon: TreeDeciduous },
            { id: 'facts' as const, label: 'Botanical Lore & Facts', icon: Flower2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#183D32] text-[#F7F8F3] shadow-xs'
                    : 'text-[#475850] hover:text-[#183D32] hover:bg-[#EDF4EB]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#DCE8D9]' : 'text-[#73847B]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: GROWING & CARE GUIDE */}
        {activeTab === 'care' && (
          <div className="space-y-6 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#183D32] text-xs uppercase tracking-wider">
                  <Sun className="w-4 h-4 text-[#D97706]" />
                  <span>Sunlight Requirements</span>
                </div>
                <div className="font-semibold text-sm text-[#183D32]">
                  {species.growingConditions?.sunlight}
                </div>
                <p className="text-xs text-[#475850] leading-relaxed">
                  {species.growingConditions?.sunlightDetails}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#183D32] text-xs uppercase tracking-wider">
                  <Droplets className="w-4 h-4 text-[#0284C7]" />
                  <span>Watering Protocol</span>
                </div>
                <div className="font-semibold text-sm text-[#183D32]">
                  {species.growingConditions?.water} Hydration
                </div>
                <p className="text-xs text-[#475850] leading-relaxed">
                  {species.growingConditions?.waterDetails}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#183D32] text-xs uppercase tracking-wider">
                  <Sprout className="w-4 h-4 text-[#15803D]" />
                  <span>Soil & Potting Mix</span>
                </div>
                <p className="text-xs text-[#475850] leading-relaxed">
                  {species.growingConditions?.soil}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-[#183D32] text-xs uppercase tracking-wider">
                  <Thermometer className="w-4 h-4 text-[#C2410C]" />
                  <span>Temperature & Humidity</span>
                </div>
                <div className="text-xs text-[#183D32] font-semibold">
                  {species.growingConditions?.temperature} &middot; {species.growingConditions?.humidity}
                </div>
              </div>
            </div>

            {/* Propagation Section */}
            {species.propagationMethods && species.propagationMethods.length > 0 && (
              <div className="p-4 rounded-xl bg-[#EDF4EB] border border-[#C8DBC4]">
                <h4 className="font-serif font-bold text-sm text-[#183D32] mb-2 flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-[#183D32]" />
                  Recommended Propagation Methods
                </h4>
                <ul className="list-disc list-inside space-y-1 text-xs text-[#183D32]">
                  {species.propagationMethods.map((method, idx) => (
                    <li key={idx} className="leading-relaxed">
                      {method}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Regional Climate Compatibility */}
            {species.climateCompatibility && (
              <div className="p-4 rounded-xl bg-[#F1EBDD] border border-[#E5DCB8] text-xs space-y-1.5">
                <h4 className="font-bold text-[#183D32] flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-[#183D32]" />
                  Regional Climate Assessment (India & Global)
                </h4>
                <p className="text-[#475850] leading-relaxed">
                  {species.climateCompatibility.localNotes ||
                    'Suitable for tropical, subtropical, and indoor climates globally.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CHARACTERISTICS & ANATOMY */}
        {activeTab === 'characteristics' && (
          <div className="space-y-4 text-xs leading-relaxed">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10">
                <div className="font-bold text-[#183D32] mb-1">Leaf Characteristics</div>
                <p className="text-[#475850]">{species.leafCharacteristics || 'Alternate, distinct venation.'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10">
                <div className="font-bold text-[#183D32] mb-1">Flowering Season</div>
                <p className="text-[#475850]">{species.floweringSeason || 'Seasonal'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10">
                <div className="font-bold text-[#183D32] mb-1">Native Region & Range</div>
                <p className="text-[#475850]">{species.nativeRegion || 'Global'}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10">
                <div className="font-bold text-[#183D32] mb-1">Typical Size & Habit</div>
                <p className="text-[#475850]">{species.typicalSize || 'Varies by container'}</p>
              </div>
            </div>

            {species.fruitSeedInfo && (
              <div className="p-3.5 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10">
                <div className="font-bold text-[#183D32] mb-1">Fruit & Seed Architecture</div>
                <p className="text-[#475850]">{species.fruitSeedInfo}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: USES & ECOLOGY */}
        {activeTab === 'ecology' && (
          <div className="space-y-4 text-xs leading-relaxed">
            <div className="p-4 rounded-xl bg-[#EDF4EB] border border-[#C8DBC4]">
              <div className="font-bold text-[#183D32] text-sm mb-1">Ecological Role</div>
              <p className="text-[#183D32] leading-relaxed">{species.ecologicalImportance}</p>
            </div>

            {species.traditionalUses && species.traditionalUses.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-[#183D32]">Cultural & Traditional Uses</h4>
                {species.traditionalUses.map((use, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        use.evidenceLevel === 'verified_scientific'
                          ? 'bg-[#DCFCE7] text-[#15803D]'
                          : 'bg-[#FEF3C7] text-[#B45309]'
                      }`}>
                        {use.evidenceLevel === 'verified_scientific' ? 'Scientifically Studied' : 'Traditional Lore'}
                      </span>
                      {use.citation && (
                        <span className="text-[10px] text-[#73847B] truncate">({use.citation})</span>
                      )}
                    </div>
                    <p className="text-[#1A2420]">{use.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Toxicity details */}
            <div className="p-4 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10 space-y-2">
              <div className="font-bold text-[#183D32] text-sm flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#C2410C]" />
                Toxicity Profile & Safety
              </div>
              <p className="text-[#475850]">{species.toxicity?.details}</p>
              {species.toxicity?.emergencyGuidance && (
                <div className="p-2.5 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-[11px] font-medium">
                  <strong>First Aid: </strong> {species.toxicity.emergencyGuidance}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: BOTANICAL FACTS */}
        {activeTab === 'facts' && (
          <div className="space-y-3">
            {species.botanicalFacts?.map((fact, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#F1EBDD]/70 border border-[#E5DCB8] flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-[#183D32] text-[#F7F8F3] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-xs text-[#1A2420] leading-relaxed">{fact}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
