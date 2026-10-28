import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey.trim().length > 10 && !apiKey.includes('your_gemini_api_key'));

  return NextResponse.json({
    isConfigured,
    mode: isConfigured ? 'live' : 'demo',
    model: 'gemini-1.5-flash',
    features: {
      liveVision: isConfigured,
      healthDiagnostics: isConfigured,
      botanistChat: isConfigured,
      maxUploadMB: 15,
      rateLimitPerMinute: 25,
    },
  });
}
