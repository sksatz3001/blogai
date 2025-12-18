# Migration Examples for S3 Presigned URLs

## Example 1: Blog Featured Image

### Before:
```tsx
<img 
  src={blog.featuredImage} 
  alt={blog.title}
  className="w-full h-64 object-cover rounded-lg"
/>
```

### After:
```tsx
import { S3Img } from '@/components/s3-image';

<S3Img 
  src={blog.featuredImage} 
  alt={blog.title}
  className="w-full h-64 object-cover rounded-lg"
/>
```

---

## Example 2: Blog Content Images (with Next.js Image)

### Before:
```tsx
<Image
  src={image.imageUrl}
  alt={image.altText}
  width={800}
  height={600}
  className="rounded-lg"
/>
```

### After:
```tsx
import { S3Image } from '@/components/s3-image';

<S3Image
  src={image.imageUrl}
  alt={image.altText}
  width={800}
  height={600}
  className="rounded-lg"
/>
```

---

## Example 3: Blog List/Grid with Multiple Images

### Before:
```tsx
{blogs.map(blog => (
  <div key={blog.id}>
    <img src={blog.featuredImage} alt={blog.title} />
    <h3>{blog.title}</h3>
  </div>
))}
```

### After (Option 1 - Simple):
```tsx
import { S3Img } from '@/components/s3-image';

{blogs.map(blog => (
  <div key={blog.id}>
    <S3Img src={blog.featuredImage} alt={blog.title} />
    <h3>{blog.title}</h3>
  </div>
))}
```

### After (Option 2 - Optimized Batch Loading):
```tsx
import { useEffect, useState } from 'react';
import { getPresignedImageUrls } from '@/lib/presigned-url';

function BlogList({ blogs }) {
  const [urlMap, setUrlMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUrls() {
      const imageUrls = blogs.map(b => b.featuredImage).filter(Boolean);
      const presignedMap = await getPresignedImageUrls(imageUrls);
      setUrlMap(presignedMap);
      setLoading(false);
    }
    loadUrls();
  }, [blogs]);

  if (loading) return <div>Loading images...</div>;

  return (
    <>
      {blogs.map(blog => (
        <div key={blog.id}>
          <img 
            src={urlMap.get(blog.featuredImage) || blog.featuredImage} 
            alt={blog.title} 
          />
          <h3>{blog.title}</h3>
        </div>
      ))}
    </>
  );
}
```

---

## Example 4: Image Editor/Upload Preview

### Before:
```tsx
const [imageUrl, setImageUrl] = useState<string | null>(null);

// After upload
const response = await fetch('/api/images/upload', { ... });
const data = await response.json();
setImageUrl(data.imageUrl);

return <img src={imageUrl} alt="Preview" />;
```

### After:
```tsx
import { S3Img } from '@/components/s3-image';

const [imageUrl, setImageUrl] = useState<string | null>(null);

// After upload
const response = await fetch('/api/images/upload', { ... });
const data = await response.json();
setImageUrl(data.imageUrl);

return <S3Img src={imageUrl} alt="Preview" />;
```

---

## Example 5: Dynamic HTML Content (Blog Body)

### Before:
```tsx
<div 
  dangerouslySetInnerHTML={{ __html: blog.htmlContent }}
  className="prose"
/>
```

### After:
You need to process the HTML content server-side or client-side:

#### Server-side (in API or page):
```tsx
import { getPresignedImageUrl } from '@/lib/presigned-url';

async function processBlogHtml(html: string): Promise<string> {
  // Find all img tags
  const imgRegex = /<img[^>]+src="([^">]+)"/g;
  const matches = [...html.matchAll(imgRegex)];
  
  // Get presigned URLs for all images
  const urls = matches.map(m => m[1]);
  const presignedMap = await Promise.all(
    urls.map(async (url) => {
      const presigned = await getPresignedImageUrl(url);
      return { original: url, presigned };
    })
  );
  
  // Replace URLs in HTML
  let processedHtml = html;
  presignedMap.forEach(({ original, presigned }) => {
    processedHtml = processedHtml.replace(original, presigned);
  });
  
  return processedHtml;
}

// In your component/API
const processedHtml = await processBlogHtml(blog.htmlContent);
```

#### Client-side:
```tsx
'use client';
import { useEffect, useState } from 'react';
import { getPresignedImageUrls, extractS3Key } from '@/lib/presigned-url';

function BlogContent({ htmlContent }: { htmlContent: string }) {
  const [processedHtml, setProcessedHtml] = useState(htmlContent);

  useEffect(() => {
    async function processImages() {
      const div = document.createElement('div');
      div.innerHTML = htmlContent;
      
      const images = div.querySelectorAll('img');
      const urls = Array.from(images).map(img => img.src).filter(Boolean);
      
      if (urls.length === 0) {
        setProcessedHtml(htmlContent);
        return;
      }
      
      const urlMap = await getPresignedImageUrls(urls);
      
      let processed = htmlContent;
      urlMap.forEach((presigned, original) => {
        processed = processed.replace(original, presigned);
      });
      
      setProcessedHtml(processed);
    }
    
    processImages();
  }, [htmlContent]);

  return (
    <div 
      dangerouslySetInnerHTML={{ __html: processedHtml }}
      className="prose"
    />
  );
}
```

---

## Files That Need Updates

Search for these patterns in your codebase:

1. `<img src={` - Replace with `<S3Img src={`
2. `<Image src={` (from next/image) - Replace with `<S3Image src={`
3. Any direct use of S3 URLs in:
   - Blog view pages
   - Blog edit pages
   - Dashboard components
   - Employee blog components
   - Image editor modals

## Quick Find & Replace

Run this to find all image usages:
```bash
grep -r "featuredImage\|imageUrl\|<img\|<Image" app/ components/ --include="*.tsx" --include="*.ts"
```
