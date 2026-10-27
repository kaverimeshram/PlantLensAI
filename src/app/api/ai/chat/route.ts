import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiChatMessage } from '@/types/plant';
import { checkRateLimit, withTimeout } from '@/lib/serverSecurity';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimit = checkRateLimit(req);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many questions in a short period. Please wait ${rateLimit.resetSeconds}s before asking again.` },
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

    const body = await req.json();
    const { messages, plantContext, userApiKey } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Conversation messages are required' }, { status: 400 });
    }

    const apiKey = userApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey && apiKey.length > 10) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const plantContextStr = plantContext
          ? `Current Plant Context: Name: ${plantContext.name}, Scientific: ${plantContext.scientificName || 'Unknown'}, Details: ${plantContext.details || ''}.`
          : 'No specific plant currently selected.';

        const conversationHistory = (messages || [])
          .map((m: AiChatMessage) => `${m.role.toUpperCase()}: ${m.content}`)
          .join('\n');

        const systemPrompt = `You are PlantLens AI Botanist, an expert botanical scientist, plant pathologist, and experienced horticultural advisor.
${plantContextStr}

Answer the user's question clearly, thoroughly, and scientifically.
Guidelines:
- Provide specific, actionable steps (watering, soil mix, light, humidity, pruning, propagation).
- If the user asks about growing in specific regions (e.g. Maharashtra, India, California, UK), provide localized climate advice taking into account monsoon/summer/winter seasons.
- Clearly state whether a plant or part is toxic to dogs, cats, or humans when relevant.
- If discussing wild mushrooms, emphasize safety and never advise eating wild-foraged mushrooms from photo identification alone.
- Distinguish scientifically verified botanical evidence from traditional folklore.
- Use clean Markdown with bullet points, bold headings, and concise paragraphs.

Conversation:
${conversationHistory}
ASSISTANT:`;

        const result = await withTimeout(
          model.generateContent(systemPrompt),
          20000,
          'Gemini Plant Assistant'
        );
        const reply = result.response.text();

        return NextResponse.json(
          {
            reply,
            isDemoMode: false,
          },
          {
            headers: {
              'X-RateLimit-Limit': String(rateLimit.limit),
              'X-RateLimit-Remaining': String(rateLimit.remaining),
            },
          }
        );
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn('Gemini chat error, falling back to simulated reply:', errorMsg);
      }
    }

    // High quality demo fallback
    const lastUserMsg = messages && messages.length > 0 ? messages[messages.length - 1]?.content || '' : '';
    const q = lastUserMsg.toLowerCase();
    const plantName = plantContext?.name || 'this plant';
    const sciName = plantContext?.scientificName ? ` (*${plantContext.scientificName}*)` : '';

    let reply = `**PlantLens Botanical Care:**\n\nRegarding **${plantName}**${sciName}:\n\n` +
      `- **Lighting**: Ensure it receives adequate light matching its natural canopy environment (bright indirect light is ideal for most indoor foliage, while flowering plants and herbs require 4–6 hours of direct sun).\n` +
      `- **Watering Principle**: Check the top 1–2 inches of soil with your fingertip. Only water when the upper layer feels dry.\n` +
      `- **Soil Aeration**: Good root drainage is paramount—never allow stagnant water to pool in outer saucers.`;

    if (q.includes('yellow') || q.includes('leaf') || q.includes('curling') || q.includes('brown')) {
      reply = `For **${plantName}**${sciName}, yellowing leaves typically indicate:\n\n` +
        `1. **Overwatering & Poor Aeration** (Most Common): Roots submerged in wet soil lack oxygen, causing lower leaves to turn limp yellow and drop.\n` +
        `2. **Natural Leaf Senescence**: Older leaves near the bottom naturally turn yellow and shed as the plant matures and transfers mobile nitrogen to new crowns.\n` +
        `3. **Light Inadequacy**: If tucked into a dim corner, lower leaves can't photosynthesize efficiently and are abandoned by the plant.\n\n` +
        `**Recommended Action**: Probe the soil 2 inches deep. If wet, let it dry out completely before watering again, and trim fully yellowed leaves with sterilized shears.`;
    } else if (q.includes('water') || q.includes('how often')) {
      reply = `**Watering Protocol for ${plantName}**${sciName}:\n\n` +
        `- **The Finger Test**: Never water on a fixed calendar timer! Insert your finger 2 inches into the medium. If it feels cool and moist, hold off.\n` +
        `- **Drench & Drain**: When dry, water thoroughly until liquid drains out the bottom holes. Empty the runoff tray after 15 minutes.\n` +
        `- **Seasonal Shift**: Active growing months (Spring/Summer/Monsoon) require more frequent hydration than dormant cool winter months.`;
    } else if (q.includes('maharashtra') || q.includes('india') || q.includes('climate') || q.includes('grow')) {
      reply = `**Growing ${plantName} in Maharashtra / India:**\n\n` +
        `- **Monsoon (June–September)**: Fast vegetative growth! However, excessive rainfall can cause fungal root rot in balcony pots. Ensure pots have ample drainage holes and gritty perlite/sand.\n` +
        `- **Summer (March–May)**: Temperatures frequently exceed 38°C in Pune, Nagpur, and interior Maharashtra. Move foliage plants out of direct afternoon glare and maintain high ambient humidity.\n` +
        `- **Winter (November–February)**: Mild, golden sunshine. Excellent season for moderate watering and gentle organic vermicompost feeding.\n\n` +
        `Tropical houseplants (Pothos, Monstera, Snake Plant, Tulsi, Mango) thrive naturally in Maharashtra's warm conditions!`;
    } else if (q.includes('cat') || q.includes('dog') || q.includes('pet') || q.includes('toxic') || q.includes('poison')) {
      reply = `**Toxicity & Safety Profile for ${plantName}:**\n\n` +
        `- **Aroids (Pothos, Monstera, Philodendron, ZZ)**: Contain microscopic **calcium oxalate needles**. Chewing causes intense oral pain, drooling, tongue swelling, and gastrointestinal upset in dogs and cats.\n` +
        `- **Safe Alternatives**: Tulsi, Damask Rose, Sunflowers, Boston Ferns, and Spider Plants are completely **non-toxic and pet-safe**!\n` +
        `- **Emergency Action**: If your pet shows severe salivation, lip swelling, or lethargy after chewing a plant, rinse their mouth with water and call a veterinarian immediately.`;
    } else if (q.includes('propagate') || q.includes('cutting')) {
      reply = `**Propagation Steps for ${plantName}**${sciName}:\n\n` +
        `1. **Find a Node**: Select a vigorous stem with healthy leaves and a noticeable node (small bump or aerial root).\n` +
        `2. **Clean Cut**: Using sterilized pruning shears, cut 1/4 inch below the node.\n` +
        `3. **Water Rooting**: Submerge the node in a clear glass of dechlorinated water, keeping foliage above the waterline.\n` +
        `4. **Sunlight & Care**: Place in bright indirect light. Refresh water every 4–5 days to prevent bacterial stagnation.\n` +
        `5. **Potting**: When roots are 2 inches long, transfer to a light, airy potting mix!`;
    }

    return NextResponse.json({
      reply,
      isDemoMode: true,
      demoNote: 'Running in demonstration mode. Connect a GEMINI_API_KEY in Settings for dynamic generative AI conversations.',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to process chat';
    console.error('Error in chat route:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
