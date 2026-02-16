/**
 * Client-side utility to convert S3 URLs to presigned URLs
 */

/**
 * Extract S3 key from a full S3 URL
 * Example: https://bucket.s3.region.amazonaws.com/user/blog/image.png -> user/blog/image.png
 */
export function extractS3Key(url: string): string | null {
  try {
    // Handle direct S3 key (no URL)
    if (!url.startsWith('http')) {
      return url;
    }

    // Parse the URL
    const urlObj = new URL(url);
    
    // Remove leading slash and return the path
    const key = urlObj.pathname.replace(/^\//, '');
    
    return key || null;
  } catch (error) {
    console.error('Error extracting S3 key from URL:', url, error);
    return null;
  }
}

/**
 * Get a presigned URL for a single S3 image
 * @param urlOrKey - Either a full S3 URL or just the S3 key
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 */
export async function getPresignedImageUrl(
  urlOrKey: string,
  expiresIn: number = 3600
): Promise<string> {
  // If it's already a presigned URL (contains signature), return as-is
  if (urlOrKey.includes('X-Amz-Signature') || urlOrKey.includes('Signature=')) {
    return urlOrKey;
  }

  const s3Key = extractS3Key(urlOrKey);
  
  if (!s3Key) {
    console.error('Could not extract S3 key from:', urlOrKey);
    return urlOrKey; // Return original URL as fallback
  }

  try {
    const response = await fetch('/api/images/presigned-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ s3Key, expiresIn }),
    });

    if (!response.ok) {
      console.error('Failed to get presigned URL:', await response.text());
      return urlOrKey; // Return original URL as fallback
    }

    const data = await response.json();
    return data.presignedUrl || urlOrKey;
  } catch (error) {
    console.error('Error getting presigned URL:', error);
    return urlOrKey; // Return original URL as fallback
  }
}

/**
 * Get presigned URLs for multiple S3 images (batch operation)
 * @param urlsOrKeys - Array of S3 URLs or keys
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 * @returns Map of original URL/key to presigned URL
 */
export async function getPresignedImageUrls(
  urlsOrKeys: string[],
  expiresIn: number = 3600
): Promise<Map<string, string>> {
  const resultMap = new Map<string, string>();
  
  // Filter out already presigned URLs and extract S3 keys
  const toProcess: Array<{ original: string; s3Key: string }> = [];
  
  for (const urlOrKey of urlsOrKeys) {
    if (urlOrKey.includes('X-Amz-Signature') || urlOrKey.includes('Signature=')) {
      resultMap.set(urlOrKey, urlOrKey);
      continue;
    }
    
    const s3Key = extractS3Key(urlOrKey);
    if (s3Key) {
      toProcess.push({ original: urlOrKey, s3Key });
    } else {
      resultMap.set(urlOrKey, urlOrKey);
    }
  }

  if (toProcess.length === 0) {
    return resultMap;
  }

  try {
    const response = await fetch('/api/images/presigned-url', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        s3Keys: toProcess.map(p => p.s3Key), 
        expiresIn 
      }),
    });

    if (!response.ok) {
      console.error('Batch presigned URL request failed:', await response.text());
      // Return original URLs as fallback
      toProcess.forEach(({ original }) => resultMap.set(original, original));
      return resultMap;
    }

    const data = await response.json();
    
    // Map results back to original URLs
    data.results?.forEach((result: any, index: number) => {
      const original = toProcess[index]?.original;
      if (original) {
        resultMap.set(original, result.presignedUrl || original);
      }
    });

    return resultMap;
  } catch (error) {
    console.error('Error getting batch presigned URLs:', error);
    // Return original URLs as fallback
    toProcess.forEach(({ original }) => resultMap.set(original, original));
    return resultMap;
  }
}

/**
 * React hook to convert an S3 URL to a presigned URL
 */
export function usePresignedUrl(urlOrKey: string | null | undefined, expiresIn: number = 3600) {
  const [presignedUrl, setPresignedUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!urlOrKey) {
      setPresignedUrl(null);
      return;
    }

    let cancelled = false;

    const fetchUrl = async () => {
      setLoading(true);
      try {
        const url = await getPresignedImageUrl(urlOrKey, expiresIn);
        if (!cancelled) {
          setPresignedUrl(url);
        }
      } catch (error) {
        console.error('Error in usePresignedUrl:', error);
        if (!cancelled) {
          setPresignedUrl(urlOrKey); // Fallback to original
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchUrl();

    return () => {
      cancelled = true;
    };
  }, [urlOrKey, expiresIn]);

  return { presignedUrl, loading };
}

// Add React import for the hook (will be used in components)
import React from 'react';
