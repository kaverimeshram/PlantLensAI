import { NextRequest } from 'next/server';

// 1. In-memory Sliding Window Rate Limiter
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 25; // 25 requests per minute per IP

export function checkRateLimit(req: NextRequest): {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
} {
  // Extract client IP address
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : realIp || '127.0.0.1';

  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  // Clean up old entries periodically
  if (rateLimitStore.size > 2000) {
    for (const [key, val] of rateLimitStore.entries()) {
      if (now > val.resetAt) rateLimitStore.delete(key);
    }
  }

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return {
      allowed: true,
      limit: MAX_REQUESTS_PER_WINDOW,
      remaining: MAX_REQUESTS_PER_WINDOW - 1,
      resetSeconds: Math.ceil(WINDOW_MS / 1000),
    };
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      limit: MAX_REQUESTS_PER_WINDOW,
      remaining: 0,
      resetSeconds: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count += 1;
  return {
    allowed: true,
    limit: MAX_REQUESTS_PER_WINDOW,
    remaining: MAX_REQUESTS_PER_WINDOW - entry.count,
    resetSeconds: Math.ceil((entry.resetAt - now) / 1000),
  };
}

// 2. Validate Image Input & Payload Size
const MAX_PAYLOAD_BYTES = 15 * 1024 * 1024; // 15MB max
const ALLOWED_MIME_PREFIXES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/gif',
];

export function validateImageInput(image: unknown): {
  valid: boolean;
  error?: string;
  statusCode?: number;
} {
  if (!image || typeof image !== 'string' || image.trim().length === 0) {
    return { valid: false, error: 'Image data is required', statusCode: 400 };
  }

  // Check payload length (approximate decoded bytes in base64)
  const estimatedBytes = (image.length * 3) / 4;
  if (estimatedBytes > MAX_PAYLOAD_BYTES) {
    return {
      valid: false,
      error: 'Image payload exceeds the maximum 15MB limit.',
      statusCode: 413,
    };
  }

  // If data URL, check mime type
  if (image.startsWith('data:')) {
    const mimeMatch = image.match(/^data:([^;]+);base64,/);
    if (!mimeMatch) {
      return {
        valid: false,
        error: 'Invalid data URL format. Expected data:image/*;base64,...',
        statusCode: 400,
      };
    }

    const mime = mimeMatch[1].toLowerCase();
    const isAllowed = ALLOWED_MIME_PREFIXES.some((allowed) => mime.startsWith(allowed));
    if (!isAllowed) {
      return {
        valid: false,
        error: `Unsupported image format (${mime}). Allowed formats: JPEG, PNG, WebP, HEIC.`,
        statusCode: 415,
      };
    }
  }

  return { valid: true };
}

// 3. Timeout Wrapper for Gemini API Calls
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 25000,
  operationName: string = 'AI service'
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${operationName} request timed out after ${Math.round(timeoutMs / 1000)} seconds`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer!);
    return result;
  } catch (error) {
    clearTimeout(timer!);
    throw error;
  }
}
