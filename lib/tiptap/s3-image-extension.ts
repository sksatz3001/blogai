import Image from '@tiptap/extension-image';

/**
 * Custom Tiptap Image extension for database-served images.
 * Images are served from /api/images/serve/[id] endpoints.
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

      // Set image src directly - images are served from /api/images/serve/[id]
      if (src) {
        dom.src = src;
      }

      return {
        dom,
        update: (updatedNode) => {
          if (updatedNode.type !== this.type) {
            return false;
          }

          const newSrc = updatedNode.attrs.src;
          if (newSrc !== dom.getAttribute('src')) {
            dom.src = newSrc;
          }

          // Update alt text if changed
          const newAlt = updatedNode.attrs.alt;
          if (newAlt !== dom.getAttribute('alt')) {
            dom.alt = newAlt || '';
          }

          return true;
        },
      };
    };
  },
});
