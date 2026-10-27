'use client';

import React, { useState } from 'react';
import { usePlant } from '@/context/PlantContext';
import { SavedPlant } from '@/types/plant';
import confetti from 'canvas-confetti';
import {
  Sprout,
  Plus,
  Search,
  Droplets,
  Sun,
  MapPin,
  Trash2,
  Activity,
  X,
  Stethoscope,
  Download,
  Upload,
  ShieldCheck,
} from 'lucide-react';

const LOCATIONS = [
  'All',
  'Living Room',
  'Balcony',
  'Garden',
  'Kitchen',
  'Bedroom',
  'Office',
  'Outdoor Farm',
];

export const MyPlantsView: React.FC = () => {
  const {
    savedPlants,
    deleteSavedPlant,
    waterPlant,
    addTimelineObservation,
    setActiveTab,
    importCollection,
  } = usePlant();

  const [selectedLocation, setSelectedLocation] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPlant, setSelectedPlant] = useState<SavedPlant | null>(null);

  // New observation modal state
  const [isAddingObservation, setIsAddingObservation] = useState(false);
  const [observationNote, setObservationNote] = useState('');
  const [observationType, setObservationType] = useState<'observation' | 'photo' | 'water'>('observation');

  // Filtered plant list
  const filteredPlants = savedPlants.filter((plant) => {
    const matchesLoc = selectedLocation === 'All' || plant.location === selectedLocation;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      plant.name.toLowerCase().includes(q) ||
      plant.scientificName.toLowerCase().includes(q) ||
      (plant.nickname && plant.nickname.toLowerCase().includes(q));
    return matchesLoc && matchesSearch;
  });

  const handleWaterClick = (e: React.MouseEvent, plantId: string) => {
    e.stopPropagation();
    waterPlant(plantId);
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#0284C7', '#38BDF8', '#DCE8D9'],
      });
    } catch {}
  };

  const handleAddObservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlant || !observationNote.trim()) return;

    addTimelineObservation(selectedPlant.id, observationNote, observationType);

    // Refresh selected plant in modal
    const updated = savedPlants.find((p) => p.id === selectedPlant.id);
    if (updated) setSelectedPlant(updated);

    setObservationNote('');
    setIsAddingObservation(false);
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedPlants, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `plantlens-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name) {
          importCollection(parsed);
          alert(`Successfully imported ${parsed.length} plants into your collection!`);
        } else {
          alert('Invalid backup file format. Expected a PlantLens JSON export.');
        }
      } catch {
        alert('Failed to parse backup file. Please ensure it is valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Top Banner & Stats */}
      <div className="nature-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#3A725D] mb-1">
            <Sprout className="w-4 h-4 text-[#183D32]" />
            <span>Personal Plant Collection</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#183D32]">
            My Plants ({savedPlants.length})
          </h2>
          <p className="text-xs text-[#73847B]">
            Track watering schedules, health timelines, and growth observations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab('identify')}
          className="py-2.5 px-5 rounded-2xl bg-[#183D32] text-[#F7F8F3] text-xs font-bold hover:bg-[#122E26] shadow-sm flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Scan & Add New Plant</span>
        </button>
      </div>

      {/* DATA PERSISTENCE & PRIVACY NOTICE */}
      <div className="p-3.5 rounded-2xl bg-[#F7F8F3] border border-[#183D32]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#475850]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0" />
          <span>
            <strong>Device-Local Storage:</strong> Your collection and reminders persist in this browser. To transfer or back up data across devices, use the tools below.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportBackup}
            className="py-1.5 px-3 rounded-xl bg-white border border-[#183D32]/20 hover:bg-[#EDF4EB] text-[11px] font-semibold text-[#183D32] flex items-center gap-1.5 transition-colors"
            title="Download JSON backup"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup</span>
          </button>
          <label className="py-1.5 px-3 rounded-xl bg-white border border-[#183D32]/20 hover:bg-[#EDF4EB] text-[11px] font-semibold text-[#183D32] flex items-center gap-1.5 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Restore Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Filter Toolbar (Search & Location Chips) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73847B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by nickname, common or scientific name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#183D32]/15 bg-[#FFFFFF] text-xs text-[#1A2420] focus:outline-none focus:ring-2 focus:ring-[#183D32]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#73847B]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Location selector pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {LOCATIONS.map((loc) => {
            const isSelected = selectedLocation === loc;
            return (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#183D32] text-[#F7F8F3] shadow-xs'
                    : 'bg-[#FFFFFF] text-[#475850] border border-[#183D32]/10 hover:border-[#183D32]/30'
                }`}
              >
                {loc}
              </button>
            );
          })}
        </div>
      </div>

      {/* Plant Grid */}
      {filteredPlants.length === 0 ? (
        <div className="nature-card p-12 text-center text-[#73847B] space-y-3">
          <Sprout className="w-12 h-12 text-[#C8DBC4] mx-auto" />
          <h4 className="font-serif text-lg font-bold text-[#183D32]">No Plants Found</h4>
          <p className="text-xs max-w-sm mx-auto">
            {searchQuery
              ? `No plants match "${searchQuery}". Try a different search or location.`
              : 'Your plant collection in this location is currently empty.'}
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('identify')}
            className="py-2 px-4 rounded-xl text-xs font-bold bg-[#183D32] text-[#F7F8F3] hover:bg-[#122E26]"
          >
            Scan a Plant to Add
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlants.map((plant) => {
            return (
              <div
                key={plant.id}
                onClick={() => setSelectedPlant(plant)}
                className="nature-card overflow-hidden cursor-pointer hover:border-[#183D32]/40 group flex flex-col justify-between"
              >
                <div>
                  {/* Photo Header */}
                  <div className="aspect-16/10 relative overflow-hidden bg-stone-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={plant.imageUrl}
                      alt={plant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#DCE8D9]" />
                      <span>{plant.location}</span>
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <span className={`w-3 h-3 rounded-full inline-block shadow-sm ${
                        plant.healthStatus === 'healthy'
                          ? 'bg-[#15803D]'
                          : plant.healthStatus === 'mild_stress'
                          ? 'bg-[#D97706]'
                          : 'bg-[#DC2626]'
                      }`} title={`Health: ${plant.healthStatus}`} />
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <div>
                      <h4 className="font-serif text-base font-bold text-[#183D32] leading-tight group-hover:text-[#3A725D] transition-colors truncate">
                        {plant.nickname || plant.name}
                      </h4>
                      <div className="text-[11px] text-[#73847B] italic truncate">
                        {plant.scientificName}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#475850] pt-1">
                      <div className="flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-[#0284C7]" />
                        <span>Every {plant.wateringFrequencyDays}d</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Sun className="w-3.5 h-3.5 text-[#D97706]" />
                        <span className="truncate max-w-[120px]">{plant.sunlightRequirement}</span>
                      </div>
                    </div>

                    {plant.notes && (
                      <p className="text-[11px] text-[#73847B] line-clamp-2 pt-1 border-t border-[#183D32]/5">
                        {plant.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-4 py-3 bg-[#F7F8F3] border-t border-[#183D32]/10 flex items-center justify-between">
                  <span className="text-[11px] text-[#73847B]">
                    Watered: {plant.lastWateredDate}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleWaterClick(e, plant.id)}
                    className="py-1.5 px-3 rounded-lg bg-[#DCE8D9] text-[#183D32] font-bold text-[11px] hover:bg-[#183D32] hover:text-[#F7F8F3] transition-all flex items-center gap-1 active:scale-95"
                  >
                    <Droplets className="w-3 h-3 text-[#0284C7]" />
                    <span>Watered</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED PLANT PROFILE MODAL / DRAWER */}
      {selectedPlant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#183D32]/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#FFFFFF] rounded-3xl shadow-2xl border border-[#183D32]/15 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="relative aspect-16/9 sm:aspect-21/9 bg-stone-900 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedPlant.imageUrl}
                alt={selectedPlant.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              <button
                type="button"
                onClick={() => setSelectedPlant(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="text-xs uppercase font-bold text-[#DCE8D9] tracking-wider">
                  {selectedPlant.location} &middot; Added {selectedPlant.dateAdded}
                </span>
                <h3 className="font-serif text-2xl font-bold">
                  {selectedPlant.nickname || selectedPlant.name}
                </h3>
                <div className="text-xs text-stone-300 italic">
                  {selectedPlant.scientificName}
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Quick Care Status Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10 text-center">
                  <div className="text-[10px] uppercase font-bold text-[#73847B]">Watering</div>
                  <div className="text-xs font-bold text-[#183D32] mt-0.5">
                    Every {selectedPlant.wateringFrequencyDays} Days
                  </div>
                  <div className="text-[10px] text-[#0284C7]">Last: {selectedPlant.lastWateredDate}</div>
                </div>

                <div className="p-3 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10 text-center">
                  <div className="text-[10px] uppercase font-bold text-[#73847B]">Light Need</div>
                  <div className="text-xs font-bold text-[#183D32] mt-0.5 truncate">
                    {selectedPlant.sunlightRequirement}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10 text-center">
                  <div className="text-[10px] uppercase font-bold text-[#73847B]">Condition</div>
                  <div className="text-xs font-bold text-[#15803D] mt-0.5 capitalize">
                    {selectedPlant.healthStatus.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Plant Timeline */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-serif text-base font-bold text-[#183D32] flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#3A725D]" />
                    <span>Plant Timeline & Health Log</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingObservation(true)}
                    className="text-xs font-bold text-[#183D32] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Observation</span>
                  </button>
                </div>

                {/* Add observation form if open */}
                {isAddingObservation && (
                  <form onSubmit={handleAddObservation} className="p-4 rounded-2xl bg-[#EDF4EB] border border-[#C8DBC4] space-y-3 mb-4">
                    <div className="font-bold text-xs text-[#183D32]">Record New Observation</div>
                    <textarea
                      value={observationNote}
                      onChange={(e) => setObservationNote(e.target.value)}
                      placeholder="e.g. Unfurled a new leaf today, looks vibrant! Or noticed slight droop..."
                      className="w-full p-2.5 rounded-xl border border-[#183D32]/20 bg-white text-xs text-[#1A2420] focus:outline-none focus:ring-1 focus:ring-[#183D32]"
                      rows={2}
                      required
                    />
                    <div className="flex items-center justify-between">
                      <select
                        value={observationType}
                        onChange={(e) => setObservationType(e.target.value as 'observation' | 'photo' | 'water')}
                        className="p-1.5 rounded-lg border border-[#183D32]/20 text-xs bg-white"
                      >
                        <option value="observation">Growth Observation</option>
                        <option value="water">Watering & Feeding</option>
                        <option value="photo">Photo Update</option>
                      </select>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingObservation(false)}
                          className="px-3 py-1 text-xs text-[#475850]"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-xl bg-[#183D32] text-white text-xs font-bold hover:bg-[#122E26]"
                        >
                          Save Log
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Timeline items */}
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-[#183D32]/10 pl-6">
                  {selectedPlant.timeline.map((event) => (
                    <div key={event.id} className="relative space-y-1">
                      {/* Timeline dot */}
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#183D32] ring-4 ring-[#EDF4EB]" />
                      <div className="flex items-center justify-between text-xs font-bold text-[#183D32]">
                        <span>{event.title}</span>
                        <span className="font-normal text-[10px] text-[#73847B]">{event.date}</span>
                      </div>
                      <p className="text-xs text-[#475850]">{event.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-[#183D32]/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const confirmDel = confirm(`Remove ${selectedPlant.nickname || selectedPlant.name} from your collection?`);
                    if (confirmDel) {
                      deleteSavedPlant(selectedPlant.id);
                      setSelectedPlant(null);
                    }
                  }}
                  className="text-xs font-semibold text-[#DC2626] hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Plant</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlant(null);
                      setActiveTab('doctor');
                    }}
                    className="py-2 px-3.5 rounded-xl text-xs font-bold bg-[#F1EBDD] text-[#183D32] hover:bg-[#E8DFC9] flex items-center gap-1.5"
                  >
                    <Stethoscope className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>Run Checkup</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
