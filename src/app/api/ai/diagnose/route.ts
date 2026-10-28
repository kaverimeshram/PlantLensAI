import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
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
    // 1. Sliding window rate limiting per client IP (25 req/min)
    const rateLimit = checkRateLimit(req);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit reached. Please wait ${rateLimit.resetSeconds} seconds before requesting diagnosis.`,
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

    // 2. Parse and validate JSON request
    let body: {
      image?: string;
      symptoms?: string[];
      answers?: Record<string, string>;
      userApiKey?: string;
      imageName?: string;
    };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Malformed JSON request body.' }, { status: 400 });
    }

    const { image, symptoms, answers, userApiKey, imageName } = body;

    // 3. Validate image format, size (15MB), and SSRF constraints
    const validation = validateImageInput(image);
    if (!validation.valid || !image) {
      return NextResponse.json({ error: validation.error }, { status: validation.statusCode || 400 });
    }

    // 4. Resolve API key
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

        const symptomsText = symptoms && symptoms.length > 0
          ? `User observed symptoms: ${symptoms.join(', ')}.`
          : 'User did not pre-select symptoms; diagnose solely based on visible pathology in the image.';

        const answersText = answers && Object.keys(answers).length > 0
          ? `User care context: ${JSON.stringify(answers)}.`
          : 'Standard triage context.';

        const prompt = `You are PlantLens AI Plant Doctor, a licensed plant pathologist and horticultural diagnostician.
Examine this photograph carefully.

CRITICAL CHECK:
First, verify whether this photo depicts a plant, leaves, stem, flowers, or roots.
If the photo is NOT a botanical subject (e.g. it is a car, person, animal, gadget, furniture, or everyday object), you MUST return:
{
  "isPlantOrganism": false,
  "nonPlantDetectedReason": "The uploaded photograph does not contain plant foliage, stems, or roots. Plant Doctor requires an image of a symptomatic botanical specimen.",
  "id": "diag-invalid",
  "scanDate": "${new Date().toISOString().split('T')[0]}",
  "overallHealth": "critical",
  "healthScore": 0,
  "plantIdentification": { "commonName": "No Plant Detected", "scientificName": "N/A" },
  "observedSymptoms": ["Non-botanical subject"],
  "possibleCauses": [],
  "treatmentPlan": {
    "immediateActions": ["Please photograph the affected leaf, stem, or pot of your plant."],
    "wateringAdjustments": "N/A",
    "lightTempAdjustments": "N/A",
    "soilDrainageRecommendations": "N/A",
    "pestManagement": "N/A",
    "fertilizerAdvice": "N/A",
    "preventionTips": [],
    "followUpSchedule": "N/A"
  },
  "followUpQuestions": [],
  "insufficientEvidence": true,
  "insufficientEvidenceReason": "No plant organism was found in the image frame.",
  "neededInformation": ["Clear photograph of the symptomatic plant foliage in daylight"],
  "disclaimer": "Diagnostic triage requires an image of actual plant material."
}

If the image DOES depict a plant:
1. Identify the likely plant species or family.
2. Carefully inspect visible symptoms in the photo (chlorosis/yellowing, margin browning, wilting, leaf spots, powdery mildew, pest damage, root issues).
3. Evaluate user symptoms: ${symptomsText}
4. Care context: ${answersText}
5. Assign overallHealth: "healthy" | "mild_stress" | "moderate_issue" | "critical" and realistic healthScore (0-100).
6. Rank possible causes by likelihood %, providing specific visual evidence for each cause.
7. Provide a detailed, safe treatment plan with actionable steps, avoiding dangerous over-fertilization of stressed plants.
8. If evidence is ambiguous or incomplete, set "insufficientEvidence": true and detail "neededInformation".

