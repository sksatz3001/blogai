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
        const imageUrls = Array.from(images)
          .map(img => img.src)
          .filter(src => src && src.includes('s3')); // Only process S3 URLs
        
        if (imageUrls.length === 0) {
          setProcessedHtml(htmlContent);
          setLoading(false);
          return;
        }
        
        // Get presigned URLs for all images in batch
        const urlMap = await getPresignedImageUrls(imageUrls);
        
        // Replace all S3 URLs with presigned URLs
        let processed = htmlContent;
        urlMap.forEach((presignedUrl, originalUrl) => {
          // Use global replace to handle multiple occurrences
          processed = processed.split(originalUrl).join(presignedUrl);
        });
        
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
