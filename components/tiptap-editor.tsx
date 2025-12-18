"use client";

import { useEffect, useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { ImagePromptModal } from "@/components/image-prompt-modal";
import { ProfessionalImageEditor } from "@/components/professional-image-editor";
import { ImageLoading } from "@/lib/tiptap/image-loading";
import { S3Image } from "@/lib/tiptap/s3-image-extension";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  ImageIcon,
  Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
  // Optional blogId to enable server-side persistence of edited images
  blogId?: number | string;
  // Optional blog title for AI-generated image suggestions
  blogTitle?: string;
  // Optional callback to trigger auto-save after image edit - receives the current HTML content
  onAutoSave?: (htmlContent: string) => void;
  // Optional callback to refresh credits after image generation/edit
  onCreditsUsed?: () => void;
}

export function TiptapEditor({ content, onChange, editable = true, blogId, blogTitle, onAutoSave, onCreditsUsed }: TiptapEditorProps) {
  const [showImagePromptModal, setShowImagePromptModal] = useState(false);
  const [showImageEditorModal, setShowImageEditorModal] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string>("");
    // Preserve original non-proxied src so we can match and replace correctly even if we proxy for editing
    const [selectedImageOriginalSrc, setSelectedImageOriginalSrc] = useState<string>("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const isStreamingRef = useRef(false);
  const lastContentRef = useRef("");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      S3Image.configure({
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto cursor-pointer hover:opacity-80 transition-opacity",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 dark:text-blue-400 underline",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder: "Start writing your blog content here...",
      }),
      ImageLoading,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[500px] px-8 py-6",
      },
    },
  });

  // Update editor content when prop changes - optimized for smooth streaming
  useEffect(() => {
    if (!editor || !content) return;
    
    const currentHTML = editor.getHTML();
    
    // Skip if content is exactly the same
    if (content === currentHTML || content === lastContentRef.current) {
      return;
    }
    
    // Detect if this is a streaming update
    const isStreaming = lastContentRef.current && 
                       content.length > lastContentRef.current.length &&
                       content.startsWith(lastContentRef.current.substring(0, Math.min(300, lastContentRef.current.length)));
    
    // Debounce updates during streaming to reduce flicker
    if (isStreaming) {
      // Append only the new delta instead of resetting entire doc
      const prev = lastContentRef.current || "";
      const delta = content.slice(prev.length);
      const MIN_DELTA = 64; // threshold to avoid tiny updates

      if (delta.length >= MIN_DELTA) {
        // Use RAF for smooth append during streaming
        if (isStreamingRef.current) return; // Skip if already updating
        isStreamingRef.current = true;
        requestAnimationFrame(() => {
          if (editor && !editor.isDestroyed) {
            try {
              editor.chain().focus().insertContent(delta).run();
              // Auto-scroll to bottom during streaming
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
              }
            } catch (e) {
              // Fallback to full setContent if append fails
              editor.commands.setContent(content, false);
            }
          }
          isStreamingRef.current = false;
        });
      }
    } else {
      // Non-streaming: update immediately
      if (!editor.isDestroyed) {
        editor.commands.setContent(content, false);
      }
    }
    
    lastContentRef.current = content;
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const handleImagePromptSubmit = async (prompt: string) => {
    if (!editor) return;

    setIsGeneratingImage(true);
    const loadingId = `loading-${Date.now()}`;

    try {
      // Insert loading state at the end
      editor.chain().focus().insertContent({
        type: "imageLoading",
        attrs: { id: loadingId },
      }).run();

      // Close modal immediately for better UX
      setShowImagePromptModal(false);

      // Generate image with AI
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, blogId }),
      });

      if (!response.ok) {
        let message = "Failed to generate image";
        try {
          const err = await response.json();
          if (err?.error) message = err.error;
        } catch {
          try {
            const text = await response.text();
            if (text) message = text.slice(0, 400);
          } catch {}
        }
        throw new Error(message);
      }

      const data = await response.json();
      if (data?.provider) {
        // Debug visibility: which backend served this image
        console.info("Image provider:", data.provider);
      }

      // Refresh credits after successful image generation
      onCreditsUsed?.();

      // Determine whether to proxy: skip proxy for direct S3 bucket images (storage base)
      const storageBase = (process.env.NEXT_PUBLIC_IMAGE_STORAGE_BASE || process.env.IMAGE_STORAGE_BASE || '').replace(/\/$/, '');
      const isAbsolute = typeof data.imageUrl === 'string' && /^https?:\/\//i.test(data.imageUrl);
      const isStorageDirect = storageBase && isAbsolute && data.imageUrl.startsWith(storageBase);
      const proxiedUrl = isAbsolute && !isStorageDirect
        ? `/api/images/proxy?url=${encodeURIComponent(data.imageUrl)}`
        : data.imageUrl;

      // Helper: retry image preload until it's actually available (Pollinations can be delayed)
      const waitForImageLoad = async (url: string, attempts = 6, delayMs = 2000) => {
        for (let i = 0; i < attempts; i++) {
          const ok = await new Promise<boolean>((resolve) => {
            const testImg = new window.Image();
            const timeout = window.setTimeout(() => {
              testImg.src = ""; // cancel
              resolve(false);
            }, Math.min(10000, delayMs));
            testImg.onload = () => {
              window.clearTimeout(timeout);
              resolve(true);
            };
            testImg.onerror = () => {
              window.clearTimeout(timeout);
              resolve(false);
            };
            testImg.src = url + (url.includes("?") ? "&" : "?") + `ts=${Date.now()}`; // bust any caches
          });
          if (ok) return true;
          // small wait before next attempt
          await new Promise((r) => setTimeout(r, delayMs));
        }
        return false;
      };

      // Preload image to ensure it's cached
      const ready = await waitForImageLoad(proxiedUrl);
      if (!ready) {
        // Keep loading node and start background polling; insert when ready
        toast.message("Image is preparing...", { description: "We'll insert it automatically when it's ready." });

        const pollInsert = async () => {
          // Try up to ~60s with incremental backoff
          const maxAttempts = 12;
          for (let i = 0; i < maxAttempts; i++) {
            // Single quick attempt
            const ok = await (async () => {
              return new Promise<boolean>((resolve) => {
                const testImg = new window.Image();
                const timeout = window.setTimeout(() => {
                  testImg.src = "";
                  resolve(false);
                }, 8000);
                testImg.onload = () => {
                  window.clearTimeout(timeout);
                  resolve(true);
                };
                testImg.onerror = () => {
                  window.clearTimeout(timeout);
                  resolve(false);
                };
                testImg.src = proxiedUrl + (proxiedUrl.includes("?") ? "&" : "?") + `ts=${Date.now()}`;
              });
            })();

            if (ok) {
              if (!editor || editor.isDestroyed) return;
              let loadingPos: number | null = null;
              const { state } = editor;
              const { doc } = state;
              doc.descendants((node, pos) => {
                if (node.type.name === "imageLoading" && node.attrs.id === loadingId) {
                  loadingPos = pos;
                  return false;
                }
                return true;
              });

              if (loadingPos !== null) {
                editor
                  .chain()
                  .focus()
                  .deleteRange({ from: loadingPos, to: loadingPos + 1 })
                  .insertContentAt(loadingPos, {
                    type: "image",
                    attrs: { src: proxiedUrl, alt: prompt },
                  })
                  .run();
                toast.success("Image inserted");
              }
              return;
            }
            // backoff: 2s + i*1s (max 8s between tries)
            await new Promise((r) => setTimeout(r, Math.min(2000 + i * 1000, 8000)));
          }

          // After all attempts, remove loading node and notify
          if (!editor || editor.isDestroyed) return;
          const { state: st } = editor;
          const { doc: d } = st;
          d.descendants((node, pos) => {
            if (node.type.name === "imageLoading" && node.attrs.id === loadingId) {
              editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run();
              return false;
            }
            return true;
          });
          toast.error("Image is taking longer than expected. Please try again.");
        };

        // Fire and forget; don't block user
        void pollInsert();
        return; // Exit early; we will insert later when ready
      }

      // Find and replace the loading node with actual image immediately
      const { state } = editor;
      const { doc } = state;
      let loadingPos: number | null = null;

      doc.descendants((node, pos) => {
        if (node.type.name === "imageLoading" && node.attrs.id === loadingId) {
          loadingPos = pos;
          return false;
        }
        return true;
      });

      if (loadingPos !== null) {
        // Replace loading with actual image immediately
        editor
          .chain()
          .focus()
          .deleteRange({ from: loadingPos, to: loadingPos + 1 })
            .insertContentAt(loadingPos, {
            type: "image",
            attrs: { src: proxiedUrl, alt: prompt },
          })
          .run();
      } else {
        // Fallback: just insert the image at the end
        editor.chain().focus().setImage({ src: proxiedUrl, alt: prompt }).run();
      }

    } catch (error) {
      console.error("Error generating image:", error);
      alert((error as Error)?.message || "Failed to generate image. Please try again.");
      
      // Remove loading state on error
      setTimeout(() => {
        const { state } = editor;
        const { doc } = state;
        doc.descendants((node, pos) => {
          if (node.type.name === "imageLoading" && node.attrs.id === loadingId) {
            editor.chain().focus().deleteRange({ from: pos, to: pos + 1 }).run();
            return false;
          }
          return true;
        });
      }, 100);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'IMG') {
      let imgSrc = (target as HTMLImageElement).src;
      // If the image is proxied through our API, extract the real source URL for editing/persistence
      try {
        const u = new URL(imgSrc, window.location.origin);
        if (u.pathname.startsWith('/api/images/proxy')) {
          const raw = u.searchParams.get('url');
          if (raw) {
            // decode only once; if invalid, keep as-is
            try { imgSrc = decodeURIComponent(raw); } catch { imgSrc = raw; }
          }
        }
      } catch { /* ignore parse issues */ }
      const storageBase = (process.env.NEXT_PUBLIC_IMAGE_STORAGE_BASE || process.env.IMAGE_STORAGE_BASE || '').replace(/\/$/, '');
      const isAbs = /^https?:\/\//i.test(imgSrc);
      const isStorage = storageBase && isAbs && imgSrc.startsWith(storageBase);
      // Proxy storage images for editing to avoid CORS canvas taint if bucket lacks CORS headers
      const editingSrc = isStorage ? `/api/images/proxy?url=${encodeURIComponent(imgSrc)}` : imgSrc;
      setSelectedImageOriginalSrc(imgSrc);
      setSelectedImageSrc(editingSrc);
    }
  };

  const handleImageSave = async (editedImageSrc: string) => {
    if (!editor || !selectedImageSrc) return;

    let finalUrl = editedImageSrc;
    let uploadSucceeded = false;
    
    // If blogId is present, attempt S3 upload + persistence
    if (blogId) {
      try {
        const res = await fetch("/api/images/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            imageData: editedImageSrc, 
            blogId,
          }),
        });
        
        if (res.ok) {
          const up = await res.json();
          if (up?.imageUrl) {
            finalUrl = up.imageUrl;
            uploadSucceeded = true;
            console.log("Image uploaded to S3 successfully:", finalUrl);
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.warn("Image upload failed:", res.status, errorData);
          // If upload fails due to S3 not configured, throw error
          if (errorData?.code === 'NO_S3') {
            throw new Error("S3 storage not configured. Please contact admin.");
          }
          // Throw for other errors
          throw new Error(errorData?.error || `Upload failed: ${res.status}`);
        }
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
        throw uploadError;
      }
    }

    // If no blogId, can't upload - show warning
    if (!uploadSucceeded && editedImageSrc.startsWith('data:')) {
      const sizeKB = Math.round(editedImageSrc.length / 1024);
      if (sizeKB > 2000) {
        throw new Error(`Image too large (${Math.round(sizeKB/1024)}MB). Please save the blog first to enable image uploads.`);
      }
      if (!blogId) {
        toast.warning("Save the blog first to enable permanent image storage.");
      }
    }

    // Find and replace the image in the editor
    const { state } = editor;
    const { doc } = state;

    // Use the actual S3 URL for storage (not proxied) so it persists correctly
    const storageBase = (process.env.NEXT_PUBLIC_IMAGE_STORAGE_BASE || process.env.IMAGE_STORAGE_BASE || '').replace(/\/$/, '');
    const isAbs = /^https?:\/\//i.test(finalUrl);
    const isStorage = storageBase && isAbs && finalUrl.startsWith(storageBase);
    
    // For S3 URLs, save the direct URL. For display, we may proxy it, but for saving we want the real URL.
    const urlToSave = finalUrl;
    
    console.log('Image save debug:', {
      finalUrl,
      isStorage,
      urlToSave,
      selectedImageOriginalSrc,
      selectedImageSrc
    });

    // Find and preserve original image alt text
    let originalAlt: string | undefined;
    let foundImage = false;
    
    doc.descendants((node) => {
      if (node.type.name === 'image') {
        const nodeSrc = node.attrs.src;
        // Check various forms the source could be in
        const isMatch = nodeSrc === selectedImageOriginalSrc || 
                       nodeSrc === selectedImageSrc ||
                       (nodeSrc.includes('/api/images/proxy') && decodeURIComponent(nodeSrc).includes(selectedImageOriginalSrc));
        if (isMatch) {
          originalAlt = node.attrs.alt;
          foundImage = true;
          return false;
        }
      }
      return true;
    });
    
    console.log('Found image to replace:', foundImage, 'alt:', originalAlt);

    doc.descendants((node, pos) => {
      if (node.type.name === 'image') {
        const nodeSrc = node.attrs.src;
        const isMatch = nodeSrc === selectedImageOriginalSrc || 
                       nodeSrc === selectedImageSrc ||
                       (nodeSrc.includes('/api/images/proxy') && decodeURIComponent(nodeSrc).includes(selectedImageOriginalSrc));
        if (isMatch) {
          // Build attrs - save the actual S3 URL
          const newAttrs: Record<string, any> = { src: urlToSave };
          if (originalAlt) newAttrs.alt = originalAlt;
          
          console.log('Replacing image at pos', pos, 'with URL:', urlToSave);
          
          editor
            .chain()
            .deleteRange({ from: pos, to: pos + 1 })
            .insertContentAt(pos, {
              type: "image",
              attrs: newAttrs,
            })
            .run();
          return false;
        }
      }
      return true;
    });
    
    // Show success message
    if (uploadSucceeded) {
      toast.success("Image edited and saved!");
    }
    
    // Close modal
    setShowImageEditorModal(false);
    setSelectedImageSrc("");
    setSelectedImageOriginalSrc("");
    
    // Get the current HTML content from editor
    const currentHtml = editor.getHTML();
    
    // Sync to parent state
    onChange(currentHtml);
    
    // Trigger auto-save with the current HTML content directly
    // This avoids race condition where React state hasn't updated yet
    if (onAutoSave) {
      setTimeout(() => {
        onAutoSave(currentHtml);
      }, 100);
    }
  };

  const setLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="glass border-2 border-[hsl(var(--border))] rounded-2xl overflow-visible flex flex-col">
      {editable && (
        <div className="flex-shrink-0 border-b-2 border-[hsl(var(--border))] p-3 flex flex-wrap gap-1.5 bg-white dark:bg-slate-900 shadow-md sticky top-0 z-50 rounded-t-2xl">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(editor.isActive("bold") && "bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]")}
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(editor.isActive("italic") && "bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]")}
          >
            <Italic className="h-4 w-4" />
          </Button>

          <div className="w-px h-8 bg-[hsl(var(--border))] mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              editor.isActive("heading", { level: 2 }) && "bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]"
            )}
          >
            <Heading2 className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn(
              editor.isActive("heading", { level: 3 }) && "bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]"
            )}
          >
            <Heading3 className="h-4 w-4" />
          </Button>

          <div className="w-px h-8 bg-[hsl(var(--border))] mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(editor.isActive("bulletList") && "bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]")}
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(editor.isActive("orderedList") && "bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]")}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <div className="w-px h-8 bg-[hsl(var(--border))] mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={cn(
              editor.isActive({ textAlign: "left" }) && "bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]"
            )}
          >
            <AlignLeft className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={cn(
              editor.isActive({ textAlign: "center" }) && "bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]"
            )}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={cn(
              editor.isActive({ textAlign: "right" }) && "bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]"
            )}
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <div className="w-px h-8 bg-[hsl(var(--border))] mx-1" />

          <Button type="button" variant="ghost" size="sm" onClick={setLink}>
            <Link2 className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowImagePromptModal(true)}
            disabled={isGeneratingImage}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          {selectedImageSrc && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowImageEditorModal(true)}
              className="bg-blue-100 text-blue-600 hover:bg-blue-200"
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Edit Image
            </Button>
          )}
        </div>
      )}

      <div ref={scrollContainerRef} onClick={handleImageClick} className="flex-1">
        <EditorContent editor={editor} />
      </div>

      {showImagePromptModal && (
        <ImagePromptModal
          onClose={() => setShowImagePromptModal(false)}
          onSubmit={handleImagePromptSubmit}
          isGenerating={isGeneratingImage}
          blogTitle={blogTitle}
          blogContent={content}
        />
      )}

      {showImageEditorModal && selectedImageSrc && (
        <ProfessionalImageEditor
          imageSrc={selectedImageSrc}
          originalImageUrl={selectedImageOriginalSrc || selectedImageSrc}
          blogId={blogId}
          onClose={() => {
            setShowImageEditorModal(false);
            setSelectedImageSrc("");
            setSelectedImageOriginalSrc("");
          }}
          onSave={handleImageSave}
          onCreditsUsed={onCreditsUsed}
        />
      )}
    </div>
  );
}