Return ONLY a valid JSON object matching this schema:
{
  "isPlantOrganism": true,
  "id": "diag-id",
  "scanDate": "${new Date().toISOString().split('T')[0]}",
  "overallHealth": "healthy" | "mild_stress" | "moderate_issue" | "critical",
  "healthScore": 75,
  "plantIdentification": {
    "commonName": "Common Plant Name",
    "scientificName": "Genus species"
  },
  "observedSymptoms": ["Symptom 1", "Symptom 2"],
  "possibleCauses": [
    {
      "cause": "Primary cause (e.g. Moisture Stress / Root Hypoxia)",
      "likelihood": 80,
      "description": "Pathological or physiological mechanism",
      "visualEvidence": "Exact visual cues observed in this photo"
    },
    {
      "cause": "Secondary differential cause",
      "likelihood": 35,
      "description": "Why this is also considered",
      "visualEvidence": "Supporting visual detail"
    }
  ],
  "treatmentPlan": {
    "immediateActions": ["Action 1", "Action 2"],
    "wateringAdjustments": "Specific watering instructions",
    "lightTempAdjustments": "Lighting and microclimate guidance",
    "soilDrainageRecommendations": "Potting medium and aeration steps",
    "pestManagement": "Organic hygiene or pest protocol",
    "fertilizerAdvice": "Safe fertilization guidance (caution against burning stressed roots)",
    "preventionTips": ["Tip 1", "Tip 2"],
    "followUpSchedule": "When and what to check next"
  },
  "followUpQuestions": [
    {
      "id": "q1",
      "question": "Diagnostic question",
      "options": ["Option A", "Option B", "Option C"]
    }
  ],
  "insufficientEvidence": false,
  "insufficientEvidenceReason": "",
  "neededInformation": [],
  "disclaimer": "Visual AI diagnosis is an advisory diagnostic tool. Soil testing and laboratory assays may be required for complex microbial pathologies."
}`;

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
          'Gemini Plant Pathology'
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
            diagnosis: {
              ...parsed,
              imageUrl: image,
              isDemoMode: false,
            },
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
        console.error('Gemini diagnose API error:', sanitizedMsg);

        // DO NOT silently fall through to fake demo data when live diagnosis failed
        return NextResponse.json(
          {
            error: `Plant Doctor diagnostic analysis failed: ${sanitizedMsg}. Please check your connection or retry.`,
            isDemoMode: false,
            retryable: true,
          },
          { status: 502 }
        );
      }
    }

    // 6. DEMO MODE
    const identifier = (
      (imageName ? String(imageName) : '') +
      ' ' +
      (image.startsWith('http') ? image : '')
    ).toLowerCase();

    const isExplicitNonPlant =
      identifier.includes('unrelated') ||
      identifier.includes('non_plant') ||
      identifier.includes('nonplant') ||
      /\b(car|vehicle|automobile|laptop|chair|furniture)\b/.test(identifier);

    if (isExplicitNonPlant) {
      return NextResponse.json({
        diagnosis: {
          id: 'diag-nonplant',
          scanDate: new Date().toISOString().split('T')[0],
          overallHealth: 'critical',
          healthScore: 0,
          plantIdentification: {
            commonName: 'No Plant Detected',
            scientificName: 'Non-botanical subject',
          },
          observedSymptoms: ['Non-botanical object detected in frame'],
          possibleCauses: [],
          treatmentPlan: {
            immediateActions: [
              'The uploaded photo appears to be a vehicle or non-plant object.',
              'Please photograph plant foliage, stems, or leaves to diagnose plant health.',
            ],
            wateringAdjustments: 'N/A',
            lightTempAdjustments: 'N/A',
            soilDrainageRecommendations: 'N/A',
            pestManagement: 'N/A',
            fertilizerAdvice: 'N/A',
            preventionTips: ['Photograph in bright daylight with the leaf filling most of the camera view.'],
            followUpSchedule: 'N/A',
          },
          followUpQuestions: [],
          insufficientEvidence: true,
          insufficientEvidenceReason: 'The photograph contains a non-plant subject.',
          neededInformation: ['A clear photo of symptomatic plant leaves, stems, or roots'],
          imageUrl: image,
          disclaimer: 'Plant Doctor requires an image of botanical material.',
          isDemoMode: true,
          isPlantOrganism: false,
        },
        isDemoMode: true,
        demoNote: 'Running in demonstration mode: non-plant image rejected.',
      });
    }

    const isOverwater = Boolean(
      answers &&
        (answers['water_frequency']?.includes('Every day') ||
          answers['soil_state']?.includes('Soggy') ||
          answers['soil_state']?.includes('damp'))
    );
    const hasYellowing =
      identifier.includes('yellow') ||
      (symptoms && symptoms.some((s: string) => s.toLowerCase().includes('yellow')));
    const isMildew =
      image.includes('518709268805') ||
      identifier.includes('mildew') ||
      (symptoms && symptoms.some((s: string) => s.toLowerCase().includes('mildew')));
    const isSpot =
      image.includes('592841200221') ||
      identifier.includes('spot') ||
      (symptoms && symptoms.some((s: string) => s.toLowerCase().includes('spot')));

    let primaryCause = isOverwater
      ? 'Root Hypoxia / Overwatering Stress'
      : 'Subtle Moisture Inconsistency & Ambient Dry Air Stress';
    let primaryDesc = isOverwater
      ? 'Potting medium remains waterlogged, depriving roots of oxygen and triggering lower leaf chlorosis.'
      : 'Fluctuating moisture intervals combined with low ambient humidity cause cellular stress in delicate leaf tips.';
    let visualEvidence =
      'Pale chlorotic yellowing on basal leaves while main veins remain faintly green, with softened tissue.';
    let healthScore = isOverwater ? 65 : 78;
    let symptomsList =
      symptoms && symptoms.length > 0 ? symptoms : ['Yellowing foliage on lower nodes', 'Dry leaf edges'];

    if (isMildew) {
      primaryCause = 'Powdery Mildew Fungal Infection (*Podosphaera / Erysiphales*)';
      primaryDesc =
        'Airborne fungal spores germinate on foliage during periods of high humidity and low air circulation, forming a white powdery coating.';
      visualEvidence = 'Superficial white powdery talc-like patches on upper leaf surfaces and petioles.';
      healthScore = 62;
      symptomsList = ['White Powdery Substance', 'Curling or Cupping Leaves'];
    } else if (isSpot) {
      primaryCause = 'Early Leaf Spot / Septoria Fungus (*Septoria lycopersici*)';
      primaryDesc =
        'Fungal water-borne spores splash onto lower foliage from wet soil, causing circular necrotic lesions that spread upwards.';
      visualEvidence = 'Circular brown necrotic spots with dark concentric margins and yellow chlorotic halos.';
      healthScore = 58;
      symptomsList = ['Dark / Water-soaked Spots', 'Yellowing Leaves'];
    } else if (hasYellowing) {
      primaryCause = 'Chlorosis from Root Suffocation / Moisture Excess';
      primaryDesc =
        'Roots submerged in saturated potting medium cannot take up oxygen or iron, leading to breakdown of chloroplasts in older basal foliage.';
      visualEvidence = 'Pronounced uniform yellowing across basal leaves while apical growth remains green.';
      healthScore = 68;
    }

    return NextResponse.json({
      diagnosis: {
        id: 'diag-' + Date.now(),
        scanDate: new Date().toISOString().split('T')[0],
        overallHealth: healthScore >= 80 ? 'healthy' : healthScore >= 65 ? 'mild_stress' : 'moderate_issue',
        healthScore,
        plantIdentification: {
          commonName: isSpot ? 'Tomato Plant' : isMildew ? 'Rose Plant' : 'Indoor Houseplant (Aroid / Pothos)',
          scientificName: isSpot ? 'Solanum lycopersicum' : isMildew ? 'Rosa damascena' : 'Epipremnum aureum',
        },
        observedSymptoms: symptomsList,
        possibleCauses: [
          {
            cause: primaryCause,
            likelihood: 78,
            description: primaryDesc,
            visualEvidence,
          },
          {
            cause: 'Nitrogen Deficiency (Basal Leaf Chlorosis)',
            likelihood: 38,
            description: 'Mobile nitrogen is mobilized from older foliage to support new apical growth.',
            visualEvidence: 'Gradual loss of emerald green across basal leaves.',
          },
          {
            cause: 'Harsh UV Light Scorch or Heat Stress',
            likelihood: 22,
            description: 'Excessive direct midday sunlight bleaching chloroplasts on exposed upper foliage.',
            visualEvidence: 'Crispy dry parchment patches on light-facing leaves.',
          },
        ],
        treatmentPlan: {
          immediateActions: [
            'Check pot drainage holes to ensure water is not pooled in the decorative saucer.',
            'Prune fully yellowed, dying leaves using sterile shears to redirect plant energy toward root recovery.',
            'Withhold additional water until the top 2 inches (5 cm) of soil dry out completely.',
          ],
          wateringAdjustments:
            'Water thoroughly only when the top half of the potting soil feels dry. Discard excess drained water after 15 minutes.',
          lightTempAdjustments:
            'Move to a position receiving bright, indirect sunlight. Keep away from cold drafts and direct air conditioner vents.',
          soilDrainageRecommendations:
            'If soil is heavy and dense, aerate with a clean wooden chopstick or repot into an airy mix containing perlite and orchid bark.',
          pestManagement:
            'Wipe both sides of leaves with a damp microfiber cloth; check leaf undersides for fine webbing (spider mites) or scale.',
          fertilizerAdvice:
            'Never fertilize an actively stressed plant. Wait until new healthy leaves emerge before applying diluted balanced organic fertilizer.',
          preventionTips: [
            'Always check soil moisture depth before watering.',
            'Ensure the planter pot has functional drainage holes.',
          ],
          followUpSchedule: 'Re-inspect leaf firmness and soil moisture in 7 days.',
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
        insufficientEvidence: false,
        insufficientEvidenceReason: '',
        neededInformation: ['Close-up photo of leaf undersides', 'Photo of pot drainage holes'],
        imageUrl: image,
        disclaimer:
          'Visual AI health assessments are diagnostic aids. Environmental microclimates and soil microbiology affect actual outcomes.',
        isDemoMode: true,
      },
      isDemoMode: true,
      demoNote:
        'Running in demonstration mode: no GEMINI_API_KEY detected. Connect an API key in Settings or server environment for live visual diagnostics.',
    });
  } catch (error: unknown) {
    const errorMsg = sanitizeErrorMessage(error);
    console.error('Error in diagnose route:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
