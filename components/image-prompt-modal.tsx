"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePromptModalProps {
  onClose: () => void;
  onSubmit: (prompt: string) => void;
  isGenerating?: boolean;
  // Blog context for AI-generated suggestions
  blogTitle?: string;
  blogContent?: string;
}

export function ImagePromptModal({ 
  onClose, 
  onSubmit, 
  isGenerating = false,
  blogTitle,
  blogContent,
}: ImagePromptModalProps) {
  const [prompt, setPrompt] = useState("");
  const [placeholder, setPlaceholder] = useState("Describe a real-world scene — e.g. 'a person working at a laptop in a bright modern office' or 'a team brainstorming around a whiteboard'. Keep it simple and realistic for best results...");
  const [suggestions, setSuggestions] = useState<string[]>([
    "A professional working at a clean desk with a laptop, soft natural light",
    "A team meeting in a modern glass-walled conference room",
    "Close-up of hands typing on a laptop with coffee nearby",
    "A bright, minimalist workspace with plants and natural light",
  ]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Fetch AI-generated suggestions when modal opens
  useEffect(() => {
    if (blogTitle || blogContent) {
      fetchSuggestions();
    }
  }, [blogTitle, blogContent]);

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const response = await fetch("/api/images/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: blogTitle, content: blogContent }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.placeholder) {
          setPlaceholder(data.placeholder);
        }
        if (data.suggestions && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
        }
      }
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      // Keep default suggestions on error
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      onSubmit(prompt);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Generate Image
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Describe your vision and we&apos;ll create it
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="w-8 h-8 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-3">
            <label htmlFor="image-prompt" className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Wand2 size={16} className="text-primary" />
              Image Description
            </label>
            <textarea
              id="image-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={placeholder}
              className="w-full p-4 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground resize-vertical min-h-[120px] max-h-[250px] transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-background disabled:opacity-60 disabled:cursor-not-allowed"
              rows={5}
              autoFocus
              disabled={isGenerating}
            />
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles size={14} className="text-primary" />
              Be specific and descriptive for better results
            </p>
          </div>

          {/* AI-generated example prompts */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-medium text-muted-foreground">
                Quick examples:
              </p>
              {loadingSuggestions && (
                <Loader2 size={12} className="animate-spin text-primary" />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setPrompt(suggestion)}
                  disabled={isGenerating || loadingSuggestions}
                  className="px-3 py-1.5 text-xs font-medium bg-muted hover:bg-primary/10 hover:text-primary text-foreground rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-border hover:border-primary/30"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-border">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-2" />
                  Generate Image
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
