"use client";

import { useEffect, useState } from 'react';
import { getPresignedImageUrls, extractS3Key } from '@/lib/presigned-url';

interface BlogContentProps {
  htmlContent: string;
  className?: string;
}

/**
 * Component that processes blog HTML content and converts all S3 image URLs to presigned URLs
 * Use this for rendering blog content with dangerouslySetInnerHTML
 */
export function BlogContent({ htmlContent, className = '' }: BlogContentProps) {
  const [processedHtml, setProcessedHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function processImages() {
      if (!htmlContent) {
        setProcessedHtml('');
        setLoading(false);
        return;
      }

      try {
        // Create a temporary div to parse HTML
        const div = document.createElement('div');
        div.innerHTML = htmlContent;
        
        // Find all img tags
        const images = div.querySelectorAll('img');
        
        // Separate S3 URLs from DB-served URLs
        const s3Urls: string[] = [];
        const allImages = Array.from(images);
        
        allImages.forEach(img => {
          const src = img.getAttribute('src') || img.src;
          if (src && (src.includes('s3') || src.includes('.s3.'))) {
            s3Urls.push(img.src); // Use resolved URL for S3
          }
        });
        
        let processed = htmlContent;
        
        // Process S3 URLs - get presigned URLs
        if (s3Urls.length > 0) {
          const urlMap = await getPresignedImageUrls(s3Urls);
          urlMap.forEach((presignedUrl, originalUrl) => {
            processed = processed.split(originalUrl).join(presignedUrl);
          });
        }
        
        // For DB-served images (/api/images/serve/), ensure full URL and add cache-busting
        processed = processed.replace(
          /src="(\/api\/images\/serve\/\d+)"/g,
          (match, url) => `src="${url}" loading="lazy" onerror="this.style.display='none'"`
        );
        
        // Fix featured-image-wrapper divs - ensure they render properly
        processed = processed.replace(
          /<div class="featured-image-wrapper"[^>]*>(.*?)<\/div>/gi,
          (match, inner) => `<figure class="featured-image-wrapper" style="margin: 2rem 0; text-align: center;">${inner}</figure>`
        );
        
        setProcessedHtml(processed);
      } catch (error) {
        console.error('Error processing blog images:', error);
        setProcessedHtml(htmlContent); // Fallback to original
      } finally {
        setLoading(false);
      }
    }
    
    processImages();
  }, [htmlContent]);

  if (loading) {
    return (
      <div className={className}>
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
          <div className="h-64 bg-muted rounded-xl"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-4/5"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}
