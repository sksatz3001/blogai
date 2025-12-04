"use client";

import { useEffect, useState, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "@/components/ui/button";
import { ImagePromptModal } from "@/components/image-prompt-modal";
import { ProfessionalImageEditor } from "@/components/professional-image-editor";
import { ImageLoading } from "@/lib/tiptap/image-loading";
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
  // Optional callback to trigger auto-save after image edit
  onAutoSave?: () => void;
}

export function TiptapEditor({ content, onChange, editable = true, blogId, onAutoSave }: TiptapEditorProps) {
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
      Image.configure({
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

    try {
      let finalUrl = editedImageSrc;
      let uploadSucceeded = false;
      
      // If blogId is present, attempt server upload + persistence
      if (blogId) {
        try {
          const res = await fetch("/api/images/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageData: editedImageSrc, blogId }),
          });
          
          if (res.ok) {
            const up = await res.json();
            if (up?.imageUrl) {
              finalUrl = up.imageUrl;
              uploadSucceeded = true;
              console.log("Image uploaded successfully:", finalUrl);
            }
          } else {
            const errorData = await res.json().catch(() => ({}));
            console.warn("Image upload failed:", res.status, errorData);
            // If upload fails due to backend not configured, show warning
            if (errorData?.code === 'NO_BACKEND') {
              toast.error("Image storage not configured. Please contact admin to set up IMAGE_BACKEND_BASE.");
              // Don't insert the base64 - it will cause save issues
              return;
            }
          }
        } catch (uploadError) {
          console.error("Image upload error:", uploadError);
        }
      }

      // If upload failed and we still have base64, warn and don't proceed
      if (!uploadSucceeded && editedImageSrc.startsWith('data:')) {
        // Check size - base64 images over 500KB will likely cause issues
        const sizeKB = Math.round(editedImageSrc.length / 1024);
        if (sizeKB > 500) {
          toast.error(`Image too large (${sizeKB}KB). Image storage backend required for edited images.`);
          console.error("Image too large for inline storage:", sizeKB, "KB");
          return;
        }
        toast.warning("Image saved locally. Configure image backend for permanent storage.");
      }

      // Find and replace the image in the editor
      const { state } = editor;
      const { doc } = state;

      // Proxy edited image only if it's an external URL (not base64)
      const storageBase = (process.env.NEXT_PUBLIC_IMAGE_STORAGE_BASE || process.env.IMAGE_STORAGE_BASE || '').replace(/\/$/, '');
      const isAbs = /^https?:\/\//i.test(finalUrl);
      const isStorage = storageBase && isAbs && finalUrl.startsWith(storageBase);
      const proxiedEditedUrl = isAbs && !isStorage
        ? `/api/images/proxy?url=${encodeURIComponent(finalUrl)}`
        : finalUrl;

      // Find and preserve original image alt text
      let originalAlt: string | undefined;
      
      doc.descendants((node) => {
        if (node.type.name === 'image' && (node.attrs.src === selectedImageOriginalSrc || node.attrs.src === selectedImageSrc)) {
          originalAlt = node.attrs.alt;
          return false;
        }
        return true;
      });

      doc.descendants((node, pos) => {
        if (node.type.name === 'image' && (node.attrs.src === selectedImageOriginalSrc || node.attrs.src === selectedImageSrc)) {
          // Build attrs
          const newAttrs: Record<string, any> = { src: proxiedEditedUrl };
          if (originalAlt) newAttrs.alt = originalAlt;
          
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
        return true;
      });
      
      // Show success message
      if (uploadSucceeded) {
        toast.success("Image edited and saved!");
      }
    } catch (e) {
      console.error("Failed to handle edited image:", e);
      toast.error("Failed to save edited image");
    } finally {
      setShowImageEditorModal(false);
      setSelectedImageSrc("");
      setSelectedImageOriginalSrc("");
      
      // Trigger auto-save after image is replaced (only if upload succeeded)
      if (onAutoSave) {
        setTimeout(() => {
          onAutoSave();
        }, 500);
      }
    }
  };

  const setLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="glass border-2 border-[hsl(var(--border))] rounded-2xl overflow-hidden flex flex-col max-h-[70vh]">
      {editable && (
        <div className="flex-shrink-0 border-b-2 border-[hsl(var(--border))] p-3 flex flex-wrap gap-1.5 bg-[hsl(var(--card))]/50 backdrop-blur-sm shadow-lg sticky top-0 z-10">
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

          {/* Edit Image button hidden for now - backend upload endpoint not available
          {selectedImageSrc && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowImageEditorModal(true)}
              className="bg-[hsl(var(--primary))]/20 text-[hsl(var(--primary))]"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
          */}
        </div>
      )}

      <div ref={scrollContainerRef} onClick={handleImageClick} className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {showImagePromptModal && (
        <ImagePromptModal
          onClose={() => setShowImagePromptModal(false)}
          onSubmit={handleImagePromptSubmit}
          isGenerating={isGeneratingImage}
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
        />
      )}
    </div>
  );
}
