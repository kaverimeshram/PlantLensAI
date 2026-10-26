'use client';

import React from 'react';
import { X, AlertTriangle, PhoneCall, ShieldAlert, HeartHandshake, CheckCircle } from 'lucide-react';

interface SafetyWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyWarningModal: React.FC<SafetyWarningModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#183D32]/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#FFFFFF] rounded-2xl shadow-2xl border border-[#C2410C]/30 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FEF2F2] border-b border-[#FECACA] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#C2410C] flex items-center justify-center text-[#FFFFFF] shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#991B1B]">Botanical & Mushroom Safety Protocol</h3>
              <p className="text-xs text-[#B91C1C]">Important health and toxicology disclosures</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#FEE2E2] text-[#991B1B] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto text-sm text-[#1A2420]">
          {/* Strict Mushroom Ingestion Prohibition */}
          <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-[#DC2626] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-[#991B1B] text-sm">Never Eat Wild Mushrooms Based on Camera Scans</h4>
              <p className="text-xs text-[#7F1D1D] leading-relaxed">
                Visual photo matching can never guarantee edibility. Lethal fungi (such as <em>Amanita phalloides</em> / Death Cap) share close visual resemblance with common edible species at various growth stages. <strong>PlantLens AI strictly prohibits using identification scans for foraging consumption.</strong>
              </p>
            </div>
          </div>

          {/* Emergency Hotlines */}
          <div className="space-y-3">
            <h4 className="font-semibold text-xs tracking-wider uppercase text-[#183D32] flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-[#C2410C]" />
              Emergency Poison Control & Medical Assistance
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10">
                <div className="font-bold text-xs text-[#183D32]">United States & Canada</div>
                <div className="text-sm font-semibold text-[#C2410C] mt-0.5">1-800-222-1222</div>
                <div className="text-[11px] text-[#73847B]">Poison Help / 24-7 Toll-Free</div>
              </div>
              <div className="p-3 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10">
                <div className="font-bold text-xs text-[#183D32]">India (AIIMS New Delhi)</div>
                <div className="text-sm font-semibold text-[#C2410C] mt-0.5">1800-116-117 / 011-26593677</div>
                <div className="text-[11px] text-[#73847B]">National Poisons Information Centre</div>
              </div>
              <div className="p-3 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10">
                <div className="font-bold text-xs text-[#183D32]">United Kingdom</div>
                <div className="text-sm font-semibold text-[#C2410C] mt-0.5">999 (Emergency) / 111 (NHS)</div>
                <div className="text-[11px] text-[#73847B]">National Health Service</div>
              </div>
              <div className="p-3 rounded-xl bg-[#F7F8F3] border border-[#183D32]/10">
                <div className="font-bold text-xs text-[#183D32]">ASPCA Animal Poison Control</div>
                <div className="text-sm font-semibold text-[#C2410C] mt-0.5">(888) 426-4435</div>
                <div className="text-[11px] text-[#73847B]">For dogs, cats, and domestic pets</div>
              </div>
            </div>
          </div>

          {/* Plant Toxicity & Housepet Safety */}
          <div className="space-y-2 text-xs leading-relaxed text-[#475850]">
            <h4 className="font-bold text-[#183D32] text-sm flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-[#3A725D]" />
              Houseplants & Pet Toxicity
            </h4>
            <p>
              Many popular houseplants (e.g. Dieffenbachia, Philodendron, Pothos, Snake Plant, Oleander, Lilies) contain <strong>insoluble calcium oxalate crystals</strong> or cardiac glycosides. Even small bites can cause throat swelling, vomiting, and kidney failure in cats and dogs.
            </p>
            <p>
              Always review the pet safety badge on every PlantLens identification card before placing new foliage within reach of animals.
            </p>
          </div>

          {/* Scientific Evidence vs Folklore */}
          <div className="p-3 rounded-xl bg-[#EDF4EB] border border-[#C8DBC4] text-xs space-y-1">
            <div className="font-bold text-[#183D32] flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-[#15803D]" />
              Verified Botanical Science
            </div>
            <p className="text-[#475850]">
              PlantLens AI clearly separates clinical peer-reviewed pharmacological evidence from folkloric or traditional Ayurvedic uses. Traditional uses are labeled for cultural reference and do not constitute certified medical claims.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F7F8F3] border-t border-[#183D32]/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#183D32] text-[#F7F8F3] hover:bg-[#122E26] transition-colors"
          >
            I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
};
