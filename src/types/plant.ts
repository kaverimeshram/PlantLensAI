export type PlantCategory =
  | 'Houseplant'
  | 'Flower'
  | 'Tree & Shrub'
  | 'Herb & Vegetable'
  | 'Succulent & Cactus'
  | 'Medicinal Plant'
  | 'Fern & Moss'
  | 'Mushroom & Fungi'
  | 'Wild & Weed'
  | 'Aquatic Plant';

export type HealthSeverity = 'healthy' | 'mild_stress' | 'moderate_issue' | 'critical';

export interface AlternativeCandidate {
  commonName: string;
  scientificName: string;
  confidence: number;
  reason: string;
}

export interface GrowingConditions {
  sunlight: 'Full Sun' | 'Partial Sunlight' | 'Bright Indirect' | 'Low Light' | 'Shade';
  sunlightDetails: string;
  water: 'Low' | 'Moderate' | 'Frequent' | 'Keep Moist';
  waterDetails: string;
  soil: string;
  humidity: string;
  temperature: string;
  idealHardinessZones?: string;
}

export interface TraditionalUse {
  description: string;
  evidenceLevel: 'verified_scientific' | 'traditional_folklore' | 'unproven';
  citation?: string;
}

export interface ToxicityInfo {
  isToxicToPets: boolean;
  isToxicToHumans: boolean;
  severity: 'none' | 'mild' | 'moderate' | 'severe' | 'fatal_risk';
  details: string;
  emergencyGuidance?: string;
}

export interface PlantSpecies {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  category: PlantCategory;
  confidence: number;
  verifiedStatus: 'botanically_verified' | 'ai_estimated';
  imageUrl: string;
  description: string;
  nativeRegion: string;
  distribution: string;
  typicalSize: string;
  lifespan: string;
  leafCharacteristics: string;
  floweringSeason: string;
  fruitSeedInfo?: string;
  growingConditions: GrowingConditions;
  propagationMethods: string[];
  ecologicalImportance: string;
  traditionalUses: TraditionalUse[];
  toxicity: ToxicityInfo;
  botanicalFacts: string[];
  safetyWarning?: string;
  alternativeCandidates?: AlternativeCandidate[];
  climateCompatibility?: {
    suitableZones: string[];
    canGrowInTropicalSubtropical: boolean;
    canGrowInMediterranean: boolean;
    canGrowInTemperate: boolean;
    canGrowInArid: boolean;
    localNotes?: string;
  };
}

export interface PossibleCause {
  cause: string;
  likelihood: number; // 0 - 100
  description: string;
  visualEvidence: string;
}

export interface TreatmentPlan {
  immediateActions: string[];
  wateringAdjustments: string;
  lightTempAdjustments: string;
  soilDrainageRecommendations: string;
  pestManagement: string;
  fertilizerAdvice: string;
  preventionTips: string[];
  followUpSchedule: string;
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  options: string[];
  selectedOption?: string;
}

export interface PlantDiagnosis {
  id: string;
  scanDate: string;
  overallHealth: HealthSeverity;
  healthScore: number; // 0 - 100 (100 = optimal health)
  plantIdentification?: {
    commonName: string;
    scientificName: string;
  };
  observedSymptoms: string[];
  possibleCauses: PossibleCause[];
  treatmentPlan: TreatmentPlan;
  followUpQuestions: FollowUpQuestion[];
  imageUrl: string;
  multiAngleImages?: {
    leaf?: string;
    stem?: string;
    rootsSoil?: string;
  };
  disclaimer: string;
  isMushroomOrToxic?: boolean;
}

export interface PlantTimelineEvent {
  id: string;
  date: string;
  type: 'scan' | 'diagnosis' | 'water' | 'fertilize' | 'observation' | 'photo';
  title: string;
  note: string;
  imageUrl?: string;
  healthScore?: number;
}

export interface SavedPlant {
  id: string;
  name: string;
  scientificName: string;
  nickname?: string;
  category: PlantCategory;
  imageUrl: string;
  dateAdded: string;
  location: 'Living Room' | 'Balcony' | 'Garden' | 'Kitchen' | 'Bedroom' | 'Office' | 'Outdoor Farm';
  wateringFrequencyDays: number;
  lastWateredDate: string;
  sunlightRequirement: string;
  healthStatus: HealthSeverity;
  notes: string;
  timeline: PlantTimelineEvent[];
}

export interface CareReminder {
  id: string;
  plantId: string;
  plantName: string;
  plantImage: string;
  plantNickname?: string;
  type: 'water' | 'fertilize' | 'mist' | 'prune' | 'inspect';
  dueDate: string;
  frequencyDays: number;
  completed: boolean;
}

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  plantContext?: {
    name: string;
    scientificName: string;
    imageUrl?: string;
  };
}

export interface ScanIntent {
  id: 'identify' | 'health' | 'uses' | 'care';
  label: string;
  description: string;
}
