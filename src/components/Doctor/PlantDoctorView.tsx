'use client';

import React, { useState } from 'react';
import { usePlant } from '@/context/PlantContext';
import { plantAiService } from '@/services/aiProvider';
import { PlantDiagnosis } from '@/types/plant';
import { COMMON_SYMPTOMS_CATALOG } from '@/data/botanicalData';
import {
  Stethoscope,
  Upload,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  HelpCircle,
  Droplets,
  Sun,
  ShieldAlert,
  ArrowRight,
  RotateCcw,
  PlusCircle,
  FileText,
  Calendar,
  MessageSquareQuote,
  Activity,
  Layers,
  Thermometer,
} from 'lucide-react';

const SAMPLE_DISEASED_SPECIMENS = [
  {
    title: 'Yellowing Foliage (Pothos / Aroid)',
    issue: 'Lower leaf chlorosis',
    url: 'https://images.unsplash.com/photo-1596724803690-333b664426bb?auto=format&fit=crop&w=800&q=80',
    symptoms: ['Yellowing Leaves', 'Pale Washed-out Foliage'],
  },
  {
    title: 'Brown Dry Leaf Tips (Monstera)',
    issue: 'Tip necrosis & humidity stress',
    url: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80',
    symptoms: ['Brown / Crispy Leaf Tips', 'Curling or Cupping Leaves'],
  },
  {
    title: 'Tomato Leaf Spot & Blight',
    issue: 'Fungal leaf spotting',
    url: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=800&q=80',
    symptoms: ['Dark / Water-soaked Spots', 'Yellowing Leaves'],
  },
  {
    title: 'Rose Foliage with Mildew',
    issue: 'White powdery fungal coating',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    symptoms: ['White Powdery Substance', 'Curling or Cupping Leaves'],
  },
];

