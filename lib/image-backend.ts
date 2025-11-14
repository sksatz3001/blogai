type GenerateResponse = {
  imageUrl?: string;
  url?: string;
  s3Key?: string;
  s3_key?: string;
  width?: number;
  height?: number;
  data?: {
    imageUrl?: string;
    url?: string;
    s3Key?: string;
    s3_key?: string;
    width?: number;
    height?: number;
  };
};

const BASE = process.env.IMAGE_BACKEND_BASE || process.env.EXTERNAL_IMAGE_API_BASE || process.env.IMAGE_API_BASE;
const API_KEY = process.env.IMAGE_BACKEND_API_KEY || process.env.EXTERNAL_IMAGE_API_KEY || process.env.IMAGE_API_KEY;

function headersJson() {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  h['Accept'] = 'application/json';
  if (API_KEY) {
    h['Authorization'] = `Bearer ${API_KEY}`;
    h['x-api-key'] = API_KEY;
  }
  return h;
}

export function isExternalBackendConfigured(): boolean {
  return Boolean(BASE);
}

export async function externalGenerateSingleImage(params: { prompt: string; userId?: string; blogId?: string | number; }): Promise<{ s3Key: string; }> {
  if (!BASE) throw new Error('IMAGE_BACKEND_BASE not configured');
  const base = BASE.replace(/\/$/, '');
  const absoluteOverride = process.env.IMAGE_BACKEND_GENERATE_URL?.trim();
  // Allow override of path(s) via env, comma-separated
  const overridePaths = (process.env.IMAGE_BACKEND_GENERATE_PATH || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const rawCandidates = [
    ...overridePaths,
    '',
    '/generate-single-image',
    '/v1/generate-single-image',
    '/api/generate-single-image',
    '/api/v1/generate-single-image',
    '/image/generate-single',
    '/image/generate',
    '/images/generate'
  ];
  // Deduplicate & normalize
  const seen = new Set<string>();
  const candidates = rawCandidates
    .map(p => (p ? (p.startsWith('/') ? p : '/' + p) : ''))
    .filter(p => {
      const key = p;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const body = {
    prompt: params.prompt,
    user_id: String(params.userId ?? ''),
    blog_id: String(params.blogId ?? '')
  };

  const tried: string[] = [];
  let lastErr: any = null;

  const attempt = async (url: string): Promise<{ s3Key?: string } | null> => {
    tried.push(url);
    const res = await fetch(url, {
      method: 'POST',
      headers: headersJson(),
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    if (!res.ok) {
      const errText = await safeText(res);
      lastErr = new Error(`External generate failed: ${res.status} ${errText || ''}`.trim());
      return null;
    }
    try {
      const data: GenerateResponse = await res.json();
      const s3 = data.s3Key || data.s3_key || data?.data?.s3Key || data?.data?.s3_key;
      if (!s3) {
        if ((data as any)?.success === false) {
          lastErr = new Error((data as any)?.error || 'External generate reported failure');
          return null;
        }
        lastErr = new Error('External generate returned no s3_key');
        return null;
      }
      return { s3Key: s3 };
    } catch (e) {
      lastErr = e;
      return null;
    }
  };

  if (absoluteOverride) {
    const r = await attempt(absoluteOverride);
    if (r?.s3Key) return { s3Key: r.s3Key };
  } else {
    for (const path of candidates) {
      const url = path ? `${base}${path}` : `${base}`;
      const r = await attempt(url);
      if (r?.s3Key) return { s3Key: r.s3Key };
    }
  }

  const hint = tried.length ? ` Tried: ${tried.join(', ')}` : '';
  const err = lastErr || new Error('External generate failed');
  err.message += hint;
  throw err;
}

export async function externalEditImage(params: { imageUrl?: string; imageData?: string; prompt: string; }): Promise<{ imageUrl: string; s3Key?: string; }> {
  if (!BASE) throw new Error('IMAGE_BACKEND_BASE not configured');
  const url = `${BASE.replace(/\/$/, '')}/image/edit`;
  const variants = [
    params,
    { image: params.imageUrl, imageData: params.imageData, prompt: params.prompt },
    { dataUrl: params.imageData, prompt: params.prompt },
    { base64: params.imageData, prompt: params.prompt },
  ];
  let lastErr: any = null;
  for (const body of variants) {
    const res = await fetch(url, {
      method: 'POST',
      headers: headersJson(),
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    try {
      if (!res.ok) {
        const errText = await safeText(res);
        lastErr = new Error(`External edit failed: ${res.status} ${errText || ''}`.trim());
        if (res.status >= 500) break;
        continue;
      }
      const data: GenerateResponse = await res.json();
      const outUrl = data.imageUrl || data.url || data?.data?.imageUrl || data?.data?.url;
      if (!outUrl) {
        lastErr = new Error('External edit returned no imageUrl');
        continue;
      }
      return { imageUrl: outUrl, s3Key: data.s3Key || data.s3_key || data?.data?.s3Key || data?.data?.s3_key };
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  throw lastErr || new Error('External edit failed');
}

// New prompt-based edit contract:
// Request: { source_image_url, editing_prompt, user_id, blog_id }
// Response: { success, edited_image_url, s3_key, error }
export async function externalPromptEditImage(params: { sourceImageUrl: string; prompt: string; userId?: string; blogId?: string | number; }): Promise<{ editedImageUrl: string; s3Key?: string; }> {
  if (!BASE) throw new Error('IMAGE_BACKEND_BASE not configured');
  const base = BASE.replace(/\/$/, '');
  const absoluteOverride = process.env.IMAGE_BACKEND_EDIT_URL?.trim();
  // Similar path probing to generation (keep minimal set)
  const overridePaths = (process.env.IMAGE_BACKEND_EDIT_PATH || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const rawCandidates = [
    ...overridePaths,
    '/image/edit',
    '/images/edit',
    '/v1/image/edit',
    '/api/image/edit',
  ];
  const seen = new Set<string>();
  const candidates = rawCandidates.filter(p => {
    const key = p;
    if (seen.has(key)) return false; seen.add(key); return true;
  });

  const payload = {
    source_image_url: params.sourceImageUrl,
    editing_prompt: params.prompt,
    user_id: String(params.userId ?? ''),
    blog_id: String(params.blogId ?? ''),
  };

  const tried: string[] = [];
  let lastErr: any = null;

  const attempt = async (url: string) => {
    tried.push(url);
    const res = await fetch(url, {
      method: 'POST',
      headers: headersJson(),
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    if (!res.ok) {
      const t = await safeText(res);
      lastErr = new Error(`External prompt edit failed: ${res.status} ${t || ''}`.trim());
      return null;
    }
    try {
      const data: any = await res.json();
      if (data.success === false) {
        lastErr = new Error(data.error || 'External edit reported failure');
        return null;
      }
      const edited = data.edited_image_url || data.imageUrl || data.url;
      const s3 = data.s3_key || data.s3Key;
      if (!edited) {
        lastErr = new Error('External edit returned no edited_image_url');
        return null;
      }
      return { editedImageUrl: edited, s3Key: s3 };
    } catch (e) {
      lastErr = e;
      return null;
    }
  };

  if (absoluteOverride) {
    const r = await attempt(absoluteOverride);
    if (r) return r;
  } else {
    for (const path of candidates) {
      const url = `${base}${path}`;
      const r = await attempt(url);
      if (r) return r;
    }
  }
  const hint = tried.length ? ` Tried: ${tried.join(', ')}` : '';
  const err = lastErr || new Error('External prompt edit failed');
  err.message += hint;
  throw err;
}

export async function externalUploadImage(params: { imageData: string; altText?: string; prompt?: string; blogId?: number | string; }): Promise<{ imageUrl: string; s3Key?: string; }> {
  if (!BASE) throw new Error('IMAGE_BACKEND_BASE not configured');
  // Best-effort upload endpoint name; adjust via backend to accept base64 data
  const url = `${BASE.replace(/\/$/, '')}/image/upload`;
  const variants = [
    params,
    { dataUrl: params.imageData, altText: params.altText, prompt: params.prompt, blogId: params.blogId },
    { base64: params.imageData, altText: params.altText, prompt: params.prompt, blogId: params.blogId },
  ];
  let lastErr: any = null;
  for (const body of variants) {
    const res = await fetch(url, {
      method: 'POST',
      headers: headersJson(),
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    try {
      if (!res.ok) {
        const errText = await safeText(res);
        lastErr = new Error(`External upload failed: ${res.status} ${errText || ''}`.trim());
        if (res.status >= 500) break;
        continue;
      }
      const data: GenerateResponse = await res.json();
      const outUrl = data.imageUrl || data.url || data?.data?.imageUrl || data?.data?.url;
      if (!outUrl) {
        lastErr = new Error('External upload returned no imageUrl');
        continue;
      }
      return { imageUrl: outUrl, s3Key: data.s3Key || data.s3_key || data?.data?.s3Key || data?.data?.s3_key };
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  throw lastErr || new Error('External upload failed');
}

async function safeText(res: Response): Promise<string | null> {
  try {
    const text = await res.text();
    return text?.slice(0, 400) || null;
  } catch {
    return null;
  }
}
