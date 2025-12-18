import { NextRequest, NextResponse } from "next/server";
import { getPresignedUrl, isS3Configured } from "@/lib/s3-upload";

/**
 * API endpoint to generate presigned URLs for private S3 images
 * POST body: { s3Key: string, expiresIn?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const { s3Key, expiresIn } = await request.json();

    if (!s3Key) {
      return NextResponse.json({ error: "s3Key is required" }, { status: 400 });
    }

    if (!isS3Configured()) {
      return NextResponse.json(
        { error: "S3 is not configured" },
        { status: 500 }
      );
    }

    const presignedUrl = await getPresignedUrl(s3Key, expiresIn);

    return NextResponse.json({ presignedUrl, s3Key });
  } catch (error) {
    console.error("Presigned URL generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate presigned URL";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Batch endpoint to get presigned URLs for multiple images
 * POST body: { s3Keys: string[], expiresIn?: number }
 */
export async function PUT(request: NextRequest) {
  try {
    const { s3Keys, expiresIn } = await request.json();

    if (!Array.isArray(s3Keys) || s3Keys.length === 0) {
      return NextResponse.json({ error: "s3Keys array is required" }, { status: 400 });
    }

    if (!isS3Configured()) {
      return NextResponse.json(
        { error: "S3 is not configured" },
        { status: 500 }
      );
    }

    const results = await Promise.all(
      s3Keys.map(async (s3Key) => {
        try {
          const presignedUrl = await getPresignedUrl(s3Key, expiresIn);
          return { s3Key, presignedUrl, success: true };
        } catch (error) {
          return { 
            s3Key, 
            presignedUrl: null, 
            success: false, 
            error: error instanceof Error ? error.message : "Failed" 
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Batch presigned URL generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate presigned URLs";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
