import { NextRequest, NextResponse } from "next/server";

// Generation backend (used earlier for s3_key creation)
const GENERATE_BASE = process.env.IMAGE_BACKEND_BASE;
// Dedicated storage (S3 bucket base) for direct object retrieval
const STORAGE_BASE = process.env.IMAGE_STORAGE_BASE || process.env.IMAGE_S3_BASE;
// API key only applies to generation backend; S3 usually public or uses signed URLs
const API_KEY = process.env.IMAGE_BACKEND_API_KEY || process.env.IMAGE_API_KEY;
// Absolute override template, e.g. https://bucket.amazonaws.com/{s3_key}
const BY_KEY_ABSOLUTE = process.env.IMAGE_BACKEND_BY_KEY_URL?.trim();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const s3 = searchParams.get("s3_key") || searchParams.get("s3Key");
    if (!s3) return NextResponse.json({ error: "Missing s3_key" }, { status: 400 });

    // If s3 contains a full URL, stream it directly
    if (/^https?:\/\//i.test(s3)) {
      return streamImage(s3);
    }

    // Determine final URL precedence:
    // 1. Absolute override template (with {s3_key})
    // 2. Explicit STORAGE_BASE (S3 bucket host)
    // 3. Fallback: attempt absolute override of GENERATE_BASE if provided (not ideal for S3)
    let targetUrl: string | null = null;
    if (BY_KEY_ABSOLUTE) {
      targetUrl = BY_KEY_ABSOLUTE.replace('{s3_key}', encodeURIComponent(s3));
    } else if (STORAGE_BASE) {
      const base = STORAGE_BASE.replace(/\/$/, "");
      // No encoding of path segments beyond user-provided key (already encoded above where necessary)
      targetUrl = `${base}/${s3}`;
    } else if (GENERATE_BASE) {
      // Last-resort fallback: treat generation base as storage (may fail)
      const gen = GENERATE_BASE.replace(/\/$/, "");
      targetUrl = `${gen}/${s3}`;
    } else {
      return NextResponse.json({ error: "No storage base configured (set IMAGE_STORAGE_BASE or IMAGE_BACKEND_BY_KEY_URL)" }, { status: 501 });
    }

    return streamImage(targetUrl);
  } catch (error) {
    console.error("by-key proxy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function streamImage(url: string): Promise<NextResponse> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        // No auth headers for public S3 objects; generation API key intentionally omitted here.
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36",
      },
      cache: "no-store",
      redirect: "follow",
    });
    if (!res.ok) {
      const detail = await safeLimitedText(res);
      const status = res.status === 404 ? 404 : 502;
      return NextResponse.json({ error: `Upstream fetch failed (${res.status})`, detail }, { status });
    }
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const contentLength = res.headers.get("content-length") || undefined;
    const upstreamCache = res.headers.get("cache-control") || "public, max-age=86400, immutable";
    return new NextResponse(res.body, {
      headers: {
        "Content-Type": contentType,
        ...(contentLength ? { "Content-Length": contentLength } : {}),
        "Cache-Control": upstreamCache,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed to stream image", detail: (e as Error).message }, { status: 502 });
  }
}

async function safeLimitedText(res: Response): Promise<string | null> {
  try {
    const t = await res.text();
    return t.slice(0, 300) || null;
  } catch {
    return null;
  }
}