export const PlantDoctorView: React.FC = () => {
  const {
    currentDiagnosis,
    setCurrentDiagnosis,
    currentSpecies,
    userApiKey,
    savedPlants,
    addTimelineObservation,
    setIsChatOpen,
    addChatMessage,
  } = usePlant();

  const [image, setImage] = useState<string | null>(
    currentDiagnosis?.imageUrl || currentSpecies?.imageUrl || null
  );
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showTriageForm, setShowTriageForm] = useState(false);

  // Multi-angle photo attachments
  const [leafPhoto, setLeafPhoto] = useState<string | null>(null);
  const [stemPhoto, setStemPhoto] = useState<string | null>(null);
  const [soilPhoto, setSoilPhoto] = useState<string | null>(null);

  // Triage questionnaire answers
  const [triageAnswers, setTriageAnswers] = useState<Record<string, string>>({
    water_frequency: 'Every 2-3 days',
    placement: 'Indoor with indirect light',
    sunlight: 'Moderate filtered sun',
    symptom_onset: 'Started 1-2 weeks ago',
    soil_state: 'Frequently damp',
  });

  const [savedToPlantId, setSavedToPlantId] = useState<string>('');
  const [savedSuccessNote, setSavedSuccessNote] = useState<boolean>(false);

  const toggleSymptom = (label: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(label) ? prev.filter((s) => s !== label) : [...prev, label]
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: typeof SAMPLE_DISEASED_SPECIMENS[0]) => {
    setImage(sample.url);
    setSelectedSymptoms(sample.symptoms);
  };

  const runDiagnosis = async () => {
    if (!image) return;

    setIsAnalyzing(true);
    try {
      const result = await plantAiService.diagnosePlantHealth(image, {
        symptoms: selectedSymptoms,
        answers: triageAnswers,
        additionalImages: {
          leaf: leafPhoto || undefined,
          stem: stemPhoto || undefined,
          soil: soilPhoto || undefined,
        },
        userApiKey,
      });

      setCurrentDiagnosis(result.diagnosis);
    } catch (err) {
      console.error('Diagnosis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setCurrentDiagnosis(null);
    setImage(null);
    setSelectedSymptoms([]);
    setShowTriageForm(false);
  };

  const handleSaveToPlantHistory = () => {
    if (!savedToPlantId || !currentDiagnosis) return;

    addTimelineObservation(
      savedToPlantId,
      `Plant Doctor Health Check: ${currentDiagnosis.observedSymptoms.join(', ')}. Primary suspect: ${currentDiagnosis.possibleCauses[0]?.cause || 'Stress'}`,
      'diagnosis',
      currentDiagnosis.imageUrl,
      currentDiagnosis.healthScore
    );

    setSavedSuccessNote(true);
    setTimeout(() => setSavedSuccessNote(false), 3000);
  };

  const handleAskDoctorInChat = () => {
    if (!currentDiagnosis) return;

    setIsChatOpen(true);
    addChatMessage({
      role: 'assistant',
      content: `I've reviewed your Plant Doctor diagnostic report for **${currentDiagnosis.plantIdentification?.commonName || 'this plant'}**.\n\n- **Health Score**: ${currentDiagnosis.healthScore}/100 (${currentDiagnosis.overallHealth.replace('_', ' ')})\n- **Top Cause**: ${currentDiagnosis.possibleCauses[0]?.cause} (${currentDiagnosis.possibleCauses[0]?.likelihood}% likelihood)\n\nWhat specific questions do you have about the treatment protocol or watering adjustments?`,
      plantContext: {
        name: currentDiagnosis.plantIdentification?.commonName || 'Unhealthy Plant',
        scientificName: currentDiagnosis.plantIdentification?.scientificName || '',
        imageUrl: currentDiagnosis.imageUrl,
      },
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      {/* HEADER BANNER */}
      <div className="p-6 rounded-3xl bg-[#183D32] text-[#F7F8F3] relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#245647]/50 to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCE8D9]/20 text-[#DCE8D9] text-xs font-bold mb-3 border border-[#DCE8D9]/30">
            <Stethoscope className="w-3.5 h-3.5 text-[#34D399]" />
            <span>Plant Pathologist & Triage Engine</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Plant Doctor & Health Diagnostics
          </h2>
          <p className="text-xs sm:text-sm text-[#DCE8D9]/80 leading-relaxed">
            Upload clear photos of distressed foliage, stems, or roots. We identify symptoms, evaluate multiple differential causes by likelihood, and generate an actionable treatment plan.
          </p>
        </div>
      </div>

      {/* IF NO ACTIVE DIAGNOSIS, SHOW INPUT WORKFLOW */}
      {!currentDiagnosis ? (
        <div className="space-y-6">
          {/* STEP 1: UPLOAD PHOTO OF UNHEALTHY PLANT */}
          <div className="nature-card p-6">
            <h3 className="font-serif text-lg font-bold text-[#183D32] mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#183D32] text-white text-xs flex items-center justify-center font-bold">1</span>
              <span>Upload Photo of Affected Plant</span>
            </h3>
            <p className="text-xs text-[#73847B] mb-4">
              Focus closely on the yellowing leaves, spots, wilting stems, or pests.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Photo drop area */}
              <div className="md:col-span-7">
                {image ? (
                  <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-stone-900 border border-[#183D32]/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image} alt="Distressed plant" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-xs transition-colors"
                    >
                      Change Photo
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-4/3 rounded-2xl border-2 border-dashed border-[#183D32]/30 hover:border-[#183D32] bg-[#F7F8F3] hover:bg-[#EDF4EB]/50 transition-all cursor-pointer p-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#DCE8D9] flex items-center justify-center text-[#183D32] mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-[#183D32]">Tap to Upload Affected Plant Photo</span>
                    <span className="text-xs text-[#73847B] mt-1">JPEG, PNG, WebP up to 15MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Sample diseased specimens */}
              <div className="md:col-span-5 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#183D32]">
                  Or Test with Sample Issues
                </span>
                <div className="space-y-2">
                  {SAMPLE_DISEASED_SPECIMENS.map((sample, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectSample(sample)}
                      className="w-full p-2.5 rounded-xl border border-[#183D32]/10 hover:border-[#183D32] bg-[#F7F8F3] hover:bg-[#EDF4EB] transition-all flex items-center gap-3 text-left"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sample.url}
                        alt={sample.title}
                        className="w-12 h-12 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#183D32] truncate">{sample.title}</div>
                        <div className="text-[11px] text-[#73847B] truncate">{sample.issue}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Optional Multi-Angle Photos */}
            <div className="mt-6 pt-5 border-t border-[#183D32]/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#183D32] flex items-center gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5 text-[#3A725D]" />
                  Add Multi-Angle Photos (Optional for Higher Diagnostic Accuracy)
                </span>
                <span className="text-[11px] text-[#73847B]">Leaf, stem, or potting soil</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <label className="p-3 rounded-xl border border-dashed border-[#183D32]/20 hover:border-[#183D32] bg-[#F7F8F3] text-center cursor-pointer block">
                  <span className="text-[11px] font-semibold text-[#183D32] block">
                    {leafPhoto ? 'Leaf Added' : '+ Leaf Close-up'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const r = new FileReader();
                        r.onload = () => setLeafPhoto(r.result as string);
                        r.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>

                <label className="p-3 rounded-xl border border-dashed border-[#183D32]/20 hover:border-[#183D32] bg-[#F7F8F3] text-center cursor-pointer block">
                  <span className="text-[11px] font-semibold text-[#183D32] block">
                    {stemPhoto ? 'Stem Added' : '+ Stem / Node'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const r = new FileReader();
                        r.onload = () => setStemPhoto(r.result as string);
                        r.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>

                <label className="p-3 rounded-xl border border-dashed border-[#183D32]/20 hover:border-[#183D32] bg-[#F7F8F3] text-center cursor-pointer block">
                  <span className="text-[11px] font-semibold text-[#183D32] block">
                    {soilPhoto ? 'Soil Added' : '+ Pot / Soil'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const r = new FileReader();
                        r.onload = () => setSoilPhoto(r.result as string);
                        r.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* STEP 2: SELECT VISIBLE SYMPTOMS */}
          <div className="nature-card p-6">
            <h3 className="font-serif text-lg font-bold text-[#183D32] mb-1 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#183D32] text-white text-xs flex items-center justify-center font-bold">2</span>
              <span>Check Any Observed Symptoms (Optional)</span>
            </h3>
            <p className="text-xs text-[#73847B] mb-4">
              Select what you see, or let our AI vision analyze automatically.
            </p>

            <div className="flex flex-wrap gap-2">
              {COMMON_SYMPTOMS_CATALOG.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym.label);
                return (
                  <button
                    key={sym.id}
                    type="button"
                    onClick={() => toggleSymptom(sym.label)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-[#183D32] text-[#F7F8F3] border-[#183D32] shadow-xs'
                        : 'bg-[#F7F8F3] text-[#475850] border-[#183D32]/10 hover:border-[#183D32]/30'
                    }`}
                  >
                    {isSelected && <span className="mr-1.5">&#10003;</span>}
                    {sym.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: QUICK TRIAGE CARE QUESTIONNAIRE (EXPANDABLE) */}
          <div className="nature-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#183D32] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#183D32] text-white text-xs flex items-center justify-center font-bold">3</span>
                  <span>Care Habits & Growing Context</span>
                </h3>
                <p className="text-xs text-[#73847B]">
                  Helps differentiate between watering vs fungal issues.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTriageForm(!showTriageForm)}
                className="text-xs font-semibold text-[#183D32] hover:underline"
              >
                {showTriageForm ? 'Hide Questions' : 'Customize Answers'}
              </button>
            </div>

            {showTriageForm && (
              <div className="mt-5 pt-4 border-t border-[#183D32]/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-[#183D32] block mb-1">
                    How often do you water this plant?
                  </label>
                  <select
                    value={triageAnswers.water_frequency}
                    onChange={(e) => setTriageAnswers({ ...triageAnswers, water_frequency: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#183D32]/20 bg-[#F7F8F3]"
                  >
                    <option>Every day</option>
                    <option>Every 2-3 days</option>
                    <option>Once a week</option>
                    <option>Every 2-3 weeks</option>
                    <option>Only when completely dry</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#183D32] block mb-1">
                    Indoor or Outdoor location?
                  </label>
                  <select
                    value={triageAnswers.placement}
                    onChange={(e) => setTriageAnswers({ ...triageAnswers, placement: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#183D32]/20 bg-[#F7F8F3]"
                  >
                    <option>Indoor with indirect light</option>
                    <option>Indoor dim room</option>
                    <option>Balcony with morning sun</option>
                    <option>Outdoor direct full sun</option>
                    <option>Shaded porch / terrace</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#183D32] block mb-1">
                    When did symptoms first begin?
                  </label>
                  <select
                    value={triageAnswers.symptom_onset}
                    onChange={(e) => setTriageAnswers({ ...triageAnswers, symptom_onset: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#183D32]/20 bg-[#F7F8F3]"
                  >
                    <option>Just in the last 24-48 hours</option>
                    <option>Started 1-2 weeks ago</option>
                    <option>Gradual over several months</option>
                    <option>Right after repotting / moving</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#183D32] block mb-1">
                    Current soil state right now?
                  </label>
                  <select
                    value={triageAnswers.soil_state}
                    onChange={(e) => setTriageAnswers({ ...triageAnswers, soil_state: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-[#183D32]/20 bg-[#F7F8F3]"
                  >
                    <option>Bone dry and shrinking from pot edges</option>
                    <option>Moist on top</option>
                    <option>Frequently damp</option>
                    <option>Soggy / muddy with standing water</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* RUN DIAGNOSIS BUTTON */}
          <div className="flex justify-center">
            <button
              type="button"
              disabled={!image || isAnalyzing}
              onClick={runDiagnosis}
              className={`py-4 px-10 rounded-2xl font-bold text-sm shadow-xl flex items-center gap-2.5 transition-all active:scale-95 ${
                !image || isAnalyzing
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-[#183D32] text-[#F7F8F3] hover:bg-[#122E26]'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing Pathology Report...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-[#34D399]" />
                  <span>Diagnose Plant Health</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* ACTIVE DIAGNOSIS RESULTS VIEW */
        <div className="space-y-6">
          {/* RESULT HEADER CARD */}
          <div className="nature-card p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#183D32]/10">
              <div className="flex items-center gap-4">
                {/* Health score badge */}
                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-bold text-white shadow-md ${
                  currentDiagnosis.healthScore >= 80
                    ? 'bg-[#15803D]'
                    : currentDiagnosis.healthScore >= 60
                    ? 'bg-[#D97706]'
                    : 'bg-[#DC2626]'
                }`}>
                  <span className="text-xl leading-none">{currentDiagnosis.healthScore}</span>
                  <span className="text-[10px] uppercase tracking-wider opacity-90">/ 100</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      currentDiagnosis.overallHealth === 'healthy'
                        ? 'bg-[#DCFCE7] text-[#15803D]'
                        : currentDiagnosis.overallHealth === 'mild_stress'
                        ? 'bg-[#FEF3C7] text-[#B45309]'
                        : 'bg-[#FEE2E2] text-[#991B1B]'
                    }`}>
                      {currentDiagnosis.overallHealth.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-[#73847B]">
                      Diagnosed {currentDiagnosis.scanDate}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#183D32] mt-1">
                    {currentDiagnosis.possibleCauses[0]?.cause || 'Health Observation'}
                  </h3>
                  <div className="text-xs text-[#475850]">
                    {currentDiagnosis.plantIdentification?.commonName}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAskDoctorInChat}
                  className="py-2 px-3.5 rounded-xl text-xs font-bold bg-[#F1EBDD] text-[#183D32] border border-[#E5DCB8] hover:bg-[#E8DFC9] transition-all flex items-center gap-1.5"
                >
                  <MessageSquareQuote className="w-4 h-4 text-[#183D32]" />
                  <span>Ask AI Doctor</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-2 px-3 rounded-xl text-xs font-medium text-[#475850] hover:text-[#183D32] hover:bg-[#EDF4EB] transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>New Diagnosis</span>
                </button>
              </div>
            </div>

            {/* Observed Symptoms List */}
            <div className="mt-5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#183D32] block mb-2">
                Identified Symptoms & Visual Evidence
              </span>
              <div className="flex flex-wrap gap-2">
                {currentDiagnosis.observedSymptoms.map((sym, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10 text-xs font-semibold text-[#183D32]"
                  >
                    {sym}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* RANKED DIFFERENTIAL CAUSES */}
          <div className="nature-card p-6">
            <h4 className="font-serif text-lg font-bold text-[#183D32] mb-1 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#3A725D]" />
              <span>Ranked Possible Causes (Differential Pathology)</span>
            </h4>
            <p className="text-xs text-[#73847B] mb-5">
              Multiple issues often produce overlapping symptoms. Below are the most probable causes ranked by visual likelihood.
            </p>

            <div className="space-y-4">
              {currentDiagnosis.possibleCauses.map((cause, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#F7F8F3] border border-[#183D32]/10 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm text-[#183D32] flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#183D32] text-white text-[11px] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <span>{cause.cause}</span>
                    </div>
                    <span className="text-xs font-bold text-[#183D32] bg-[#EDF4EB] px-2.5 py-1 rounded-full border border-[#C8DBC4]">
                      {cause.likelihood}% Likelihood
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        cause.likelihood > 70 ? 'bg-[#15803D]' : 'bg-[#D97706]'
                      }`}
                      style={{ width: `${cause.likelihood}%` }}
                    />
                  </div>

                  <p className="text-xs text-[#475850] leading-relaxed">
                    {cause.description}
                  </p>

                  <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#183D32]/10 text-[11px] text-[#183D32]">
                    <strong className="text-[#3A725D]">Visual Evidence: </strong>
                    <span>{cause.visualEvidence}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STEP-BY-STEP ACTIONABLE TREATMENT PLAN */}
          <div className="nature-card p-6 sm:p-8 space-y-6">
            <h4 className="font-serif text-xl font-bold text-[#183D32] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#15803D]" />
              <span>Step-by-Step Treatment & Recovery Plan</span>
            </h4>

            {/* Immediate Actions */}
            <div className="p-4 rounded-2xl bg-[#EDF4EB] border border-[#C8DBC4] space-y-2">
              <div className="font-bold text-xs uppercase tracking-wider text-[#183D32]">
                Immediate Triage (Do Today)
              </div>
              <ul className="space-y-1.5 text-xs text-[#183D32]">
                {currentDiagnosis.treatmentPlan.immediateActions.map((act, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#15803D] font-bold mt-0.5">&#10003;</span>
                    <span className="leading-relaxed">{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Environmental & Soil Adjustments Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10 space-y-1">
                <div className="font-bold text-[#183D32] flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-[#0284C7]" />
                  <span>Watering Adjustments</span>
                </div>
                <p className="text-[#475850] leading-relaxed">
                  {currentDiagnosis.treatmentPlan.wateringAdjustments}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10 space-y-1">
                <div className="font-bold text-[#183D32] flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-[#D97706]" />
                  <span>Light & Temperature</span>
                </div>
                <p className="text-[#475850] leading-relaxed">
                  {currentDiagnosis.treatmentPlan.lightTempAdjustments}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10 space-y-1">
                <div className="font-bold text-[#183D32]">Soil & Drainage Fix</div>
                <p className="text-[#475850] leading-relaxed">
                  {currentDiagnosis.treatmentPlan.soilDrainageRecommendations}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10 space-y-1">
                <div className="font-bold text-[#183D32]">Pest & Mold Treatment</div>
                <p className="text-[#475850] leading-relaxed">
                  {currentDiagnosis.treatmentPlan.pestManagement}
                </p>
              </div>
            </div>

            {/* Fertilizer precautions */}
            <div className="p-3.5 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-xs space-y-1">
              <div className="font-bold text-[#92400E] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                Fertilizer Warning
              </div>
              <p className="text-[#78350F] leading-relaxed">
                {currentDiagnosis.treatmentPlan.fertilizerAdvice}
              </p>
            </div>

            {/* Follow-up Monitoring & Prevention */}
            <div className="p-4 rounded-xl bg-[#F1EBDD] border border-[#E5DCB8] text-xs space-y-2">
              <div className="font-bold text-[#183D32] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#183D32]" />
                Follow-Up Schedule & Prevention
              </div>
              <p className="text-[#475850]">
                {currentDiagnosis.treatmentPlan.followUpSchedule}
              </p>
            </div>
          </div>

          {/* SAVE DIAGNOSIS TO PLANT COLLECTION TIMELINE */}
          {savedPlants.length > 0 && (
            <div className="nature-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-serif text-base font-bold text-[#183D32]">
                  Log This Checkup into Your Plant Collection
                </h4>
                <p className="text-xs text-[#73847B]">
                  Records this diagnostic report to track recovery progress over time.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={savedToPlantId}
                  onChange={(e) => setSavedToPlantId(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs border border-[#183D32]/20 bg-[#F7F8F3]"
                >
                  <option value="">Select plant from collection...</option>
                  {savedPlants.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nickname || p.name} ({p.location})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={!savedToPlantId}
                  onClick={handleSaveToPlantHistory}
                  className="py-2 px-4 rounded-xl text-xs font-bold bg-[#183D32] text-[#F7F8F3] disabled:opacity-50 hover:bg-[#122E26] shrink-0"
                >
                  {savedSuccessNote ? 'Logged!' : 'Save to Timeline'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
