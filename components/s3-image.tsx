"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { getPresignedImageUrl } from '@/lib/presigned-url';

interface S3ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Image component that automatically handles S3 presigned URLs
 * Use this instead of <img> or Next.js <Image> for S3 images
 */
export function S3Image({ 
  src, 
  alt, 
  width, 
  height, 
  className = '', 
  style,
  fill,
  priority,
  quality,
  placeholder,
  blurDataURL,
  onLoad,
  onError,
  ...props 
}: S3ImageProps) {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchPresignedUrl = async () => {
      if (!src) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(false);
        const url = await getPresignedImageUrl(src);
        
        if (!cancelled) {
          setPresignedUrl(url);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading S3 image:', err);
        if (!cancelled) {
          setError(true);
          setLoading(false);
          setPresignedUrl(src); // Fallback to original URL
        }
      }
    };

    fetchPresignedUrl();

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (loading) {
    return (
      <div 
        className={`bg-muted animate-pulse ${className}`}
        style={{ width, height, ...style }}
      />
    );
  }

  if (error && !presignedUrl) {
    return (
      <div 
        className={`bg-muted flex items-center justify-center text-muted-foreground text-sm ${className}`}
        style={{ width, height, ...style }}
      >
        Failed to load image
      </div>
    );
  }

  // Use Next.js Image component for optimization
  if (width && height && !fill) {
    return (
      <Image
        src={presignedUrl || src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={onLoad}
        onError={onError}
        {...props}
      />
    );
  }

  // Use standard img tag for fill or responsive images
  return (
    <img
      src={presignedUrl || src}
      alt={alt}
      className={className}
      style={style}
      onLoad={onLoad}
      onError={onError}
      {...props}
    />
  );
}

/**
 * Simple img wrapper that converts S3 URLs to presigned URLs
 * Use when you need a basic img tag without Next.js Image optimization
 */
export function S3Img({ 
  src, 
  alt, 
  className = '', 
  style,
  onLoad,
  onError,
  ...props 
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchPresignedUrl = async () => {
      if (!src) return;

      try {
        const url = await getPresignedImageUrl(src);
        if (!cancelled) {
          setPresignedUrl(url);
        }
      } catch (err) {
        console.error('Error loading S3 image:', err);
        if (!cancelled) {
          setPresignedUrl(src); // Fallback
        }
      }
    };

    fetchPresignedUrl();

    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <img
      src={presignedUrl || src || ''}
      alt={alt || ''}
      className={className}
      style={style}
      onLoad={onLoad}
      onError={onError}
      {...props}
    />
  );
}
