import Image from '@tiptap/extension-image';
import { getPresignedImageUrl } from '@/lib/presigned-url';

/**
 * Custom Tiptap Image extension that automatically handles presigned URLs for private S3 images.
 * When an image with an S3 URL is rendered, it fetches a presigned URL and displays it.
 */
export const S3Image = Image.extend({
  name: 's3-image',

  addAttributes() {
    return {
      ...this.parent?.(),
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute('src'),
        renderHTML: (attributes) => {
          if (!attributes.src) {
            return {};
          }
          return {
            src: attributes.src,
            'data-original-src': attributes.src, // Preserve original for editing
          };
        },
      },
      'data-presigned-src': {
        default: null,
        parseHTML: (element) => element.getAttribute('data-presigned-src'),
        renderHTML: (attributes) => {
          if (!attributes['data-presigned-src']) {
            return {};
          }
          return {
            'data-presigned-src': attributes['data-presigned-src'],
          };
        },
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
    };
  },

  addNodeView() {
    return ({ node, HTMLAttributes }) => {
      const dom = document.createElement('img');
      const src = node.attrs.src;
      
      // Apply all HTML attributes
      Object.entries(HTMLAttributes).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          dom.setAttribute(key, String(value));
        }
      });

      // Check if this is an S3 URL
      const isS3Url = src && (
        src.includes('.s3.') || 
        src.includes('s3.amazonaws.com') ||
        src.includes('contendodev') ||
        src.includes('jagratiblogai')
      );

      if (isS3Url) {
        // Show loading placeholder
        dom.style.opacity = '0.5';
        dom.style.filter = 'blur(4px)';
        
        // Set initial src to prevent broken image
        dom.src = src;

        // Fetch presigned URL
        getPresignedImageUrl(src)
          .then((presignedUrl) => {
            if (presignedUrl) {
              dom.src = presignedUrl;
              dom.setAttribute('data-presigned-src', presignedUrl);
            }
            // Remove loading effects
            dom.style.opacity = '1';
            dom.style.filter = 'none';
          })
          .catch((err) => {
            console.error('Failed to fetch presigned URL for image:', src, err);
            // Remove loading effects even on error
            dom.style.opacity = '1';
            dom.style.filter = 'none';
            // Keep original src as fallback
          });
      } else {
        // Non-S3 images display normally
        dom.src = src;
      }

      return {
        dom,
        // Update function for when attributes change
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) {
            return false;
          }

          const newSrc = updatedNode.attrs.src;
          if (newSrc !== src) {
            // Re-fetch presigned URL if src changed
            const isNewS3Url = newSrc && (
              newSrc.includes('.s3.') || 
              newSrc.includes('s3.amazonaws.com') ||
              newSrc.includes('contendodev') ||
              newSrc.includes('jagratiblogai')
            );

            if (isNewS3Url) {
              dom.style.opacity = '0.5';
              dom.style.filter = 'blur(4px)';
              dom.src = newSrc;

              getPresignedImageUrl(newSrc)
                .then((presignedUrl) => {
                  if (presignedUrl) {
                    dom.src = presignedUrl;
                    dom.setAttribute('data-presigned-src', presignedUrl);
                  }
                  dom.style.opacity = '1';
                  dom.style.filter = 'none';
                })
                .catch((err) => {
                  console.error('Failed to fetch presigned URL:', err);
                  dom.style.opacity = '1';
                  dom.style.filter = 'none';
                });
            } else {
              dom.src = newSrc;
            }
          }

          return true;
        },
      };
    };
  },
});
