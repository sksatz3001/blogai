import { NextRequest, NextResponse } from "next/server";

/**
 * AI-based image editing has been removed.
 * This endpoint is kept for backwards compatibility but returns an error.
 * Users should use manual image editing features instead.
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: "AI-based image editing has been removed. Please use manual image editing features instead.",
      code: "FEATURE_REMOVED"
    },
    { status: 410 } // 410 Gone - indicates the resource is no longer available
  );
}
