"use client";

import { useState } from "react";
import { X, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePromptModalProps {
  onClose: () => void;
  onSubmit: (prompt: string) => void;
  isGenerating?: boolean;
}

export function ImagePromptModal({ onClose, onSubmit, isGenerating = false }: ImagePromptModalProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isGenerating) {
      onSubmit(prompt);
    }
  };

  const examplePrompts = [
    "A serene mountain landscape at sunset",
    "Modern office with plants",
    "Professional product photography",
    "Abstract geometric pattern",
  ];

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="glass rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border-2 border-[#3B4252]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-7 border-b-2 border-[#3B4252]">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#88C0D0] to-[#D08770] flex items-center justify-center flex-shrink-0">
              <Sparkles size={24} className="text-[#2E3440] animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#ECEFF4]">
                Generate Image
              </h2>
              <p className="text-sm text-[#D8DEE9] mt-1">
                Describe your vision and we&apos;ll create it
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="w-9 h-9 rounded-lg bg-[#3B4252] hover:bg-[#434C5E] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={20} className="text-[#D8DEE9]" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-7 flex-1 overflow-y-auto">
          <div className="space-y-4">
            <label htmlFor="image-prompt" className="flex items-center gap-2 text-sm font-semibold text-[#ECEFF4]">
              <Wand2 size={16} className="text-[#88C0D0]" />
              Image Description
            </label>
            <textarea
              id="image-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A serene mountain landscape at sunset with vibrant orange and pink hues reflecting on a calm lake, surrounded by pine trees..."
              className="w-full p-4 border-2 border-[#434C5E] rounded-xl text-sm text-[#ECEFF4] placeholder:text-[#4C566A] resize-vertical min-h-[120px] max-h-[250px] transition-all focus:outline-none focus:border-[#88C0D0] focus:ring-2 focus:ring-[#88C0D0]/20 bg-[#3B4252] disabled:opacity-60 disabled:cursor-not-allowed"
              rows={5}
              autoFocus
              disabled={isGenerating}
            />
            <p className="flex items-center gap-2 text-xs text-[#D8DEE9]">
              <Sparkles size={14} className="text-[#88C0D0]" />
              Be specific and descriptive for better results
            </p>
          </div>

          {/* Example prompts */}
          <div className="mt-6">
            <p className="text-xs font-semibold text-[#D8DEE9] mb-3">
              Quick examples:
            </p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((example, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setPrompt(example)}
                  disabled={isGenerating}
                  className="px-3 py-1.5 text-xs font-medium bg-[#3B4252] hover:bg-[#434C5E] text-[#D8DEE9] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-[#434C5E]"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-5 mt-5 border-t-2 border-[#3B4252]">
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
                  <div className="w-4 h-4 border-2 border-[#2E3440] border-t-transparent rounded-full animate-spin mr-2" />
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
