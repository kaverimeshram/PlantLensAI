import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BOTANICAL_DATABASE } from '@/data/botanicalData';
import { PlantSpecies } from '@/types/plant';
import {
  checkRateLimit,
  validateImageInput,
  safeResolveImageBase64,
  withTimeout,
} from '@/lib/serverSecurity';

// Sanitize error messages to ensure API keys are never leaked to clients or logs
function sanitizeErrorMessage(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  return msg
    .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_KEY]')
    .replace(/key=[^&\s]+/gi, 'key=[REDACTED]');
}

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce sliding window rate limiting per client IP (25 req/min)
    const rateLimit = checkRateLimit(req);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit reached. Please wait ${rateLimit.resetSeconds} seconds before scanning again.`,
          retryAfter: rateLimit.resetSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetSeconds),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // 2. Parse and validate JSON body
    let body: { image?: string; intention?: string; userApiKey?: string; imageName?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Malformed JSON request body.' }, { status: 400 });
    }

    const { image, intention, userApiKey, imageName } = body;

    // 3. Validate image input format, size (max 15MB), and SSRF constraints
    const validation = validateImageInput(image);
    if (!validation.valid || !image) {
      return NextResponse.json({ error: validation.error }, { status: validation.statusCode || 400 });
    }

    // 4. Resolve API key: Server environment variable takes precedence, userApiKey allowed for testing
    const serverApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const apiKey = (serverApiKey && serverApiKey.trim().length > 10 && !serverApiKey.includes('your_gemini_api_key'))
      ? serverApiKey
      : (userApiKey && userApiKey.trim().length > 10)
      ? userApiKey.trim()
      : null;

    const isLiveMode = Boolean(apiKey);

    // 5. LIVE AI MODE: Call Google Gemini Multimodal Vision
    if (isLiveMode && apiKey) {
      try {
        const { base64Data, mimeType } = await safeResolveImageBase64(image);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
          },
        });

        const prompt = `You are PlantLens AI, a world-class botanical taxonomist and plant biologist.
Analyze this photo carefully.
First, determine whether this photo depicts a botanical organism (indoor plant, flower, tree, shrub, grass, vine, vegetable, fruit, herb, crop, weed, succulent, cactus, fern, moss, or mushroom/fungus).

CRITICAL RULE FOR NON-PLANT IMAGES:
If the photo does NOT depict a plant organism, tree, flower, fruit, vegetable, weed, or fungus (e.g. it is a car, animal, person, gadget, building, furniture, book, dish without raw botanical material, or abstract graphic), you MUST return:
{
  "isPlantOrganism": false,
  "nonPlantDetectedReason": "Accurate explanation of what was detected in the photo and why it is not a botanical organism.",
  "commonName": "No Plant Organism Detected",
  "scientificName": "Non-botanical subject",
  "family": "N/A",
  "category": "Wild & Weed",
  "confidence": 0,
  "verifiedStatus": "ai_estimated",
  "description": "The uploaded photograph does not appear to contain plant foliage, flowers, stems, or fungal structures.",
  "nativeRegion": "N/A",
  "distribution": "N/A",
  "typicalSize": "N/A",
  "lifespan": "N/A",
  "leafCharacteristics": "None observed",
  "floweringSeason": "N/A",
  "growingConditions": {
    "sunlight": "Bright Indirect",
    "sunlightDetails": "N/A",
    "water": "Low",
    "waterDetails": "N/A",
    "soil": "N/A",
    "humidity": "N/A",
    "temperature": "N/A"
  },
  "propagationMethods": [],
  "ecologicalImportance": "N/A",
  "traditionalUses": [],
  "toxicity": {
    "isToxicToPets": false,
    "isToxicToHumans": false,
    "severity": "none",
    "details": "N/A"
  },
  "botanicalFacts": ["Tip: Center the leaf, flower, or bark clearly in frame with good natural lighting for accurate botanical identification."]
}

If the image DOES contain a plant organism:
1. Set "isPlantOrganism": true.
2. Determine real confidence percentage (0-100). Never fabricate high certainty if the image is blurry, distant, or ambiguous.
3. If confidence is below 60, provide clear reasons in the description.
4. If multiple distinct plants appear in frame, set "isMultiplePlantsDetected": true and populate "multiplePlantCandidates".
5. Provide accurate taxonomy, native region, light, water, soil, and propagation.
6. Check toxicity strictly for pets (dogs/cats) and humans.
7. If it is a mushroom, ALWAYS include safety warnings against consuming wild mushrooms.

