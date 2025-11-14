import { NextRequest, NextResponse } from "next/server";

// Simple image proxy to avoid external blocking/CORS issues when rendering images in the editor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get("url");

    if (!raw) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // Handle potential double-encoding safely
    let targetUrl = raw;
    if (/%25|%2F|%3A|%3F|%26|%3D|%20/i.test(targetUrl)) {
      try {
        const once = decodeURIComponent(targetUrl);
        // Only accept decode if it looks like a URL
        if (/^https?:\/\//i.test(once)) {
          targetUrl = once;
        }
      } catch {
        // ignore decode errors, use raw
      }
    }

    let parsed: URL;
    try {
      // Allow relative paths by resolving against current origin
      const base = new URL(request.url).origin;
      parsed = new URL(targetUrl, base);
    } catch {
      return NextResponse.json({ error: "Invalid url parameter" }, { status: 400 });
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return NextResponse.json({ error: "Unsupported protocol" }, { status: 400 });
    }

    // Fetch the remote image
    const res = await fetch(parsed.toString(), {
      // Avoid caching issues, but allow CDN/browser caching downstream
      headers: {
        // Pass minimal headers; do not forward cookies or auth
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        // Use a common browser UA for better compatibility with some CDNs
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118 Safari/537.36",
      },
      // Revalidate periodically
      cache: "no-store",
      redirect: "follow",
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Upstream fetch failed: ${res.status}` }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const contentLength = res.headers.get("content-length") || undefined;
    const upstreamCache = res.headers.get("cache-control") || undefined;

    // Stream the upstream body directly for efficiency
    return new NextResponse(res.body, {
      headers: {
        "Content-Type": contentType,
        ...(contentLength ? { "Content-Length": contentLength } : {}),
        // Prefer upstream cache header if available; otherwise set a sane default
        "Cache-Control": upstreamCache || "public, max-age=86400, immutable",
        // Allow canvas usage & cross-origin access to the proxied image
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "Content-Type, Content-Length, Cache-Control",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
