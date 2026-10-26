import { PlantSpecies, PlantDiagnosis, AiChatMessage, HealthSeverity } from '@/types/plant';
import { BOTANICAL_DATABASE } from '@/data/botanicalData';

export interface PlantAiServiceInterface {
  identifyPlant(
    imageBase64: string,
    options?: { intention?: string; userApiKey?: string }
  ): Promise<{
    species: PlantSpecies;
    isMultiplePlantsDetected?: boolean;
    multiplePlantCandidates?: Array<{ name: string; boundingBoxDesc: string }>;
    isDemoMode: boolean;
  }>;

  diagnosePlantHealth(
    imageBase64: string,
    options?: {
      symptoms?: string[];
      answers?: Record<string, string>;
      additionalImages?: { leaf?: string; stem?: string; soil?: string };
      userApiKey?: string;
    }
  ): Promise<{
    diagnosis: PlantDiagnosis;
    isDemoMode: boolean;
  }>;

  askAssistant(
    messages: AiChatMessage[],
    plantContext?: { name: string; scientificName: string; details?: string },
    userApiKey?: string
  ): Promise<{
    reply: string;
    isDemoMode: boolean;
  }>;
}

export class PlantLensAiService implements PlantAiServiceInterface {
  private getApiKey(userKey?: string): string | null {
    if (userKey && userKey.trim().length > 5) return userKey.trim();
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GEMINI_API_KEY) {
      return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    }
    return null;
  }

  async identifyPlant(
    imageBase64: string,
    options?: { intention?: string; userApiKey?: string }
  ): Promise<{
    species: PlantSpecies;
    isMultiplePlantsDetected?: boolean;
    multiplePlantCandidates?: Array<{ name: string; boundingBoxDesc: string }>;
    isDemoMode: boolean;
  }> {
    // If backend API endpoint is available or client has key
    try {
      const response = await fetch('/api/ai/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageBase64,
          intention: options?.intention || 'identify',
          userApiKey: options?.userApiKey,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch {
      // Fallback to client-side simulation if server is unreachable
    }

    // Default intelligent botanical matching from curated knowledge base
    return this.getSimulatedIdentification(imageBase64, options?.intention);
  }

  async diagnosePlantHealth(
    imageBase64: string,
    options?: {
      symptoms?: string[];
      answers?: Record<string, string>;
      additionalImages?: { leaf?: string; stem?: string; soil?: string };
      userApiKey?: string;
    }
  ): Promise<{
    diagnosis: PlantDiagnosis;
    isDemoMode: boolean;
  }> {
    try {
      const response = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageBase64,
          symptoms: options?.symptoms || [],
          answers: options?.answers || {},
          additionalImages: options?.additionalImages,
          userApiKey: options?.userApiKey,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch {
      // Fallback
    }

    return this.getSimulatedDiagnosis(imageBase64, options?.symptoms, options?.answers);
  }

  async askAssistant(
    messages: AiChatMessage[],
    plantContext?: { name: string; scientificName: string; details?: string },
    userApiKey?: string
  ): Promise<{
    reply: string;
    isDemoMode: boolean;
  }> {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          plantContext,
          userApiKey,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch {
      // Fallback
    }

    return {
      reply: this.getSimulatedAssistantReply(messages[messages.length - 1]?.content || '', plantContext),
      isDemoMode: true,
    };
  }

  private getSimulatedIdentification(imageBase64: string, intention?: string) {
    // Check if the image matches any known sample plant URL or filename in data
    let matched = BOTANICAL_DATABASE[0]; // Golden Pothos default

    if (imageBase64.includes('damascena') || imageBase64.includes('rose') || imageBase64.includes('518709268805')) {
      matched = BOTANICAL_DATABASE.find(p => p.id === 'rosa-damascena') || matched;
    } else if (imageBase64.includes('tomato') || imageBase64.includes('592841200221')) {
      matched = BOTANICAL_DATABASE.find(p => p.id === 'solanum-lycopersicum') || matched;
    } else if (imageBase64.includes('sunflower') || imageBase64.includes('597848212624')) {
      matched = BOTANICAL_DATABASE.find(p => p.id === 'helianthus-annuus') || matched;
    } else if (imageBase64.includes('mango') || imageBase64.includes('553279768805')) {
      matched = BOTANICAL_DATABASE.find(p => p.id === 'mangifera-indica') || matched;
    } else if (imageBase64.includes('mushroom') || imageBase64.includes('agaric') || imageBase64.includes('544376798')) {
      matched = BOTANICAL_DATABASE.find(p => p.id === 'amanita-muscaria') || matched;
    } else if (imageBase64.includes('monstera') || imageBase64.includes('614594975525')) {
      matched = BOTANICAL_DATABASE.find(p => p.id === 'monstera-deliciosa') || matched;
    } else if (imageBase64.includes('tulsi') || imageBase64.includes('basil') || imageBase64.includes('618164436241')) {
      matched = BOTANICAL_DATABASE.find(p => p.id === 'ocimum-tenuiflorum') || matched;
    } else if (imageBase64.includes('sansevieria') || imageBase64.includes('snake') || imageBase64.includes('593482892290')) {
      matched = BOTANICAL_DATABASE.find(p => p.id === 'sansevieria-trifasciata') || matched;
    } else {
      // Pick based on a deterministic hash of the image content length
      const index = Math.abs(imageBase64.length % BOTANICAL_DATABASE.length);
      matched = BOTANICAL_DATABASE[index] || BOTANICAL_DATABASE[0];
    }

    return {
      species: {
        ...matched,
        // Keep the user's uploaded image as the displayed photo
        imageUrl: imageBase64.startsWith('data:') || imageBase64.startsWith('http') ? imageBase64 : matched.imageUrl,
      },
      isMultiplePlantsDetected: false,
      isDemoMode: true,
    };
  }

  private getSimulatedDiagnosis(
    imageBase64: string,
    symptoms?: string[],
    answers?: Record<string, string>
  ) {
    const symptomList = symptoms && symptoms.length > 0
      ? symptoms
      : ['Yellowing lower foliage', 'Mild leaf margin browning'];

    const isFrequentWatering = answers?.['water_frequency']?.includes('Every day') || answers?.['soil_state']?.includes('Wet / Soggy');

    return {
      diagnosis: {
        id: 'diag-' + Date.now(),
        scanDate: new Date().toISOString().split('T')[0],
        overallHealth: (isFrequentWatering ? 'moderate_issue' : 'mild_stress') as HealthSeverity,
        healthScore: isFrequentWatering ? 68 : 82,
        plantIdentification: {
          commonName: 'Indoor Foliage Plant (Aroid / Pothos / Monstera family)',
          scientificName: 'Araceae / Epipremnum sp.',
        },
        observedSymptoms: symptomList,
        possibleCauses: [
          {
            cause: isFrequentWatering ? 'Early Root Hypoxia / Overwatering' : 'Subtle Moisture Imbalance or Under-Humidity',
            likelihood: 78,
            description: isFrequentWatering
              ? 'Soil remains saturated too long, depriving roots of essential oxygen and leading to chlorotic (yellow) leaves that shed.'
              : 'Fluctuating moisture levels combined with dry ambient air cause cellular stress in delicate leaf tips.',
            visualEvidence: 'Pale yellowing starting on oldest leaves while veins remain faintly green, accompanied by softened leaf tissue.',
          },
          {
            cause: 'Nitrogen (N) or Micronutrient Depletion',
            likelihood: 42,
            description: 'As potting soil ages, mobile nitrogen is pulled toward newer growth, leaving older basal leaves pale yellow.',
            visualEvidence: 'Uniform gradual fading of green pigment across lower older leaf blades.',
          },
          {
            cause: 'Harsh Direct Sun Scorch',
            likelihood: 25,
            description: 'Intense midday UV radiation breaking down chlorophyll chloroplasts on upper leaf faces.',
            visualEvidence: 'Crispy dry parchment-like patches on leaves facing window light.',
          },
        ],
        treatmentPlan: {
          immediateActions: [
            'Inspect the drainage holes at the bottom of the pot to ensure water flows out freely.',
            'Trim away fully yellowed, dying leaves with clean, alcohol-sterilized scissors to prevent fungal colonization.',
            'Allow the top 2 inches (5 cm) of potting mix to dry completely before providing any more water.',
          ],
          wateringAdjustments: 'Switch to the "soak and dry" method: water thoroughly until liquid drips from bottom holes, then discard excess runoff in the saucer.',
          lightTempAdjustments: 'Relocate 3–5 feet away from drafty AC vents and unshaded South/West facing window panes. Provide bright, filtered sunlight.',
          soilDrainageRecommendations: 'If soil remains dense and heavy, repot using an airy blend of 50% potting soil, 25% perlite, and 25% orchid pine bark.',
          pestManagement: 'Wipe both sides of leaves with a soft damp microfiber cloth; inspect for microscopic spider mites or webbing in leaf axils.',
          fertilizerAdvice: 'Pause synthetic fertilizers while the plant is stressed. Resume gentle balanced liquid kelp (1/4 strength) once active new green growth resumes.',
          preventionTips: [
            'Use a wooden chopstick or moisture probe to check depth moisture before watering.',
            'Ensure the planter always has functional drainage holes.',
            'Rotate the pot a quarter turn every two weeks for even leaf development.',
          ],
          followUpSchedule: 'Re-inspect leaf firmness and soil moisture in 7 days. Mark progress in PlantLens AI timeline.',
        },
        followUpQuestions: [
          {
            id: 'soil_moisture',
            question: 'How does the soil feel 2 inches below the surface right now?',
            options: ['Bone dry and dusty', 'Slightly cool and damp', 'Completely saturated / muddy'],
          },
          {
            id: 'pot_drainage',
            question: 'Does the plant container have functional drainage holes at the bottom?',
            options: ['Yes, water drains into a saucer', 'No, it is in a solid decorative pot without holes', 'Unsure'],
          },
        ],
        imageUrl: imageBase64,
        disclaimer: 'Visual AI health assessments are diagnostic aids. Environmental conditions, microclimates, and soil microbiology affect actual outcomes.',
      },
      isDemoMode: true,
    };
  }

  private getSimulatedAssistantReply(
    query: string,
    plantContext?: { name: string; scientificName: string; details?: string }
  ): string {
    const q = query.toLowerCase();
    const plantName = plantContext?.name || 'this plant';
    const sciName = plantContext?.scientificName ? ` (*${plantContext.scientificName}*)` : '';

    if (q.includes('yellow') || q.includes('leaf') || q.includes('curling') || q.includes('brown')) {
      return `For **${plantName}**${sciName}, yellowing leaves are most frequently triggered by one of three factors:\n\n1. **Overwatering & Poor Drainage**: When roots sit in saturated medium, they suffocate and cannot absorb oxygen, causing lower leaves to turn soft yellow.\n2. **Natural Aging**: Older leaves near the base naturally senesce as the plant channels nitrogen to vibrant new shoots.\n3. **Light Stress**: If placed in too dim a corner or harsh direct sun, leaf pigmentation breaks down.\n\n**Action Step**: Check the soil moisture 2 inches down. If damp, withhold water for a week and ensure the pot has drainage holes.`;
    }

    if (q.includes('water') || q.includes('how often')) {
      return `For **${plantName}**${sciName}, follow the rule of soil dryness rather than a strict calendar day.\n\n- **Check before watering**: Insert your index finger 2 inches into the soil. If it feels cool and moist, wait.\n- **Watering technique**: When dry, drench thoroughly until water runs freely out of the drainage holes.\n- **Seasonal adjustment**: Water more during spring and summer active growth, and cut back significantly during cooler winter months.`;
    }

    if (q.includes('maharashtra') || q.includes('india') || q.includes('climate')) {
      return `**Climate Assessment for ${plantName} in Maharashtra / Tropical Subtropical India:**\n\n- **Monsoon Season (June–Sept)**: High humidity causes rapid vegetative growth! Ensure excellent potting drainage so heavy rains do not trigger fungal root rot.\n- **Summer (March–May)**: Temperatures can exceed 38°C (100°F). Shield indoor and balcony plants from scorch; mist foliage or keep near humidity trays.\n- **Winter (Nov–Feb)**: Mild and pleasant. This is an ideal growing period for moderate sunlight.\n\nOverall, most tropical plants, money plants, tulsi, and mango varieties thrive naturally across Maharashtra (Pune, Mumbai, Nashik, Konkan)!`;
    }

    if (q.includes('cat') || q.includes('dog') || q.includes('pet') || q.includes('poison') || q.includes('toxic')) {
      return `**Pet & Human Toxicity Guidance for ${plantName}:**\n\n- If this is an **Aroid / Philodendron / Pothos / Monstera / Dieffenbachia**: It contains insoluble **calcium oxalate raphide crystals**. If chewed by cats or dogs, it causes intense oral pain, drooling, pawing at the mouth, and vomiting.\n- If this is **Tulsi, Rose, Sunflower, or Maidenhair Fern**: Completely **non-toxic and pet-safe**!\n- **Emergency Tip**: If your pet ingested an unknown plant or is displaying swelling or lethargy, rinse their mouth with water and contact your local vet or the ASPCA Poison Control Center immediately.`;
    }

    if (q.includes('propagate') || q.includes('cutting') || q.includes('grow')) {
      return `**How to propagate ${plantName} successfully:**\n\n1. **Locate a Healthy Node**: Choose a stem with at least 2–3 leaves and a visible brown bump or aerial root (the node).\n2. **Sterilize Tools**: Use clean sharp shears and cut 1/4 inch below the lowest node.\n3. **Water Rooting**: Place the cutting into a glass jar of room-temperature filtered water, keeping leaves above the surface.\n4. **Placement**: Set in bright indirect sunlight. Change water every 4–5 days to keep oxygen levels high.\n5. **Soil Transfer**: Once roots reach 2 inches long (typically 2–3 weeks), pot into airy soil!`;
    }

    return `**PlantLens Botanist Assistant:**\n\nRegarding **${plantName}**${sciName}:\n\n- It thrives best with **balanced, attentive care**: provide adequate light suited to its native habitat, allow proper drainage, and avoid extreme temperature shocks.\n- Feel free to ask more specific questions about pest control, propagation, soil mixtures, or seasonal care adjustments!`;
  }
}

export const plantAiService = new PlantLensAiService();
