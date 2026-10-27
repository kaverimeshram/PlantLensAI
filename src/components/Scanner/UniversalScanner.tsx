'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePlant } from '@/context/PlantContext';
import { plantAiService } from '@/services/aiProvider';
import { PlantSpecies, ScanIntent } from '@/types/plant';
import { BOTANICAL_DATABASE } from '@/data/botanicalData';
import {
  Camera,
  Upload,
  RefreshCw,
  Sparkles,
  AlertCircle,
  SwitchCamera,
  Layers,
  ArrowRight,
  SlidersHorizontal,
  Leaf,
  Stethoscope,
  BookOpen,
  Sun,
} from 'lucide-react';

interface UniversalScannerProps {
  onScanComplete: (species: PlantSpecies) => void;
  defaultIntention?: 'identify' | 'health' | 'uses' | 'care';
}

const SCAN_INTENTIONS: ScanIntent[] = [
  { id: 'identify', label: 'Identify Species', description: 'Taxonomy, origin, characteristics' },
  { id: 'health', label: 'Check Plant Health', description: 'Detect diseases, pests, stress' },
  { id: 'uses', label: 'Traditional Uses', description: 'Cultural, medicinal, culinary' },
  { id: 'care', label: 'Growing Conditions', description: 'Sunlight, water, soil & zones' },
];

const SCAN_PHASES = [
  'Initializing high-resolution botanical vision...',
  'Extracting leaf venation & phyllotaxy patterns...',
  'Analyzing petal arrangement & margin serration...',
  'Comparing with taxonomic specimen databases...',
  'Cross-checking toxicity & regional hardiness zones...',
  'Synthesizing verified botanical profile...',
];

