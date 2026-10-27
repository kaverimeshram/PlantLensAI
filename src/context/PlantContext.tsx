'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  PlantSpecies,
  PlantDiagnosis,
  SavedPlant,
  CareReminder,
  AiChatMessage,
  HealthSeverity,
} from '@/types/plant';
import {
  SAMPLE_SAVED_PLANTS,
  SAMPLE_CARE_REMINDERS,
  BOTANICAL_DATABASE,
} from '@/data/botanicalData';

export type NavTab = 'home' | 'identify' | 'doctor' | 'my-plants' | 'explore' | 'chat';

interface PlantContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;

  // Active scan & diagnosis
  currentSpecies: PlantSpecies | null;
  setCurrentSpecies: (species: PlantSpecies | null) => void;
  currentDiagnosis: PlantDiagnosis | null;
  setCurrentDiagnosis: (diagnosis: PlantDiagnosis | null) => void;

  // Collection & reminders
  savedPlants: SavedPlant[];
  savePlantToCollection: (species: PlantSpecies, nickname?: string, location?: string) => SavedPlant;
  updateSavedPlant: (id: string, updates: Partial<SavedPlant>) => void;
  deleteSavedPlant: (id: string) => void;
  waterPlant: (id: string) => void;
  addTimelineObservation: (
    plantId: string,
    note: string,
    type?: 'observation' | 'photo' | 'diagnosis' | 'water',
    imageUrl?: string,
    healthScore?: number
  ) => void;

  careReminders: CareReminder[];
  toggleReminderDone: (id: string) => void;
  addCareReminder: (reminder: Omit<CareReminder, 'id' | 'completed'>) => void;

  // Recent scans
  recentScans: PlantSpecies[];
  addRecentScan: (species: PlantSpecies) => void;

  // AI Assistant Chat
  chatMessages: AiChatMessage[];
  addChatMessage: (msg: Omit<AiChatMessage, 'id' | 'timestamp'>) => void;
  activeChatPlant: PlantSpecies | null;
  setActiveChatPlant: (plant: PlantSpecies | null) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;

  // User Settings & API key
  userApiKey: string;
  setUserApiKey: (key: string) => void;
  isDemoMode: boolean;
  setIsDemoMode: (isDemo: boolean) => void;
  userLocation: string;
  setUserLocation: (loc: string) => void;

  // Quick navigation helpers
  startDiagnosisForSpecies: (species: PlantSpecies) => void;
  startChatForSpecies: (species: PlantSpecies) => void;
}

const PlantContext = createContext<PlantContextType | undefined>(undefined);

const LOCAL_STORAGE_KEYS = {
  SAVED_PLANTS: 'plantlens_saved_plants_v1',
  REMINDERS: 'plantlens_reminders_v1',
  RECENT_SCANS: 'plantlens_recent_scans_v1',
  API_KEY: 'plantlens_user_gemini_key',
  LOCATION: 'plantlens_user_location',
};

