import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper to convert remote URL or data URL to clean base64 & mimeType
async function resolveImageBase64(imageStr: string): Promise<{ base64Data: string; mimeType: string }> {
  if (imageStr.startsWith('data:')) {
    const parts = imageStr.split(';base64,');
    const mimeType = parts[0].replace('data:', '') || 'image/jpeg';
    const base64Data = parts[1] || '';
    return { base64Data, mimeType };
  }

  if (imageStr.startsWith('http://') || imageStr.startsWith('https://')) {
    const res = await fetch(imageStr);
    if (!res.ok) {
      throw new Error(`Failed to fetch image from URL: ${res.statusText}`);
    }
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await res.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    return { base64Data, mimeType: contentType };
  }

  return { base64Data: imageStr, mimeType: 'image/jpeg' };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, symptoms, answers, userApiKey } = body;

    if (!image || typeof image !== 'string' || image.trim().length === 0) {
      return NextResponse.json({ error: 'Image is required for diagnosis' }, { status: 400 });
    }

    const apiKey = userApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey && apiKey.length > 10) {
      try {
        const { base64Data, mimeType } = await resolveImageBase64(image);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const symptomsText = symptoms && symptoms.length > 0
          ? `User observed symptoms: ${symptoms.join(', ')}.`
          : 'User did not pre-select symptoms; analyze visually from the image.';

        const answersText = answers && Object.keys(answers).length > 0
          ? `User care context: ${JSON.stringify(answers)}.`
          : 'Standard triage context.';

        const prompt = `You are PlantLens AI Plant Doctor, a licensed plant pathologist and master horticulturist.
Examine this photograph of an unhealthy or symptomatic plant.
${symptomsText}
${answersText}

Analyze visible symptoms (chlorosis/yellowing, brown tips, wilting, leaf spots, holes/chewed margins, powdery mildew, mold, stunted growth, curling, stem/root rot, pests).
Identify:
1. Overall visual health: "healthy" | "mild_stress" | "moderate_issue" | "critical"
2. Health score (0-100, where 100 is pristine)
3. Observed symptoms list
4. Possible causes ranked by likelihood % with visual evidence supporting each
5. Actionable treatment plan: immediate actions, watering adjustments, light/temp adjustments, soil/drainage recommendations, organic pest management, fertilizer advice (with safety precautions against fertilizer burn), prevention tips, follow-up schedule
6. 2-3 relevant follow-up questions to refine the diagnosis if needed
7. If the evidence in the photo is blurry, partial, or insufficient to reach a certain diagnosis, set "insufficientEvidence": true, provide an "insufficientEvidenceReason", and list 2-4 specific items in "neededInformation" (e.g. close-up of leaf undersides, photo of pot drainage holes, check soil 2 inches down).

Return ONLY a valid JSON object matching this schema (do NOT wrap in markdown backticks, just raw JSON):
{
  "id": "diag-generated",
  "scanDate": "${new Date().toISOString().split('T')[0]}",
  "overallHealth": "mild_stress" | "moderate_issue" | "critical" | "healthy",
  "healthScore": 75,
  "plantIdentification": {
    "commonName": "Likely Plant Name",
    "scientificName": "Scientific name"
  },
  "observedSymptoms": ["Yellowing lower leaves", "Brown leaf tips"],
  "possibleCauses": [
    {
      "cause": "Primary cause (e.g. Overwatering & Poor Aeration)",
      "likelihood": 80,
      "description": "Clear explanation of the pathological or physiological mechanism",
      "visualEvidence": "Exact visual cues seen in the image"
    },
    {
      "cause": "Secondary differential cause",
      "likelihood": 35,
      "description": "Why this could also explain some symptoms",
      "visualEvidence": "Supporting visual detail"
    }
  ],
  "treatmentPlan": {
    "immediateActions": ["Action 1", "Action 2"],
    "wateringAdjustments": "Specific watering instructions",
    "lightTempAdjustments": "Light and climate adjustments",
    "soilDrainageRecommendations": "Soil and pot instructions",
    "pestManagement": "Organic pest treatment if applicable, or preventive hygiene",
    "fertilizerAdvice": "Careful fertilization guidance, avoiding over-feeding stressed plants",
    "preventionTips": ["Prevention 1", "Prevention 2"],
    "followUpSchedule": "When and how to re-check"
  },
  "followUpQuestions": [
    {
      "id": "q1",
      "question": "Diagnostic question for the user",
      "options": ["Option A", "Option B", "Option C"]
    }
  ],
  "insufficientEvidence": false,
  "insufficientEvidenceReason": "",
  "neededInformation": [],
  "disclaimer": "Visual AI diagnosis is an advisory tool. Soil pathogens, viral infections, and microclimates may require physical laboratory testing."
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
        const cleanedJson = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleanedJson);

        return NextResponse.json({
          diagnosis: {
            ...parsed,
            imageUrl: image,
            isDemoMode: false,
          },
          isDemoMode: false,
        });
      } catch (geminiError: unknown) {
        const errorMsg = geminiError instanceof Error ? geminiError.message : String(geminiError);
        console.warn('Gemini diagnose error, falling back to simulated diagnosis:', errorMsg);
      }
    }

    // High quality demo fallback
    const isOverwater = (answers && (answers['water_frequency']?.includes('Every day') || answers['soil_state']?.includes('Soggy')));
    const hasYellowing = symptoms && symptoms.some((s: string) => s.toLowerCase().includes('yellow'));
    const isMildew = image.includes('518709268805') || (symptoms && symptoms.some((s: string) => s.toLowerCase().includes('mildew')));
    const isSpot = image.includes('592841200221') || (symptoms && symptoms.some((s: string) => s.toLowerCase().includes('spot')));

    let primaryCause = isOverwater ? 'Root Hypoxia / Overwatering Stress' : 'Subtle Moisture Inconsistency & Dry Air Stress';
    let primaryDesc = isOverwater
      ? 'Soil stays saturated for too long, depriving delicate root hairs of oxygen and triggering lower leaf chlorosis.'
      : 'Fluctuating moisture intervals combined with low ambient humidity cause premature cellular collapse in leaf tips.';
    let visualEvidence = 'Pale yellowing starting on oldest leaves while main veins remain faintly green, with slight tip necrosis.';
    let healthScore = isOverwater ? 65 : 78;
    let symptomsList = symptoms && symptoms.length > 0 ? symptoms : ['Yellowing foliage on lower nodes', 'Dry leaf edges'];

    if (isMildew) {
      primaryCause = 'Powdery Mildew Fungal Infection (*Podosphaera / Erysiphales*)';
      primaryDesc = 'Airborne fungal spores germinate on foliage during periods of high ambient humidity and low air circulation, spreading a white powdery mycelial layer.';
      visualEvidence = 'Superficial white powdery talc-like patches on upper leaf surfaces and petioles.';
      healthScore = 62;
      symptomsList = ['White Powdery Substance', 'Curling or Cupping Leaves'];
    } else if (isSpot) {
      primaryCause = 'Early Leaf Spot / Septoria Fungus (*Septoria lycopersici*)';
      primaryDesc = 'Fungal water-borne spores splash onto lower foliage from soil, causing circular necrotic lesions that spread upwards.';
      visualEvidence = 'Circular brown spots with dark concentric margins and yellow halos on lower leaves.';
      healthScore = 58;
      symptomsList = ['Dark / Water-soaked Spots', 'Yellowing Leaves'];
    } else if (hasYellowing) {
      primaryCause = 'Chlorosis from Root Suffocation / Moisture Excess';
      primaryDesc = 'Roots submerged in waterlogged potting medium cannot take up oxygen or iron, leading to breakdown of chloroplasts in older basal foliage.';
      visualEvidence = 'Pronounced uniform yellowing across basal leaves while apical growth remains green.';
      healthScore = 70;
    }

    return NextResponse.json({
      diagnosis: {
        id: 'diag-' + Date.now(),
        scanDate: new Date().toISOString().split('T')[0],
        overallHealth: healthScore >= 80 ? 'healthy' : healthScore >= 65 ? 'mild_stress' : 'moderate_issue',
        healthScore,
        plantIdentification: {
          commonName: isSpot ? 'Tomato Plant' : isMildew ? 'Rose Plant' : 'Indoor Foliage Plant (Pothos / Aroid)',
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
            description: 'Mobile nitrogen is mobilized from older foliage to support new apical growth when potting nutrients are depleted.',
            visualEvidence: 'Gradual loss of rich emerald green across basal leaves.',
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
            'Check pot drainage holes to ensure water is not pooled in the decorative outer pot or saucer.',
            'Prune fully yellowed, dying leaves using sterile shears to redirect plant energy toward root recovery.',
            'Withhold additional water until the top 2 inches (5 cm) of soil dry out completely.',
          ],
          wateringAdjustments: 'Water thoroughly only when the top half of the potting soil feels dry. Discard excess drained water after 15 minutes.',
          lightTempAdjustments: 'Move to a position receiving bright, indirect sunlight. Keep away from cold drafts and direct air conditioner vents.',
          soilDrainageRecommendations: 'If soil is heavy and dense, consider aerating with a wooden chopstick or repotting into a well-draining mix containing perlite and orchid bark.',
          pestManagement: 'Wipe both sides of leaves with a damp cloth; check leaf undersides for fine webbing (spider mites) or tiny white specs.',
          fertilizerAdvice: 'Never fertilize an actively stressed plant. Wait until new healthy leaves emerge before applying diluted balanced organic fertilizer.',
          preventionTips: [
            'Always check soil moisture with your finger or a probe before watering.',
            'Ensure all pots have bottom drainage holes.',
            'Rotate plant 90 degrees every two weeks for balanced light distribution.',
          ],
          followUpSchedule: 'Re-evaluate leaf firmness and soil moisture in 7 days.',
        },
        followUpQuestions: [
          {
            id: 'soil_moisture',
            question: 'How does the soil feel 2 inches below the surface right now?',
            options: ['Bone dry and crumbly', 'Slightly cool and damp', 'Soggy / muddy waterlogged'],
          },
          {
            id: 'pot_drainage',
            question: 'Does your planter have drainage holes at the bottom?',
            options: ['Yes, drains into a saucer', 'No drainage holes (sealed pot)', 'Unsure'],
          },
        ],
        insufficientEvidence: false,
        insufficientEvidenceReason: '',
        neededInformation: [
          'Close-up photo of leaf undersides to check for spider mites or scale insects',
          'Photo of root ball / drainage holes to assess root health',
        ],
        imageUrl: image,
        disclaimer: 'Visual AI assessments are diagnostic guides. Soil conditions, microclimates, and root health may affect outcomes.',
        isDemoMode: true,
      },
      isDemoMode: true,
      demoNote: 'Running in demonstration mode. Add a GEMINI_API_KEY in Settings for live multimodal vision diagnostics.',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to diagnose plant';
    console.error('Error in diagnose route:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
