"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Wand2, Type, Sliders, Palette, Rotate3D, Maximize2, Crop, Save, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageEditorModalProps {
  imageSrc: string; // display (may be proxied)
  originalImageUrl: string; // original direct S3 URL
  blogId?: number | string;
  onClose: () => void;
  onSave: (editedImageSrc: string) => void; // fallback manual save
}

type EditorTab = "ai" | "text" | "adjust" | "filters" | "transform" | "resize" | "crop";

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  isDragging?: boolean;
}

interface Adjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  exposure: number;
  temperature: number;
  vignette: number;
}

export function ImageEditorModal({ imageSrc, originalImageUrl, blogId, onClose, onSave }: ImageEditorModalProps) {
  const [mounted, setMounted] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<EditorTab>("adjust");
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  const [adjustments, setAdjustments] = useState<Adjustments>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    exposure: 0,
    temperature: 0,
    vignette: 0,
  });
  const [selectedFilter, setSelectedFilter] = useState<string>("none");
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string>("original");
  const [isCropping, setIsCropping] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // ESC key to close modal
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [onClose]);

  const applyPresetFilter = useCallback((ctx: CanvasRenderingContext2D, filter: string) => {
    switch (filter) {
      case "grayscale":
        ctx.filter += " grayscale(100%)";
        break;
      case "sepia":
        ctx.filter += " sepia(100%)";
        break;
      case "vintage":
        ctx.filter += " sepia(50%) contrast(110%) brightness(95%)";
        break;
      case "dramatic":
        ctx.filter += " contrast(150%) saturate(130%) brightness(90%)";
        break;
      case "cool":
        ctx.filter += " hue-rotate(180deg) saturate(120%)";
        break;
      case "warm":
        ctx.filter += " hue-rotate(-20deg) saturate(130%)";
        break;
    }
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = img.width;
    canvas.height = img.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Apply transformations
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Apply filters
    let filterString = "";
    filterString += `brightness(${adjustments.brightness}%) `;
    filterString += `contrast(${adjustments.contrast}%) `;
    filterString += `saturate(${adjustments.saturation}%) `;
    filterString += `hue-rotate(${adjustments.hue}deg) `;
    filterString += `blur(${adjustments.blur}px)`;
    ctx.filter = filterString;

    // Apply preset filter
    if (selectedFilter !== "none") {
      applyPresetFilter(ctx, selectedFilter);
    }

    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Restore context
    ctx.restore();

    // Apply exposure (overlay)
    if (adjustments.exposure !== 0) {
      ctx.globalCompositeOperation = adjustments.exposure > 0 ? "lighter" : "darken";
      ctx.fillStyle = adjustments.exposure > 0 ? `rgba(255, 255, 255, ${Math.abs(adjustments.exposure) / 100})` : `rgba(0, 0, 0, ${Math.abs(adjustments.exposure) / 100})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
    }

    // Apply temperature
    if (adjustments.temperature !== 0) {
      ctx.globalCompositeOperation = "overlay";
      ctx.fillStyle = adjustments.temperature > 0 ? `rgba(255, 200, 0, ${Math.abs(adjustments.temperature) / 200})` : `rgba(0, 100, 255, ${Math.abs(adjustments.temperature) / 200})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
    }

    // Apply vignette
    if (adjustments.vignette > 0) {
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height) / 2
      );
      gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      gradient.addColorStop(1, `rgba(0, 0, 0, ${adjustments.vignette / 100})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw text overlays
    textOverlays.forEach((overlay) => {
      ctx.font = `${overlay.fontSize}px ${overlay.fontFamily}`;
      ctx.fillStyle = overlay.color;
      ctx.fillText(overlay.text, overlay.x, overlay.y);
    });
  }, [adjustments, selectedFilter, rotation, flipH, flipV, textOverlays, applyPresetFilter]);

  const tabs: { id: EditorTab; label: string; icon: React.ReactNode }[] = [
    { id: "ai", label: "AI Edit", icon: <Wand2 size={16} /> },
    { id: "text", label: "Text", icon: <Type size={16} /> },
    { id: "adjust", label: "Adjust", icon: <Sliders size={16} /> },
    { id: "filters", label: "Filters", icon: <Palette size={16} /> },
    { id: "transform", label: "Transform", icon: <Rotate3D size={16} /> },
    { id: "resize", label: "Resize", icon: <Maximize2 size={16} /> },
    { id: "crop", label: "Crop", icon: <Crop size={16} /> },
  ];

  const filters = [
    { id: "none", label: "None" },
    { id: "grayscale", label: "Grayscale" },
    { id: "sepia", label: "Sepia" },
    { id: "vintage", label: "Vintage" },
    { id: "dramatic", label: "Dramatic" },
    { id: "cool", label: "Cool" },
    { id: "warm", label: "Warm" },
  ];

  const aspectRatios = [
    { id: "original", label: "Original" },
    { id: "1:1", label: "1:1 Square" },
    { id: "16:9", label: "16:9 Landscape" },
    { id: "9:16", label: "9:16 Portrait" },
    { id: "4:3", label: "4:3 Classic" },
    { id: "3:4", label: "3:4 Portrait" },
  ];

  // Load image and draw to canvas
  useEffect(() => {
    setImageLoading(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
      drawCanvas();
      setImageLoading(false);
    };
    img.onerror = (error) => {
      console.error("Failed to load image:", error);
      console.error("Image URL:", imageSrc);
      setImageLoading(false);
    };
  }, [imageSrc, drawCanvas]);

  // Redraw canvas when effects change
  useEffect(() => {
    if (imageRef.current) {
      drawCanvas();
    }
  }, [drawCanvas]);

  const handleAiEdit = async () => {
    // AI-based image editing has been removed
    alert("AI-based image editing has been removed. Please use manual editing tools instead.");
  };

  const addTextOverlay = () => {
    const newText: TextOverlay = {
      id: Date.now().toString(),
      text: "New Text",
      x: 100,
      y: 100,
      fontSize: 48,
      color: "#ffffff",
      fontFamily: "Arial",
    };
    setTextOverlays([...textOverlays, newText]);
    setSelectedTextId(newText.id);
  };

  const updateTextOverlay = (id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays(textOverlays.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTextOverlay = (id: string) => {
    setTextOverlays(textOverlays.filter(t => t.id !== id));
    if (selectedTextId === id) setSelectedTextId(null);
  };

  const resetAdjustments = () => {
    setAdjustments({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      blur: 0,
      exposure: 0,
      temperature: 0,
      vignette: 0,
    });
  };

  const handleSave = async () => {
    // Manual canvas edits -> base64
    const canvas = canvasRef.current;
    if (!canvas) return;
    const editedImageSrc = canvas.toDataURL('image/png');
    onSave(editedImageSrc);
  };

  const selectedText = textOverlays.find(t => t.id === selectedTextId);

  if (!mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[9999] overflow-y-auto"
      onClick={onClose}
      style={{ margin: 0, padding: 0 }}
    >
      <div 
        className="glass rounded-2xl shadow-2xl w-[95vw] max-w-7xl overflow-hidden flex flex-col relative m-4 border-2 border-[#3B4252]"
        style={{ height: '90vh', maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-5 border-b-2 border-[#3B4252] bg-gradient-to-r from-[#2E3440] to-[#3B4252]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#88C0D0] to-[#D08770] rounded-xl flex items-center justify-center">
              <Wand2 size={20} className="text-[#2E3440]" />
            </div>
            <h2 className="text-xl font-bold text-[#ECEFF4]">Image Editor</h2>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave}>
              <Save size={16} className="mr-2" />
              Save Changes
            </Button>
            <Button 
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full hover:bg-[#BF616A]/20 text-[#D8DEE9] hover:text-[#BF616A] transition-colors"
              aria-label="Close editor"
            >
              <X size={20} strokeWidth={2} />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Sidebar - Tools */}
          <div className="w-72 flex-shrink-0 border-r-2 border-[#3B4252] overflow-y-auto bg-[#2E3440]/50">
            {/* Tabs Navigation */}
            <div className="p-3 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-[#88C0D0] to-[#8FBCBB] text-[#2E3440] shadow-lg shadow-[#88C0D0]/20"
                      : "text-[#D8DEE9] hover:bg-[#3B4252]"
                  }`}
                >
                  <div className={`${activeTab === tab.id ? "" : "opacity-60"}`}>
                    {tab.icon}
                  </div>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="border-t-2 border-[#3B4252] my-2"></div>

            {/* Controls Panel */}
            <div className="px-4 pb-4">
            {/* AI Edit Tab - Feature Removed */}
            {activeTab === "ai" && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-[#88C0D0] uppercase tracking-wide mb-3">
                  AI-Powered Editing
                </div>
                <div className="p-4 bg-amber-900/30 border border-amber-600/50 rounded-xl">
                  <p className="text-sm text-amber-300 font-semibold mb-2">⚠️ Feature Removed</p>
                  <p className="text-sm text-amber-200/80">
                    AI-based image editing has been removed. Please use manual editing tools:
                  </p>
                  <ul className="text-xs text-amber-200/70 space-y-1 mt-2">
                    <li>• <strong>Adjust</strong> - Brightness, contrast, saturation</li>
                    <li>• <strong>Text</strong> - Add text overlays</li>
                    <li>• <strong>Crop</strong> - Resize and crop</li>
                  </ul>
                </div>
                <Button
                  onClick={() => setActiveTab('adjust')}
                  className="w-full"
                >
                  <Sliders size={16} className="mr-2" />
                  Use Manual Adjustments
                </Button>
              </div>
            )}

            {/* Text Tab */}
            {activeTab === "text" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-[#88C0D0] uppercase tracking-wide">
                    Text Overlays
                  </div>
                  <Button onClick={addTextOverlay} size="sm" variant="secondary">
                    <Type size={14} className="mr-1" />
                    Add
                  </Button>
                </div>

                {textOverlays.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Type size={32} className="mx-auto text-[#4C566A] mb-3" />
                    <p className="text-sm text-[#D8DEE9]">
                      No text overlays yet.
                    </p>
                    <p className="text-xs text-[#4C566A] mt-1">
                      Click &quot;Add&quot; to start.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {textOverlays.map((overlay) => (
                      <div
                        key={overlay.id}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                          selectedTextId === overlay.id
                            ? "border-[#88C0D0] bg-[#88C0D0]/10 shadow-md"
                            : "border-[#434C5E] hover:border-[#88C0D0]/50"
                        }`}
                        onClick={() => setSelectedTextId(overlay.id)}
                      >
                        <input
                          type="text"
                          value={overlay.text}
                          onChange={(e) => updateTextOverlay(overlay.id, { text: e.target.value })}
                          className="w-full p-2 mb-3 border-2 border-[#434C5E] rounded-lg bg-[#3B4252] text-[#ECEFF4] placeholder:text-[#4C566A] focus:outline-none focus:border-[#88C0D0] focus:ring-2 focus:ring-[#88C0D0]/20 text-sm"
                          placeholder="Enter text..."
                        />
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-xs font-medium text-[#D8DEE9]">Size</label>
                              <span className="text-xs text-[#88C0D0] font-semibold">{overlay.fontSize}px</span>
                            </div>
                            <input
                              type="range"
                              min="12"
                              max="120"
                              value={overlay.fontSize}
                              onChange={(e) => updateTextOverlay(overlay.id, { fontSize: parseInt(e.target.value) })}
                              className="w-full h-2 bg-[#434C5E] rounded-lg appearance-none cursor-pointer accent-[#88C0D0]"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-[#D8DEE9] block mb-1">Color</label>
                            <input
                              type="color"
                              value={overlay.color}
                              onChange={(e) => updateTextOverlay(overlay.id, { color: e.target.value })}
                              className="w-full h-10 rounded-lg cursor-pointer border-2 border-[#434C5E]"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTextOverlay(overlay.id);
                          }}
                          variant="destructive"
                          size="sm"
                          className="w-full mt-3"
                        >
                          Delete Text
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Adjust Tab */}
            {activeTab === "adjust" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-[#88C0D0] uppercase tracking-wide">
                    Adjustments
                  </div>
                  <Button onClick={resetAdjustments} size="sm" variant="outline" className="h-7 text-xs">
                    <Undo2 size={12} className="mr-1" />
                    Reset
                  </Button>
                </div>

                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
                  {Object.entries(adjustments).map(([key, value]) => (
                    <div key={key} className="bg-[#3B4252] p-3 rounded-xl border-2 border-[#434C5E]">
                      <label className="text-sm font-medium text-[#ECEFF4] capitalize flex justify-between mb-2">
                        <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="text-[#88C0D0] font-bold">{value}{key === "hue" ? "°" : key === "blur" ? "px" : "%"}</span>
                      </label>
                      <input
                        type="range"
                        min={key === "hue" ? -180 : key === "blur" ? 0 : key === "exposure" || key === "temperature" || key === "vignette" ? 0 : 0}
                        max={key === "hue" ? 180 : key === "blur" ? 20 : key === "exposure" || key === "temperature" ? 100 : key === "vignette" ? 100 : 200}
                        value={key === "exposure" || key === "temperature" ? Math.abs(value) : value}
                        onChange={(e) => setAdjustments({ ...adjustments, [key]: parseInt(e.target.value) })}
                        className="w-full h-2 bg-[#434C5E] rounded-lg appearance-none cursor-pointer accent-[#88C0D0]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters Tab */}
            {activeTab === "filters" && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-[#88C0D0] uppercase tracking-wide mb-3">
                  Preset Filters
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedFilter(filter.id)}
                      className={`p-3 rounded-xl border-2 text-xs font-semibold transition-all hover:scale-105 ${
                        selectedFilter === filter.id
                          ? "border-[#88C0D0] bg-gradient-to-br from-[#88C0D0]/20 to-[#D08770]/20 text-[#88C0D0] shadow-md"
                          : "border-[#434C5E] hover:border-[#88C0D0]/50 text-[#D8DEE9] bg-[#3B4252]"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Transform Tab */}
            {activeTab === "transform" && (
              <div className="space-y-5">
                <div className="text-xs font-bold text-[#88C0D0] uppercase tracking-wide mb-3">
                  Transform Image
                </div>

                <div className="bg-[#3B4252] p-4 rounded-xl border-2 border-[#434C5E]">
                  <label className="text-sm font-medium text-[#ECEFF4] flex justify-between mb-2">
                    <span>Rotation</span>
                    <span className="text-[#88C0D0] font-bold">{rotation}°</span>
                  </label>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#434C5E] rounded-lg appearance-none cursor-pointer accent-[#88C0D0]"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-[#D8DEE9] mb-2">Flip Options</p>
                  <Button
                    onClick={() => setFlipH(!flipH)}
                    variant={flipH ? "default" : "outline"}
                    className="w-full"
                  >
                    {flipH ? "✓ " : ""}Flip Horizontal
                  </Button>
                  <Button
                    onClick={() => setFlipV(!flipV)}
                    variant={flipV ? "default" : "outline"}
                    className="w-full"
                  >
                    {flipV ? "✓ " : ""}Flip Vertical
                  </Button>
                </div>
              </div>
            )}

            {/* Resize Tab */}
            {activeTab === "resize" && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-[#88C0D0] uppercase tracking-wide mb-3">
                  Aspect Ratios
                </div>

                <div className="space-y-2">
                  {aspectRatios.map((ratio) => (
                    <button
                      key={ratio.id}
                      onClick={() => setAspectRatio(ratio.id)}
                      className={`w-full p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        aspectRatio === ratio.id
                          ? "border-[#88C0D0] bg-gradient-to-r from-[#88C0D0]/20 to-[#D08770]/20 text-[#88C0D0] shadow-md"
                          : "border-[#434C5E] hover:border-[#88C0D0]/50 text-[#D8DEE9] bg-[#3B4252]"
                      }`}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Crop Tab */}
            {activeTab === "crop" && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-[#88C0D0] uppercase tracking-wide mb-3">
                  Crop Image
                </div>

                <div className="glass border-2 border-[#88C0D0]/30 rounded-xl p-4 text-center">
                  <Crop size={32} className="mx-auto text-[#88C0D0] mb-2" />
                  <p className="text-sm text-[#ECEFF4] mb-1">
                    Coming Soon
                  </p>
                  <p className="text-xs text-[#D8DEE9]">
                    Use the resize tab to change aspect ratios.
                  </p>
                </div>

                <Button
                  onClick={() => setIsCropping(!isCropping)}
                  variant={isCropping ? "default" : "outline"}
                  className="w-full"
                  disabled
                >
                  {isCropping ? "Apply Crop" : "Start Cropping"}
                </Button>
              </div>
            )}
            </div>
          </div>

          {/* Canvas Preview - Right Side */}
          <div className="flex-1 flex items-center justify-center p-6 bg-[#1E222A] overflow-hidden">
            <div className="relative max-w-full max-h-full flex items-center justify-center">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1E222A] z-10">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-[#88C0D0] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[#D8DEE9] text-sm font-medium">Loading image...</p>
                  </div>
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="rounded-lg shadow-2xl border-2 border-[#434C5E] object-contain"
                style={{ maxHeight: "calc(90vh - 150px)", maxWidth: "calc(95vw - 350px)", opacity: imageLoading ? 0 : 1 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