export const PlantProvider = ({ children }: { children: ReactNode }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [currentSpecies, setCurrentSpecies] = useState<PlantSpecies | null>(null);
  const [currentDiagnosis, setCurrentDiagnosis] = useState<PlantDiagnosis | null>(null);
  const [activeChatPlant, setActiveChatPlant] = useState<PlantSpecies | null>(null);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  const [savedPlants, setSavedPlants] = useState<SavedPlant[]>(SAMPLE_SAVED_PLANTS);
  const [careReminders, setCareReminders] = useState<CareReminder[]>(SAMPLE_CARE_REMINDERS);
  const [recentScans, setRecentScans] = useState<PlantSpecies[]>(BOTANICAL_DATABASE.slice(0, 3));
  const [userApiKey, setUserApiKeyState] = useState<string>('');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [userLocation, setUserLocationState] = useState<string>('Maharashtra, India');

  // Deferred hydration from localStorage to prevent React 19 cascading renders & lint errors
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const storedPlants = localStorage.getItem(LOCAL_STORAGE_KEYS.SAVED_PLANTS);
        if (storedPlants) {
          setSavedPlants(JSON.parse(storedPlants));
        }

        const storedReminders = localStorage.getItem(LOCAL_STORAGE_KEYS.REMINDERS);
        if (storedReminders) {
          setCareReminders(JSON.parse(storedReminders));
        }

        const storedScans = localStorage.getItem(LOCAL_STORAGE_KEYS.RECENT_SCANS);
        if (storedScans) {
          setRecentScans(JSON.parse(storedScans));
        }

        const storedApiKey = localStorage.getItem(LOCAL_STORAGE_KEYS.API_KEY);
        if (storedApiKey) {
          setUserApiKeyState(storedApiKey);
          setIsDemoMode(false);
        }

        const storedLocation = localStorage.getItem(LOCAL_STORAGE_KEYS.LOCATION);
        if (storedLocation) {
          setUserLocationState(storedLocation);
        }
      } catch (e) {
        console.error('Failed to load from local storage', e);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Save changes to localStorage
  const setUserApiKey = (key: string) => {
    setUserApiKeyState(key);
    if (typeof window !== 'undefined') {
      if (key) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.API_KEY, key);
        setIsDemoMode(false);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEYS.API_KEY);
        setIsDemoMode(true);
      }
    }
  };

  const setUserLocation = (loc: string) => {
    setUserLocationState(loc);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.LOCATION, loc);
    }
  };

  const savePlantToCollection = (species: PlantSpecies, nickname?: string, location: string = 'Living Room'): SavedPlant => {
    const validLocation = (
      ['Living Room', 'Balcony', 'Garden', 'Kitchen', 'Bedroom', 'Office', 'Outdoor Farm'].includes(location)
        ? location
        : 'Living Room'
    ) as SavedPlant['location'];

    const newPlant: SavedPlant = {
      id: 'saved-' + Date.now(),
      name: species.commonName,
      scientificName: species.scientificName,
      nickname: nickname || species.commonName.split('/')[0].trim(),
      category: species.category,
      imageUrl: species.imageUrl,
      dateAdded: new Date().toISOString().split('T')[0],
      location: validLocation,
      wateringFrequencyDays: species.growingConditions?.water === 'Low' ? 14 : species.growingConditions?.water === 'Frequent' ? 3 : 6,
      lastWateredDate: new Date().toISOString().split('T')[0],
      sunlightRequirement: species.growingConditions?.sunlight || 'Bright Indirect',
      healthStatus: 'healthy',
      notes: species.description || 'Added from PlantLens AI scan.',
      timeline: [
        {
          id: 'tl-' + Date.now(),
          date: new Date().toISOString().split('T')[0],
          type: 'scan',
          title: 'Identified & Added to Collection',
          note: `Scanned with PlantLens AI. Confidence: ${species.confidence}%`,
          imageUrl: species.imageUrl,
          healthScore: 95,
        },
      ],
    };

    const updated = [newPlant, ...savedPlants];
    setSavedPlants(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.SAVED_PLANTS, JSON.stringify(updated));
    }

    // Auto-add an initial reminder for watering
    const newReminder: CareReminder = {
      id: 'rem-' + Date.now(),
      plantId: newPlant.id,
      plantName: newPlant.name,
      plantNickname: newPlant.nickname,
      plantImage: newPlant.imageUrl,
      type: 'water',
      dueDate: `In ${newPlant.wateringFrequencyDays} days`,
      frequencyDays: newPlant.wateringFrequencyDays,
      completed: false,
    };
    const updatedReminders = [newReminder, ...careReminders];
    setCareReminders(updatedReminders);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.REMINDERS, JSON.stringify(updatedReminders));
    }

    return newPlant;
  };

  const updateSavedPlant = (id: string, updates: Partial<SavedPlant>) => {
    const updated = savedPlants.map(p => (p.id === id ? { ...p, ...updates } : p));
    setSavedPlants(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.SAVED_PLANTS, JSON.stringify(updated));
    }
  };

  const deleteSavedPlant = (id: string) => {
    const updated = savedPlants.filter(p => p.id !== id);
    setSavedPlants(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.SAVED_PLANTS, JSON.stringify(updated));
    }
  };

  const waterPlant = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const target = savedPlants.find(p => p.id === id);
    if (!target) return;

    const newTimelineEvent = {
      id: 'tl-' + Date.now(),
      date: today,
      type: 'water' as const,
      title: 'Watered & Checked',
      note: 'Thoroughly hydrated until drainage ran clear.',
    };

    const updated = savedPlants.map(p =>
      p.id === id
        ? {
            ...p,
            lastWateredDate: today,
            timeline: [newTimelineEvent, ...p.timeline],
          }
        : p
    );

    setSavedPlants(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.SAVED_PLANTS, JSON.stringify(updated));
    }

    // Mark corresponding care reminder as completed if exists
    setCareReminders(prev =>
      prev.map(r => (r.plantId === id && r.type === 'water' ? { ...r, completed: true } : r))
    );
  };

  const addTimelineObservation = (
    plantId: string,
    note: string,
    type: 'observation' | 'photo' | 'diagnosis' | 'water' = 'observation',
    imageUrl?: string,
    healthScore?: number
  ) => {
    const event = {
      id: 'tl-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      type,
      title: type === 'diagnosis' ? 'Health Diagnosis Logged' : 'Growth Observation',
      note,
      imageUrl,
      healthScore,
    };

    const updated = savedPlants.map(p =>
      p.id === plantId
        ? {
            ...p,
            healthStatus: healthScore && healthScore < 70 ? ('moderate_issue' as HealthSeverity) : p.healthStatus,
            timeline: [event, ...p.timeline],
          }
        : p
    );
    setSavedPlants(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.SAVED_PLANTS, JSON.stringify(updated));
    }
  };

  const toggleReminderDone = (id: string) => {
    const updated = careReminders.map(r => (r.id === id ? { ...r, completed: !r.completed } : r));
    setCareReminders(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.REMINDERS, JSON.stringify(updated));
    }
  };

  const addCareReminder = (reminder: Omit<CareReminder, 'id' | 'completed'>) => {
    const newRem: CareReminder = {
      ...reminder,
      id: 'rem-' + Date.now(),
      completed: false,
    };
    const updated = [newRem, ...careReminders];
    setCareReminders(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.REMINDERS, JSON.stringify(updated));
    }
  };

  const addRecentScan = (species: PlantSpecies) => {
    const filtered = recentScans.filter(s => s.id !== species.id && s.scientificName !== species.scientificName);
    const updated = [species, ...filtered].slice(0, 8);
    setRecentScans(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEYS.RECENT_SCANS, JSON.stringify(updated));
    }
  };

  // Chat message store
  const [chatMessages, setChatMessages] = useState<AiChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content: 'Welcome to PlantLens AI! I can help you identify any plant species, diagnose yellowing leaves or pests, provide watering schedules, and guide propagation. What plant are you caring for today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const addChatMessage = (msg: Omit<AiChatMessage, 'id' | 'timestamp'>) => {
    const newMsg: AiChatMessage = {
      ...msg,
      id: 'msg-' + Date.now(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, newMsg]);
  };

  const startDiagnosisForSpecies = (species: PlantSpecies) => {
    setCurrentSpecies(species);
    setActiveTab('doctor');
  };

  const startChatForSpecies = (species: PlantSpecies) => {
    setActiveChatPlant(species);
    setIsChatOpen(true);
    addChatMessage({
      role: 'assistant',
      content: `I have loaded **${species.commonName}** (*${species.scientificName}*). How can I assist you with this plant's care, climate requirements, or growth?`,
      plantContext: {
        name: species.commonName,
        scientificName: species.scientificName,
        imageUrl: species.imageUrl,
      },
    });
  };

  return (
    <PlantContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentSpecies,
        setCurrentSpecies,
        currentDiagnosis,
        setCurrentDiagnosis,
        savedPlants,
        savePlantToCollection,
        updateSavedPlant,
        deleteSavedPlant,
        waterPlant,
        addTimelineObservation,
        careReminders,
        toggleReminderDone,
        addCareReminder,
        recentScans,
        addRecentScan,
        chatMessages,
        addChatMessage,
        activeChatPlant,
        setActiveChatPlant,
        isChatOpen,
        setIsChatOpen,
        userApiKey,
        setUserApiKey,
        isDemoMode,
        setIsDemoMode,
        userLocation,
        setUserLocation,
        startDiagnosisForSpecies,
        startChatForSpecies,
      }}
    >
      {children}
    </PlantContext.Provider>
  );
};

export const usePlant = () => {
  const context = useContext(PlantContext);
  if (!context) {
    throw new Error('usePlant must be used within a PlantProvider');
  }
  return context;
};
