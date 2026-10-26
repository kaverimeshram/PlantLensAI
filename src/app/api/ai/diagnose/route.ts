import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, symptoms, answers, additionalImages, userApiKey } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image is required for diagnosis' }, { status: 400 });
    }

    const apiKey = userApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey && apiKey.length > 10) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        let mimeType = 'image/jpeg';
        let base64Data = image;

        if (image.includes(';base64,')) {
          const parts = image.split(';base64,');
          mimeType = parts[0].replace('data:', '');
          base64Data = parts[1];
        }

        const symptomsText = symptoms && symptoms.length > 0
          ? `User observed symptoms: ${symptoms.join(', ')}.`
          : 'User did not specify symptoms; analyze visually.';

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
  "disclaimer": "Visual AI diagnosis is an advisory tool. Soil pathogens, viral infections, and microclimates may require local physical laboratory testing."
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
          },
          isDemoMode: false,
        });
      } catch (geminiError: any) {
        console.warn('Gemini diagnose error, falling back to simulated diagnosis:', geminiError?.message || geminiError);
      }
    }

    // High quality demo fallback
    const isOverwater = (answers && (answers['water_frequency']?.includes('Every day') || answers['soil_state']?.includes('Soggy')));
    const symptomList = symptoms && symptoms.length > 0 ? symptoms : ['Yellowing foliage on lower nodes', 'Dry leaf edges'];

    return NextResponse.json({
      diagnosis: {
        id: 'diag-' + Date.now(),
        scanDate: new Date().toISOString().split('T')[0],
        overallHealth: isOverwater ? 'moderate_issue' : 'mild_stress',
        healthScore: isOverwater ? 65 : 80,
        plantIdentification: {
          commonName: 'Foliage Plant (Pothos / Philodendron / Aroid)',
          scientificName: 'Epipremnum / Philodendron sp.',
        },
        observedSymptoms: symptomList,
        possibleCauses: [
          {
            cause: isOverwater ? 'Root Hypoxia / Overwatering Stress' : 'Subtle Moisture Inconsistency & Dry Air Stress',
            likelihood: 78,
            description: isOverwater
              ? 'Soil stays saturated for too long, depriving delicate root hairs of oxygen and triggering lower leaf chlorosis.'
              : 'Fluctuating moisture intervals combined with low ambient humidity cause premature cellular collapse in leaf tips.',
            visualEvidence: 'Pale yellowing starting on oldest leaves while main veins remain faintly green, with slight tip necrosis.',
          },
          {
            cause: 'Nitrogen Deficiency (Chlorosis)',
            likelihood: 38,
            description: 'Mobile nitrogen is mobilized from older foliage to support new apical growth when potting nutrients are depleted.',
            visualEvidence: 'Gradual loss of rich emerald green across basal leaves.',
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
        imageUrl: image,
        disclaimer: 'Visual AI assessments are diagnostic guides. Soil conditions, microclimates, and root health may affect outcomes.',
      },
      isDemoMode: true,
      demoNote: 'Running in demonstration mode. Add a GEMINI_API_KEY in environment variables for live multimodal vision diagnostics.',
    });
  } catch (err: any) {
    console.error('Error in diagnose route:', err);
    return NextResponse.json({ error: err?.message || 'Failed to diagnose plant' }, { status: 500 });
  }
}
