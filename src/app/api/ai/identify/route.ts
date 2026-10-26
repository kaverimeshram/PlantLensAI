import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BOTANICAL_DATABASE } from '@/data/botanicalData';
import { PlantSpecies } from '@/types/plant';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, intention, userApiKey } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    const apiKey = userApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // If an API key is available, call Google Gemini Vision!
    if (apiKey && apiKey.length > 10) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Use gemini-1.5-flash or gemini-2.0-flash-exp
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Clean base64 string
        let mimeType = 'image/jpeg';
        let base64Data = image;

        if (image.includes(';base64,')) {
          const parts = image.split(';base64,');
          mimeType = parts[0].replace('data:', '');
          base64Data = parts[1];
        }

        const prompt = `You are PlantLens AI, a world-class botanical taxonomist and plant biologist.
Analyze this photo carefully.
Identify the organism (whether it is an indoor plant, flower, tree, shrub, grass, vine, vegetable, fruit, herb, crop, weed, succulent, cactus, fern, moss, or mushroom/fungus).
If the image contains multiple distinct plants, set isMultiplePlantsDetected: true and list them in multiplePlantCandidates.
Determine the confidence percentage (0-100).
Check if it is toxic to pets (dogs/cats) or humans, and highlight any toxicity warnings.
Distinguish verified botanical facts from folkloric traditional uses.
If it is a mushroom, always include a strict safety warning never to consume wild mushrooms based on photos alone.

Return ONLY a valid JSON object matching this schema (do NOT wrap in markdown backticks, just raw JSON):
{
  "id": "slug-name",
  "commonName": "Common Name",
  "scientificName": "Genus species",
  "family": "Family Name",
  "category": "Houseplant" | "Flower" | "Tree & Shrub" | "Herb & Vegetable" | "Succulent & Cactus" | "Medicinal Plant" | "Fern & Moss" | "Mushroom & Fungi" | "Wild & Weed" | "Aquatic Plant",
  "confidence": 95,
  "verifiedStatus": "botanically_verified",
  "description": "2-3 concise informative sentences",
  "nativeRegion": "Native geographic origin",
  "distribution": "Worldwide distribution",
  "typicalSize": "e.g. 1-2 meters tall",
  "lifespan": "e.g. Perennial",
  "leafCharacteristics": "Leaf shape, margin, venation, texture",
  "floweringSeason": "Flowering timing",
  "fruitSeedInfo": "Fruit or seed description if applicable",
  "growingConditions": {
    "sunlight": "Full Sun" | "Partial Sunlight" | "Bright Indirect" | "Low Light" | "Shade",
    "sunlightDetails": "Details about light needs",
    "water": "Low" | "Moderate" | "Frequent" | "Keep Moist",
    "waterDetails": "Details about watering frequency and drainage",
    "soil": "Soil texture, pH, and potting mix",
    "humidity": "Preferred relative humidity range",
    "temperature": "Preferred temperature range in Celsius and Fahrenheit"
  },
  "propagationMethods": ["Method 1", "Method 2"],
  "ecologicalImportance": "Role in ecosystem, pollinators, or soil health",
  "traditionalUses": [
    {
      "description": "Known cultural or traditional use",
      "evidenceLevel": "verified_scientific" | "traditional_folklore" | "unproven",
      "citation": "Optional scientific study or historical text"
    }
  ],
  "toxicity": {
    "isToxicToPets": true or false,
    "isToxicToHumans": true or false,
    "severity": "none" | "mild" | "moderate" | "severe" | "fatal_risk",
    "details": "Specific compounds (e.g. calcium oxalate, solanine) and symptoms",
    "emergencyGuidance": "What to do if ingested"
  },
  "botanicalFacts": ["Fascinating botanical fact 1", "Fascinating botanical fact 2"],
  "safetyWarning": "Optional critical warning if mushroom or dangerously toxic",
  "alternativeCandidates": [
    {
      "commonName": "Alternative name",
      "scientificName": "Alternative species",
      "confidence": 15,
      "reason": "Why it might be confused"
    }
  ],
  "climateCompatibility": {
    "suitableZones": ["Tropical", "Subtropical", "Temperate", etc.],
    "canGrowInTropicalSubtropical": true,
    "canGrowInMediterranean": true,
    "canGrowInTemperate": true,
    "canGrowInArid": false,
    "localNotes": "Specific advice for growing in regions like Maharashtra / India or California"
  },
  "isMultiplePlantsDetected": false,
  "multiplePlantCandidates": []
}`;

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
        ]);

        const text = result.response.text().trim();
        // Clean out possible markdown code blocks ```json ... ```
        const cleanedJson = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleanedJson);

        return NextResponse.json({
          species: {
            ...parsed,
            imageUrl: image,
          },
          isMultiplePlantsDetected: !!parsed.isMultiplePlantsDetected,
          multiplePlantCandidates: parsed.multiplePlantCandidates || [],
          isDemoMode: false,
        });
      } catch (geminiError: any) {
        console.warn('Gemini live call error, falling back to simulated analysis:', geminiError?.message || geminiError);
      }
    }

    // Demo Mode Simulation
    // Match against sample library or return a realistic profile
    let matched = BOTANICAL_DATABASE[0];
    if (image.includes('damascena') || image.includes('rose') || image.includes('518709268805')) {
      matched = BOTANICAL_DATABASE.find(p => p.id === 'rosa-damascena') || matched;
    } else if (image.includes('tomato') || image.includes('592841200221')) {
      matched = BOTANICAL_DATABASE.find(p => p.id === 'solanum-lycopersicum') || matched;
    } else if (image.includes('sunflower') || image.includes('597848212624')) {
      matched = BOTANICAL_DATABASE.find(p => p.id === 'helianthus-annuus') || matched;
    } else if (image.includes('mango') || image.includes('553279768805')) {
      matched = BOTANICAL_DATABASE.find(p => p.id === 'mangifera-indica') || matched;
    } else if (image.includes('mushroom') || image.includes('agaric') || image.includes('544376798')) {
      matched = BOTANICAL_DATABASE.find(p => p.id === 'amanita-muscaria') || matched;
    } else if (image.includes('monstera') || image.includes('614594975525')) {
      matched = BOTANICAL_DATABASE.find(p => p.id === 'monstera-deliciosa') || matched;
    } else if (image.includes('tulsi') || image.includes('basil') || image.includes('618164436241')) {
      matched = BOTANICAL_DATABASE.find(p => p.id === 'ocimum-tenuiflorum') || matched;
    } else if (image.includes('sansevieria') || image.includes('snake') || image.includes('593482892290')) {
      matched = BOTANICAL_DATABASE.find(p => p.id === 'sansevieria-trifasciata') || matched;
    } else {
      const idx = Math.abs(image.length % BOTANICAL_DATABASE.length);
      matched = BOTANICAL_DATABASE[idx] || BOTANICAL_DATABASE[0];
    }

    return NextResponse.json({
      species: {
        ...matched,
        imageUrl: image,
      },
      isMultiplePlantsDetected: false,
      multiplePlantCandidates: [],
      isDemoMode: true,
      demoNote: 'Running in simulated demonstration mode. Provide a GEMINI_API_KEY for live visual recognition on arbitrary images.',
    });
  } catch (error: any) {
    console.error('Error in identify API route:', error);
    return NextResponse.json({ error: error?.message || 'Failed to analyze plant' }, { status: 500 });
  }
}