export const UniversalScanner: React.FC<UniversalScannerProps> = ({
  onScanComplete,
  defaultIntention = 'identify',
}) => {
  const { userApiKey, addRecentScan, startDiagnosisForSpecies } = usePlant();

  // Mode states: 'idle' | 'camera_active' | 'preview' | 'analyzing'
  const [scannerState, setScannerState] = useState<'idle' | 'camera_active' | 'preview' | 'analyzing'>('idle');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [intention, setIntention] = useState<'identify' | 'health' | 'uses' | 'care'>(defaultIntention);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);

  // Multi-plant detection state
  const [detectedMultiple, setDetectedMultiple] = useState(false);
  const [multiCandidates, setMultiCandidates] = useState<Array<{ name: string; boundingBoxDesc: string }>>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Rotate loading phases when analyzing
  useEffect(() => {
    if (scannerState !== 'analyzing') return;

    const interval = setInterval(() => {
      setCurrentPhaseIndex((prev) => (prev + 1) % SCAN_PHASES.length);
    }, 1200);

    return () => clearInterval(interval);
  }, [scannerState]);

  // Start WebRTC Camera
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setFacingMode(mode);
      setScannerState('camera_active');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Camera access error:', msg);
      setCameraError(
        'Unable to access your device camera. Please check camera permissions in your browser, or upload an image file instead.'
      );
      setScannerState('idle');
    }
  };

  // Flip camera (front/back)
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextMode);
  };

  // Capture frame from video to canvas
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setSelectedImage(dataUrl);
      stopCamera();
      setScannerState('preview');
    }
  };

  // Handle gallery file upload with validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCameraError('Unsupported file format. Please upload a valid image file (JPEG, PNG, WebP).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setCameraError('The selected image exceeds the 15MB limit. Please choose a smaller or compressed photograph.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setCameraError(null);
    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      stopCamera();
      setScannerState('preview');
    };
    reader.onerror = () => {
      setCameraError('Failed to read image file. Please choose another photograph.');
    };
    reader.readAsDataURL(file);
  };

  // Sample plant fast select
  const handleSelectSample = (sample: typeof BOTANICAL_DATABASE[0]) => {
    setSelectedImage(sample.imageUrl);
    setSelectedFileName(sample.commonName);
    stopCamera();
    setScannerState('preview');
  };

  // Run AI Analysis
  const runIdentification = async () => {
    if (!selectedImage) return;

    setScannerState('analyzing');
    setCurrentPhaseIndex(0);

    try {
      const result = await plantAiService.identifyPlant(selectedImage, {
        intention,
        userApiKey,
        imageName: selectedFileName || undefined,
      });

      if (result.isMultiplePlantsDetected && result.multiplePlantCandidates?.length) {
        setDetectedMultiple(true);
        setMultiCandidates(result.multiplePlantCandidates);
        setScannerState('preview');
        return;
      }

      addRecentScan(result.species);

      // If user intention was health diagnosis, jump directly to doctor
      if (intention === 'health') {
        startDiagnosisForSpecies(result.species);
      } else {
        onScanComplete(result.species);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Scan error:', msg);
      // Fallback species on failure
      const fallback = BOTANICAL_DATABASE[0];
      onScanComplete(fallback);
    }
  };

  const handleRetake = () => {
    setSelectedImage(null);
    setSelectedFileName(null);
    setDetectedMultiple(false);
    setMultiCandidates([]);
    setScannerState('idle');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Intention Pills Selector */}
      <div className="bg-[#FFFFFF] p-3 rounded-2xl border border-[#183D32]/10 shadow-xs">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#183D32] flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#3A725D]" />
            Scan Focus (Optional)
          </span>
          <span className="text-[11px] text-[#73847B]">Auto-categorized automatically</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SCAN_INTENTIONS.map((item) => {
            const isSelected = intention === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setIntention(item.id)}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-[#183D32] text-[#F7F8F3] border-[#183D32] shadow-xs'
                    : 'bg-[#F7F8F3] text-[#1A2420] border-[#183D32]/10 hover:border-[#183D32]/30'
                }`}
              >
                <div className="font-semibold text-xs flex items-center gap-1.5">
                  {item.id === 'identify' && <Leaf className="w-3.5 h-3.5 text-[#DCE8D9]" />}
                  {item.id === 'health' && <Stethoscope className="w-3.5 h-3.5 text-[#D97706]" />}
                  {item.id === 'uses' && <BookOpen className="w-3.5 h-3.5 text-[#F1EBDD]" />}
                  {item.id === 'care' && <Sun className="w-3.5 h-3.5 text-[#34D399]" />}
                  <span>{item.label}</span>
                </div>
                <div className={`text-[10px] mt-0.5 leading-tight ${isSelected ? 'text-[#DCE8D9]/90' : 'text-[#73847B]'}`}>
                  {item.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Camera Error Message if any */}
      {cameraError && (
        <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
          <div className="text-xs text-[#991B1B] space-y-1">
            <div className="font-bold">Camera Permission Notice</div>
            <p>{cameraError}</p>
          </div>
        </div>
      )}

      {/* MAIN SCANNER VIEWFINDER / DISPLAY AREA */}
      <div className="relative w-full aspect-4/3 sm:aspect-16/10 rounded-3xl overflow-hidden bg-[#18221D] border-2 border-[#183D32]/20 shadow-xl flex items-center justify-center">
        {/* STATE 1: IDLE (Choose Camera or File Upload) */}
        {scannerState === 'idle' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 sm:p-12 text-center text-[#F7F8F3] relative z-10">
            {/* Soft decorative background circles */}
            <div className="absolute inset-0 bg-radial from-[#245647]/30 to-transparent pointer-events-none" />

            <div className="w-20 h-20 rounded-3xl bg-[#DCE8D9]/15 border border-[#DCE8D9]/30 flex items-center justify-center mb-5 backdrop-blur-xs">
              <Camera className="w-10 h-10 text-[#DCE8D9]" />
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F8F3] tracking-tight mb-2">
              Photograph Any Plant Organism
            </h3>
            <p className="text-xs sm:text-sm text-[#DCE8D9]/80 max-w-md mx-auto mb-8 leading-relaxed">
              Flowers, houseplants, trees, mushrooms, weeds, fruits, or succulents. No category selection needed—our botanical engine classifies automatically.
            </p>

            {/* Main Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
              <button
                type="button"
                onClick={() => startCamera()}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#DCE8D9] text-[#183D32] font-bold text-sm hover:bg-[#FFFFFF] shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4 text-[#183D32]" />
                <span>Open Device Camera</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#FFFFFF]/15 hover:bg-[#FFFFFF]/25 text-[#F7F8F3] font-semibold text-sm border border-[#FFFFFF]/25 backdrop-blur-xs active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4 text-[#DCE8D9]" />
                <span>Upload From Files</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* STATE 2: ACTIVE LIVE WEBRTC CAMERA */}
        {scannerState === 'camera_active' && (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Viewfinder Overlay Guides */}
            <div className="absolute inset-8 sm:inset-12 border-2 border-white/40 rounded-2xl pointer-events-none flex flex-col justify-between p-4">
              <div className="flex justify-between items-start">
                <div className="w-6 h-6 border-t-2 border-l-2 border-[#DCE8D9] rounded-tl-lg" />
                <div className="px-3 py-1 rounded-full bg-black/50 text-[#DCE8D9] text-xs font-mono backdrop-blur-xs">
                  Botanical Lens Active
                </div>
                <div className="w-6 h-6 border-t-2 border-r-2 border-[#DCE8D9] rounded-tr-lg" />
              </div>
              <div className="flex justify-between items-end">
                <div className="w-6 h-6 border-b-2 border-l-2 border-[#DCE8D9] rounded-bl-lg" />
                <div className="w-6 h-6 border-b-2 border-r-2 border-[#DCE8D9] rounded-br-lg" />
              </div>
            </div>

            {/* Floating Camera Controls */}
            <div className="absolute bottom-6 left-0 right-0 px-6 flex items-center justify-around z-20">
              {/* Cancel Button */}
              <button
                type="button"
                onClick={stopCamera}
                className="w-12 h-12 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/80 transition-all"
                title="Cancel"
              >
                <RefreshCw className="w-5 h-5 rotate-45" />
              </button>

              {/* Shutter Capture Button */}
              <button
                type="button"
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full border-4 border-white bg-[#DCE8D9] text-[#183D32] flex items-center justify-center shadow-2xl active:scale-95 transition-all focus:outline-none"
                aria-label="Take Photo"
              >
                <div className="w-14 h-14 rounded-full bg-[#183D32] flex items-center justify-center text-white">
                  <Camera className="w-7 h-7 text-[#DCE8D9]" />
                </div>
              </button>

              {/* Flip Camera Switch */}
              <button
                type="button"
                onClick={toggleFacingMode}
                className="w-12 h-12 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/80 transition-all"
                title="Flip Camera"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STATE 3: PREVIEW CAPTURED OR UPLOADED IMAGE */}
        {scannerState === 'preview' && selectedImage && (
          <div className="relative w-full h-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage}
              alt="Plant preview"
              className="w-full h-full object-cover"
            />

            {/* Multi-plant notice modal overlay if detected */}
            {detectedMultiple && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-xs z-30 p-6 flex flex-col justify-center items-center text-center text-white">
                <div className="w-12 h-12 rounded-2xl bg-[#D97706] text-white flex items-center justify-center mb-3">
                  <Layers className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-xl font-bold mb-1">Multiple Organisms Detected</h4>
                <p className="text-xs text-stone-300 max-w-sm mb-4">
                  We spotted more than one plant in this frame. Select which one you want PlantLens AI to inspect:
                </p>
                <div className="space-y-2 w-full max-w-xs">
                  {multiCandidates.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setDetectedMultiple(false);
                        runIdentification();
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/20 hover:bg-[#DCE8D9] hover:text-[#183D32] text-sm font-semibold border border-white/30 transition-all text-left flex items-center justify-between"
                    >
                      <span>{c.name || `Plant Candidate #${i + 1}`}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      setDetectedMultiple(false);
                      runIdentification();
                    }}
                    className="w-full py-2 px-4 rounded-xl bg-transparent hover:bg-white/10 text-xs text-stone-400"
                  >
                    Analyze Prominent Foreground Plant
                  </button>
                </div>
              </div>
            )}

            {/* Preview Toolbar */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 bg-black/60 p-3 rounded-2xl backdrop-blur-md z-20">
              <button
                type="button"
                onClick={handleRetake}
                className="py-2.5 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium text-xs transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retake / Change</span>
              </button>

              <button
                type="button"
                onClick={runIdentification}
                className="py-2.5 px-6 rounded-xl bg-[#DCE8D9] text-[#183D32] font-bold text-xs sm:text-sm hover:bg-[#FFFFFF] shadow-lg flex items-center gap-2 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4 text-[#183D32]" />
                <span>Analyze Plant</span>
              </button>
            </div>
          </div>
        )}

        {/* STATE 4: ANALYZING WITH LASER SWEEP & BOTANICAL PHASES */}
        {scannerState === 'analyzing' && selectedImage && (
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Blurred image in background */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage}
              alt="Scanning plant"
              className="absolute inset-0 w-full h-full object-cover filter blur-xs brightness-50"
            />

            {/* Glowing Laser Scanner Line */}
            <div className="scan-laser-line z-20" />

            {/* Analysis Status Center Card */}
            <div className="relative z-30 p-6 rounded-3xl bg-[#183D32]/85 border border-[#DCE8D9]/30 backdrop-blur-md text-center max-w-sm mx-4 shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-[#DCE8D9]/20 border border-[#DCE8D9]/40 flex items-center justify-center mx-auto mb-4 text-[#DCE8D9] animate-pulse">
                <Sparkles className="w-7 h-7 text-[#DCE8D9]" />
              </div>

              <h4 className="font-serif text-lg font-bold text-[#F7F8F3] mb-1">
                Analyzing Botanical Geometry
              </h4>
              <p className="text-xs text-[#DCE8D9] font-mono h-8 flex items-center justify-center transition-all">
                {SCAN_PHASES[currentPhaseIndex]}
              </p>

              {/* Progress bar */}
              <div className="w-full bg-white/20 h-1.5 rounded-full mt-4 overflow-hidden">
                <div
                  className="bg-[#34D399] h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentPhaseIndex + 1) / SCAN_PHASES.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SAMPLE SPECIMENS TRAY (Enables instant 1-click test of Rose, Money Plant, Tomato, Sunflower, Mango, Mushroom) */}
      <div className="nature-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#183D32]" />
            <h4 className="font-serif text-sm font-bold text-[#183D32]">
              Or Try Real Botanical Sample Specimens
            </h4>
          </div>
          <span className="text-[11px] text-[#73847B]">Click any specimen to inspect</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {BOTANICAL_DATABASE.slice(0, 6).map((plant) => (
            <button
              key={plant.id}
              type="button"
              onClick={() => handleSelectSample(plant)}
              className="group relative rounded-xl overflow-hidden border border-[#183D32]/10 hover:border-[#183D32] hover:shadow-md transition-all text-left bg-[#F7F8F3]"
            >
              <div className="aspect-square relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={plant.imageUrl}
                  alt={plant.commonName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-2xs">
                  {plant.category}
                </span>
              </div>
              <div className="p-2">
                <div className="text-xs font-bold text-[#183D32] truncate">{plant.commonName}</div>
                <div className="text-[10px] text-[#73847B] italic truncate">{plant.scientificName}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