Return ONLY a valid JSON object matching this schema:
{
  "isPlantOrganism": true,
  "id": "kebab-slug",
  "commonName": "Common Name",
  "scientificName": "Genus species",
  "family": "Family Name",
  "category": "Houseplant" | "Flower" | "Tree & Shrub" | "Herb & Vegetable" | "Succulent & Cactus" | "Medicinal Plant" | "Fern & Moss" | "Mushroom & Fungi" | "Wild & Weed" | "Aquatic Plant",
  "confidence": 95,
  "verifiedStatus": "botanically_verified" | "ai_estimated",
  "description": "2-3 concise informative sentences",
  "nativeRegion": "Native geographic origin",
  "distribution": "Worldwide distribution",
  "typicalSize": "e.g. 1-2 meters tall",
  "lifespan": "e.g. Perennial",
  "leafCharacteristics": "Leaf shape, margin, venation, texture",
  "floweringSeason": "Flowering timing",
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
  "ecologicalImportance": "Role in ecosystem or pollinators",
  "traditionalUses": [
    {
      "description": "Known cultural or traditional use",
      "evidenceLevel": "verified_scientific" | "traditional_folklore" | "unproven",
      "citation": "Optional scientific study or historical text"
    }
  ],
  "toxicity": {
    "isToxicToPets": true,
    "isToxicToHumans": false,
    "severity": "none" | "mild" | "moderate" | "severe" | "fatal_risk",
    "details": "Specific compounds and symptoms",
    "emergencyGuidance": "What to do if ingested"
  },
  "botanicalFacts": ["Botanical fact 1", "Botanical fact 2"],
  "safetyWarning": "Optional critical warning if mushroom or dangerously toxic",
  "alternativeCandidates": [
    {
      "commonName": "Alternative name",
      "scientificName": "Alternative species",
      "confidence": 20,
      "reason": "Why it might be confused"
    }
  ],
  "isMultiplePlantsDetected": false,
  "multiplePlantCandidates": []
}`;

        // Execute with timeout safeguard
        const result = await withTimeout(
          model.generateContent([
            prompt,
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
          ]),
          25000,
          'Gemini Plant Vision'
        );

        const responseText = result.response.text().trim();
        const cleanedJson = responseText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```$/i, '')
          .trim();

        const parsed = JSON.parse(cleanedJson);

        return NextResponse.json(
          {
            species: {
              ...parsed,
              imageUrl: image,
              isPlantOrganism: parsed.isPlantOrganism !== false,
              isDemoMode: false,
            },
            isMultiplePlantsDetected: Boolean(parsed.isMultiplePlantsDetected),
            multiplePlantCandidates: parsed.multiplePlantCandidates || [],
            isDemoMode: false,
          },
          {
            headers: {
              'X-RateLimit-Limit': String(rateLimit.limit),
              'X-RateLimit-Remaining': String(rateLimit.remaining),
            },
          }
        );
      } catch (geminiError: unknown) {
        const sanitizedMsg = sanitizeErrorMessage(geminiError);
        console.error('Gemini vision API error:', sanitizedMsg);

        // DO NOT fake results or fall through silently to hardcoded demo data when live AI was requested
        return NextResponse.json(
          {
            error: `AI Vision analysis failed: ${sanitizedMsg}. Please check your connection or API key and retry.`,
            isDemoMode: false,
            retryable: true,
          },
          { status: 502 }
        );
      }
    }

    // 6. DEMONSTRATION MODE (No API Key Configured)
    // Clearly differentiate reference specimens from arbitrary custom images
    const nameAndUrl = (
      (imageName ? String(imageName) : '') +
      ' ' +
      (image.startsWith('http') ? image : '')
    ).toLowerCase();

    const identifier = (nameAndUrl + ' ' + (intention ? String(intention) : '')).toLowerCase();

    const isExplicitNonPlant =
      nameAndUrl.includes('unrelated') ||
      nameAndUrl.includes('non_plant') ||
      nameAndUrl.includes('nonplant') ||
      /\b(car|vehicle|automobile|laptop|chair|furniture)\b/.test(nameAndUrl);

    if (isExplicitNonPlant) {
      return NextResponse.json({
        species: {
          id: 'non-plant-detected',
          commonName: 'No Plant Organism Detected',
          scientificName: 'Non-botanical subject',
          family: 'N/A',
          category: 'Wild & Weed',
          confidence: 0,
          verifiedStatus: 'ai_estimated',
          imageUrl: image,
          description:
            'The uploaded image contains an object, vehicle, furniture, or non-botanical subject. PlantLens AI requires a photo of foliage, flowers, bark, stems, or fungi.',
          nativeRegion: 'N/A',
          distribution: 'N/A',
          typicalSize: 'N/A',
          lifespan: 'N/A',
          leafCharacteristics: 'No plant leaves detected in frame',
          floweringSeason: 'N/A',
          growingConditions: {
            sunlight: 'Bright Indirect',
            sunlightDetails: 'N/A',
            water: 'Low',
            waterDetails: 'N/A',
            soil: 'N/A',
            humidity: 'N/A',
            temperature: 'N/A',
          },
          propagationMethods: [],
          ecologicalImportance: 'N/A',
          traditionalUses: [],
          toxicity: {
            isToxicToPets: false,
            isToxicToHumans: false,
            severity: 'none',
            details: 'N/A',
          },
          botanicalFacts: [
            'For best results, photograph leaves, flowers, or fruit in clear daylight.',
            'Ensure the plant occupies at least 50% of the viewfinder.',
          ],
          isPlantOrganism: false,
          nonPlantDetectedReason:
            'The uploaded photograph appears to be an everyday object or vehicle rather than a botanical specimen.',
          isDemoMode: true,
        },
        isMultiplePlantsDetected: false,
        multiplePlantCandidates: [],
        isDemoMode: true,
        demoNote:
          'Running in demonstration mode. Provide GEMINI_API_KEY in server environment for live visual recognition on custom photos.',
      });
    }

    // Match against known reference specimens
    let matched: PlantSpecies = BOTANICAL_DATABASE[0];
    let isDirectSampleMatch = false;

    if (identifier.includes('damascena') || identifier.includes('rose') || identifier.includes('flower') || identifier.includes('518709268805')) {
      matched = BOTANICAL_DATABASE.find((p) => p.id === 'rosa-damascena') || matched;
      isDirectSampleMatch = true;
    } else if (identifier.includes('tomato') || identifier.includes('vegetable') || identifier.includes('592841200221')) {
      matched = BOTANICAL_DATABASE.find((p) => p.id === 'solanum-lycopersicum') || matched;
      isDirectSampleMatch = true;
    } else if (identifier.includes('sunflower') || identifier.includes('597848212624')) {
      matched = BOTANICAL_DATABASE.find((p) => p.id === 'helianthus-annuus') || matched;
      isDirectSampleMatch = true;
    } else if (identifier.includes('mango') || identifier.includes('tree') || identifier.includes('553279768805')) {
      matched = BOTANICAL_DATABASE.find((p) => p.id === 'mangifera-indica') || matched;
      isDirectSampleMatch = true;
    } else if (identifier.includes('mushroom') || identifier.includes('agaric') || identifier.includes('544376798')) {
      matched = BOTANICAL_DATABASE.find((p) => p.id === 'amanita-muscaria') || matched;
      isDirectSampleMatch = true;
    } else if (identifier.includes('monstera') || identifier.includes('614594975525')) {
      matched = BOTANICAL_DATABASE.find((p) => p.id === 'monstera-deliciosa') || matched;
      isDirectSampleMatch = true;
    } else if (identifier.includes('tulsi') || identifier.includes('basil') || identifier.includes('618164436241')) {
      matched = BOTANICAL_DATABASE.find((p) => p.id === 'ocimum-tenuiflorum') || matched;
      isDirectSampleMatch = true;
    } else if (identifier.includes('sansevieria') || identifier.includes('snake') || identifier.includes('593482892290')) {
      matched = BOTANICAL_DATABASE.find((p) => p.id === 'sansevieria-trifasciata') || matched;
      isDirectSampleMatch = true;
    }

    return NextResponse.json({
      species: {
        ...matched,
        imageUrl: image,
        isPlantOrganism: true,
        isDemoMode: true,
      },
      isMultiplePlantsDetected: false,
      multiplePlantCandidates: [],
      isDemoMode: true,
      demoNote: isDirectSampleMatch
        ? `Matched reference specimen (${matched.commonName}) from botanical catalog in Demo Mode.`
        : 'Running in demonstration mode: no GEMINI_API_KEY detected. Connect a Gemini API key in Settings or server environment for live visual analysis.',
    });
  } catch (error: unknown) {
    const errorMsg = sanitizeErrorMessage(error);
    console.error('Error in identify route:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
