"use client";

import { useEffect, useState } from 'react';

interface BlogContentProps {
  htmlContent: string;
  className?: string;
}

/**
 * Component that processes blog HTML content for display.
 * Images are served from /api/images/serve/[id] (database-stored).
 */
export function BlogContent({ htmlContent, className = '' }: BlogContentProps) {
  const [processedHtml, setProcessedHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!htmlContent) {
      setProcessedHtml('');
      setLoading(false);
      return;
    }

    try {
      let processed = htmlContent;

      // Ensure DB-served images have lazy loading
      processed = processed.replace(
        /(<img\s[^>]*src="(\/api\/images\/serve\/\d+)")/g,
        (match) => {
          // Only add loading="lazy" if not already present
          if (!match.includes('loading=')) {
            return match.replace('<img ', '<img loading="lazy" ');
          }
          return match;
        }
      );

      // Fix featured-image-wrapper divs - ensure they render properly
      processed = processed.replace(
        /<div class="featured-image-wrapper"[^>]*>(.*?)<\/div>/gi,
        (match, inner) => `<figure class="featured-image-wrapper" style="margin: 2rem 0; text-align: center;">${inner}</figure>`
      );

      setProcessedHtml(processed);
    } catch (error) {
      console.error('Error processing blog content:', error);
      setProcessedHtml(htmlContent); // Fallback to original
    } finally {
      setLoading(false);
    }
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
