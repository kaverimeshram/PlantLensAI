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
  // Extract client IP address safely
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

// 2. SSRF Protection & Remote URL Validator
const ALLOWED_REMOTE_HOSTS = new Set([
  'images.unsplash.com',
  'plus.unsplash.com',
  'upload.wikimedia.org',
]);

export function validateSafeRemoteUrl(urlStr: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(urlStr);

    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only secure HTTPS remote image URLs are permitted.' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block local loopback, private RFC-1918 / RFC-4193 addresses, link-local metadata endpoints
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname === '169.254.169.254' ||
      hostname.startsWith('169.254.') ||
      hostname === '0.0.0.0' ||
      hostname === '[::1]' ||
      hostname === '::1'
    ) {
      return {
        valid: false,
        error: 'Access to private or local network resources is strictly prohibited.',
      };
    }

    // Check against authorized host whitelist
    if (!ALLOWED_REMOTE_HOSTS.has(hostname)) {
      return {
        valid: false,
        error: `Remote image domain (${hostname}) is not permitted. Please upload the image file directly.`,
      };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Malformed image URL provided.' };
  }
}

// 3. Validate Image Input & Payload Size
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

  const trimmed = image.trim();

  // If remote URL, enforce SSRF guard
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const urlValidation = validateSafeRemoteUrl(trimmed);
    if (!urlValidation.valid) {
      return { valid: false, error: urlValidation.error, statusCode: 400 };
    }
    return { valid: true };
  }

  // Check payload length (approximate decoded bytes in base64)
  const estimatedBytes = (trimmed.length * 3) / 4;
  if (estimatedBytes > MAX_PAYLOAD_BYTES) {
    return {
      valid: false,
      error: 'Image payload exceeds the maximum 15MB limit.',
      statusCode: 413,
    };
  }

  // If data URL, check mime type and base64 format
  if (trimmed.startsWith('data:')) {
    const mimeMatch = trimmed.match(/^data:([^;]+);base64,([\s\S]+)$/);
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

    // Verify base64 content is non-empty and contains valid characters
    const base64Data = mimeMatch[2].trim();
    if (base64Data.length < 32) {
      return {
        valid: false,
        error: 'Image data payload is truncated or empty.',
        statusCode: 400,
      };
    }

    // Verify it doesn't contain plain HTML or non-base64 characters
    if (/^<(!DOCTYPE|html)/i.test(base64Data) || !/^[A-Za-z0-9+/=_\s-]+$/.test(base64Data)) {
      return {
        valid: false,
        error: 'Image contains invalid or corrupt base64 payload.',
        statusCode: 400,
      };
    }
  } else {
    // Raw string check - must be valid base64 character set without spaces or punctuation
    const isBase64 = /^[A-Za-z0-9+/=\r\n]+$/.test(trimmed) && trimmed.length >= 64;
    if (!isBase64) {
      return {
        valid: false,
        error: 'Provided input does not appear to be valid base64 image data.',
        statusCode: 400,
      };
    }
  }

  return { valid: true };
}

// 4. Safe image resolver (converts data URL or whitelisted remote URL to base64 & MIME)
export async function safeResolveImageBase64(
  imageStr: string
): Promise<{ base64Data: string; mimeType: string }> {
  if (imageStr.startsWith('data:')) {
    const parts = imageStr.split(';base64,');
    const mimeType = parts[0].replace('data:', '') || 'image/jpeg';
    const base64Data = (parts[1] || '').trim();
    return { base64Data, mimeType };
  }

  if (imageStr.startsWith('https://')) {
    const urlValidation = validateSafeRemoteUrl(imageStr);
    if (!urlValidation.valid) {
      throw new Error(urlValidation.error || 'Untrusted remote image URL');
    }

    const res = await withTimeout(
      fetch(imageStr, {
        headers: {
          'User-Agent': 'PlantLensAI-BotanicalBot/1.0 (https://plantlens.ai)',
          Accept: 'image/jpeg,image/png,image/webp,image/*;q=0.8',
        },
      }),
      10000,
      'Remote image download'
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch remote image: HTTP ${res.status} ${res.statusText}`);
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!contentType.toLowerCase().startsWith('image/')) {
      throw new Error(`Remote resource is not an image (content-type: ${contentType})`);
    }

    const arrayBuffer = await res.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_PAYLOAD_BYTES) {
      throw new Error('Downloaded image exceeds the maximum 15MB limit.');
    }

    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    return { base64Data, mimeType: contentType.split(';')[0] };
  }

  // Treat as raw base64 string
  return { base64Data: imageStr.trim(), mimeType: 'image/jpeg' };
}

// 5. Timeout Wrapper for Gemini API Calls
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 25000,
  operationName: string = 'AI service'
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${operationName} request timed out after ${Math.round(timeoutMs / 1000)} seconds`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    if (timer) clearTimeout(timer);
    return result;
  } catch (error) {
    if (timer) clearTimeout(timer);
    throw error;
  }
}
