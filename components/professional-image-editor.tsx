"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { 
  X, Save, Loader2, Type, Crop, RotateCw, Palette, 
  Square, Circle, Move, ZoomIn, ZoomOut, ImageIcon,
  Undo2, Redo2, Sliders, Brush, Sparkles, Wand2,
  FlipHorizontal, FlipVertical, Scissors, Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HexColorPicker } from "react-colorful";
import { toast } from "sonner";

// Fabric will be dynamically imported
let fabric: any = null;

type Tool = 'select' | 'ai' | 'draw' | 'text' | 'shape' | 'filter' | 'resize';

const SIZE_PRESETS = [
  { name: '1:1 Square', width: 1080, height: 1080, ratio: '1:1' },
  { name: '16:9 Landscape', width: 1920, height: 1080, ratio: '16:9' },
  { name: '9:16 Portrait', width: 1080, height: 1920, ratio: '9:16' },
];

interface ProfessionalImageEditorProps {
  imageSrc: string;
  originalImageUrl: string;
  blogId?: number | string;
  onClose: () => void;
  onSave: (editedImageUrl: string) => void;
}

export function ProfessionalImageEditor({
  imageSrc,
  originalImageUrl,
  blogId,
  onClose,
  onSave,
}: ProfessionalImageEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [color, setColor] = useState("#3b82f6");
  const [brushSize, setBrushSize] = useState(5);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [blur, setBlur] = useState(0);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiEditing, setIsAiEditing] = useState(false);
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textUnderline, setTextUnderline] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('none');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const originalImageRef = useRef<string>(imageSrc);
  const originalImageScaleRef = useRef<number>(1);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted || !canvasRef.current) return;

    const initEditor = async () => {
      try {
        setLoading(true);
        
        if (!fabric) {
          const fabricModule = await import('fabric');
          fabric = fabricModule.fabric;
        }

        const canvas = new fabric.Canvas(canvasRef.current, {
          width: 1200,
          height: 700,
          backgroundColor: 'transparent',
        });

        fabricCanvasRef.current = canvas;

        fabric.Image.fromURL(imageSrc, (img: any) => {
          const scale = Math.min(
            (canvas.width! - 100) / img.width!,
            (canvas.height! - 100) / img.height!
          );
          
          // Store the original scale for later use
          originalImageScaleRef.current = scale;
          
          img.scale(scale);
          img.set({
            left: canvas.width! / 2,
            top: canvas.height! / 2,
            originX: 'center',
            originY: 'center',
            selectable: false,
          });
          
          canvas.add(img);
          canvas.renderAll();
          setLoading(false);
        }, { crossOrigin: 'anonymous' });

      } catch (error) {
        console.error("Failed to initialize editor:", error);
        setLoading(false);
      }
    };

    initEditor();

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
  }, [mounted, imageSrc]);

  const handleToolChange = (tool: Tool) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    setActiveTool(tool);
    canvas.isDrawingMode = false;
    canvas.selection = true;

    switch (tool) {
      case 'select':
        break;
      case 'draw':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = color;
        canvas.freeDrawingBrush.width = brushSize;
        break;
      case 'text':
        const text = new fabric.IText('Click to edit text', {
          left: 100,
          top: 100,
          fill: color,
          fontSize: fontSize,
          fontFamily: fontFamily,
          fontWeight: textBold ? 'bold' : 'normal',
          fontStyle: textItalic ? 'italic' : 'normal',
          underline: textUnderline,
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        break;
    }
  };

  const addShape = (type: 'rect' | 'circle' | 'triangle' | 'line' | 'arrow' | 'star') => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    let shape;
    if (type === 'rect') {
      shape = new fabric.Rect({
        left: 100,
        top: 100,
        width: 200,
        height: 150,
        fill: color,
        stroke: '#1e293b',
        strokeWidth: 2,
      });
    } else if (type === 'circle') {
      shape = new fabric.Circle({
        left: 100,
        top: 100,
        radius: 80,
        fill: color,
        stroke: '#1e293b',
        strokeWidth: 2,
      });
    } else if (type === 'triangle') {
      shape = new fabric.Triangle({
        left: 100,
        top: 100,
        width: 150,
        height: 150,
        fill: color,
        stroke: '#1e293b',
        strokeWidth: 2,
      });
    } else if (type === 'line') {
      shape = new fabric.Line([50, 100, 250, 100], {
        stroke: color,
        strokeWidth: 4,
      });
    } else if (type === 'arrow') {
      const line = new fabric.Line([50, 100, 200, 100], {
        stroke: color,
        strokeWidth: 4,
      });
      const triangle = new fabric.Triangle({
        left: 200,
        top: 100,
        width: 20,
        height: 20,
        fill: color,
        angle: 90,
        originX: 'center',
        originY: 'center',
      });
      const group = new fabric.Group([line, triangle], {
        left: 100,
        top: 100,
      });
      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.renderAll();
      return;
    } else if (type === 'star') {
      const points = [];
      const spikes = 5;
      const outerRadius = 80;
      const innerRadius = 40;
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI * i) / spikes;
        points.push({
          x: 100 + radius * Math.sin(angle),
          y: 100 - radius * Math.cos(angle),
        });
      }
      shape = new fabric.Polygon(points, {
        fill: color,
        stroke: '#1e293b',
        strokeWidth: 2,
      });
    }
    
    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
  };

  const applyFilter = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    objects.forEach((obj: any) => {
      if (obj.type === 'image') {
        obj.filters = [];
        
        // Apply preset filter if selected
        switch (activeFilter) {
          case 'grayscale':
            obj.filters.push(new fabric.Image.filters.Grayscale());
            break;
          case 'sepia':
            obj.filters.push(new fabric.Image.filters.Sepia());
            break;
          case 'vintage':
            obj.filters.push(new fabric.Image.filters.Sepia());
            obj.filters.push(new fabric.Image.filters.Brightness({ brightness: -0.1 }));
            obj.filters.push(new fabric.Image.filters.Contrast({ contrast: 0.1 }));
            break;
          case 'polaroid':
            obj.filters.push(new fabric.Image.filters.Brightness({ brightness: 0.1 }));
            obj.filters.push(new fabric.Image.filters.Contrast({ contrast: 0.2 }));
            break;
          case 'kodachrome':
            obj.filters.push(new fabric.Image.filters.Contrast({ contrast: 0.3 }));
            obj.filters.push(new fabric.Image.filters.Saturation({ saturation: 0.3 }));
            break;
          case 'technicolor':
            obj.filters.push(new fabric.Image.filters.Contrast({ contrast: 0.2 }));
            obj.filters.push(new fabric.Image.filters.Brightness({ brightness: 0.15 }));
            break;
          case 'blackwhite':
            obj.filters.push(new fabric.Image.filters.BlackWhite());
            break;
          case 'brownie':
            obj.filters.push(new fabric.Image.filters.Brownie());
            break;
          case 'invert':
            obj.filters.push(new fabric.Image.filters.Invert());
            break;
          case 'pixelate':
            obj.filters.push(new fabric.Image.filters.Pixelate({ blocksize: 8 }));
            break;
        }
        
        // Apply manual adjustments
        if (brightness !== 0) {
          obj.filters.push(new fabric.Image.filters.Brightness({ brightness: brightness / 100 }));
        }
        if (contrast !== 0) {
          obj.filters.push(new fabric.Image.filters.Contrast({ contrast: contrast / 100 }));
        }
        if (saturation !== 0) {
          obj.filters.push(new fabric.Image.filters.Saturation({ saturation: saturation / 100 }));
        }
        if (blur > 0) {
          obj.filters.push(new fabric.Image.filters.Blur({ blur: blur / 20 }));
        }
        
        obj.applyFilters();
      }
    });
    
    canvas.renderAll();
  };

  const handleAiEdit = async () => {
    if (!aiPrompt.trim() || isAiEditing) return;
    if (!originalImageUrl) {
      toast.error('Original image URL missing');
      return;
    }

    setIsAiEditing(true);
    try {
      const response = await fetch('/api/images/edit-with-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sourceImageUrl: originalImageUrl, 
          prompt: aiPrompt, 
          blogId 
        }),
      });

      if (!response.ok) throw new Error("Failed to edit image with AI");

      const data = await response.json();
      const editedUrl = data.editedImageUrl || data.imageUrl;
      
      if (!editedUrl) throw new Error('No edited image URL returned');

      // Display edited image (proxy if needed for canvas safety)
      const storageBase = (process.env.NEXT_PUBLIC_IMAGE_STORAGE_BASE || process.env.IMAGE_STORAGE_BASE || '').replace(/\/$/, '');
      const isAbs = /^https?:\/\//i.test(editedUrl);
      const isStorage = storageBase && isAbs && editedUrl.startsWith(storageBase);
      const displayUrl = isStorage ? `/api/images/proxy?url=${encodeURIComponent(editedUrl)}` : editedUrl;
      
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      // Remove old image
      const objects = canvas.getObjects();
      const imageObj = objects.find((obj: any) => obj.type === 'image');
      if (imageObj) {
        canvas.remove(imageObj);
      }

      // Load and add the AI-edited image
      fabric.Image.fromURL(displayUrl, (img: any) => {
        if (!img) {
          toast.error("Failed to load edited image");
          setIsAiEditing(false);
          return;
        }
        
        // Use the same scale as the original image to maintain size
        const scale = originalImageScaleRef.current;
        
        img.scale(scale);
        img.set({
          left: canvas.width! / 2,
          top: canvas.height! / 2,
          originX: 'center',
          originY: 'center',
          selectable: false,
        });
        
        canvas.insertAt(img, 0); // Insert at bottom layer
        canvas.renderAll();
        toast.success("AI editing complete!");
        setIsAiEditing(false);
      }, { crossOrigin: 'anonymous' });

      setAiPrompt("");
    } catch (error) {
      console.error("AI edit error:", error);
      toast.error("Failed to edit image with AI");
      setIsAiEditing(false);
    }
  };

  const handleRotate = (angle: number) => {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject();
    if (activeObject) {
      activeObject.rotate((activeObject.angle || 0) + angle);
      canvas.renderAll();
    }
  };

  const handleFlip = (direction: 'horizontal' | 'vertical') => {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject();
    if (activeObject) {
      if (direction === 'horizontal') {
        activeObject.set('flipX', !activeObject.flipX);
      } else {
        activeObject.set('flipY', !activeObject.flipY);
      }
      canvas.renderAll();
    }
  };

  const handleZoom = (zoomIn: boolean) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    const zoom = canvas.getZoom();
    const newZoom = zoomIn ? zoom * 1.1 : zoom / 1.1;
    canvas.setZoom(Math.max(0.1, Math.min(3, newZoom)));
  };

  const handleUndo = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    const objects = canvas.getObjects();
    if (objects.length > 1) {
      canvas.remove(objects[objects.length - 1]);
      canvas.renderAll();
    }
  };

  const handleDelete = () => {
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas?.getActiveObject();
    if (activeObject) {
      canvas.remove(activeObject);
      canvas.renderAll();
    }
  };

  const applyPreset = (preset: typeof SIZE_PRESETS[0]) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const newWidth = preset.width;
    const newHeight = preset.height;
    
    // Get the main image object
    const objects = canvas.getObjects();
    const imageObj = objects.find((obj: any) => obj.type === 'image');
    
    if (!imageObj) return;
    
    // Calculate scale to fit image to new dimensions
    const scale = Math.min(
      (newWidth - 100) / (imageObj.width! * imageObj.scaleX!),
      (newHeight - 100) / (imageObj.height! * imageObj.scaleY!)
    );
    
    // Update canvas size
    canvas.setWidth(newWidth);
    canvas.setHeight(newHeight);
    
    // Scale and center the image
    imageObj.scale(imageObj.scaleX! * scale);
    imageObj.set({
      left: newWidth / 2,
      top: newHeight / 2,
      originX: 'center',
      originY: 'center',
    });
    
    canvas.renderAll();
    toast.success(`Resized to ${preset.name} (${newWidth}×${newHeight})`);
  };

  const handleSave = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    
    setSaving(true);
    try {
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2,
      });
      
      await onSave(dataURL);
      toast.success("Changes applied successfully!");
      
      // Close modal after successful save
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error("Failed to save image:", error);
      toast.error("Failed to apply changes");
      setSaving(false);
    }
  };

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        handleDelete();
      }
    };

    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTool === 'draw' && fabricCanvasRef.current) {
      fabricCanvasRef.current.freeDrawingBrush.color = color;
    }
  }, [color, activeTool]);

  useEffect(() => {
    if (activeTool === 'draw' && fabricCanvasRef.current) {
      fabricCanvasRef.current.freeDrawingBrush.width = brushSize;
    }
  }, [brushSize, activeTool]);

  useEffect(() => {
    if (activeTool === 'filter') {
      applyFilter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brightness, contrast, saturation, blur, activeFilter]);

  useEffect(() => {
    const activeObject = fabricCanvasRef.current?.getActiveObject();
    if (activeObject && activeObject.type === 'i-text') {
      activeObject.set({
        fontSize: fontSize,
        fontFamily: fontFamily,
        fontWeight: textBold ? 'bold' : 'normal',
        fontStyle: textItalic ? 'italic' : 'normal',
        underline: textUnderline,
      });
      fabricCanvasRef.current.renderAll();
    }
  }, [fontSize, fontFamily, textBold, textItalic, textUnderline]);

  if (!mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/95 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div
        className="w-[98vw] h-[98vh] bg-white dark:bg-slate-900 rounded-xl overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="h-16 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Sparkles className="text-white" size={24} />
            <h2 className="text-xl font-bold text-white">Image Editor</h2>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving || loading} className="bg-white text-blue-600 hover:bg-gray-100">
              {saving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Applying Changes...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button onClick={onClose} variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Toolbar */}
          <div className="w-72 bg-gray-50 dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 p-4 overflow-y-auto">
            <div className="space-y-2">
              {[
                { icon: Wand2, tool: 'ai' as Tool, label: 'AI Edit', color: 'purple' },
                { icon: Move, tool: 'select' as Tool, label: 'Select & Move', color: 'blue' },
                { icon: Brush, tool: 'draw' as Tool, label: 'Draw', color: 'green' },
                { icon: Type, tool: 'text' as Tool, label: 'Add Text', color: 'orange' },
                { icon: Square, tool: 'shape' as Tool, label: 'Shapes', color: 'pink' },
                { icon: Sliders, tool: 'filter' as Tool, label: 'Filters', color: 'indigo' },
                { icon: Maximize2, tool: 'resize' as Tool, label: 'Resize', color: 'cyan' },
              ].map(({ icon: Icon, tool, label, color }) => (
                <button
                  key={tool}
                  onClick={() => handleToolChange(tool)}
                  className={`w-full px-4 py-3 rounded-lg flex items-center gap-3 transition-all font-medium ${
                    activeTool === tool
                      ? `bg-${color}-500 text-white shadow-lg`
                      : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
                  }`}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="h-px bg-gray-200 dark:bg-slate-700 my-4" />

            {/* Quick Actions */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => handleRotate(90)} variant="outline" size="sm" className="w-full">
                  <RotateCw size={14} className="mr-1" />
                  Rotate
                </Button>
                <Button onClick={() => handleFlip('horizontal')} variant="outline" size="sm" className="w-full">
                  <FlipHorizontal size={14} className="mr-1" />
                  Flip H
                </Button>
                <Button onClick={() => handleFlip('vertical')} variant="outline" size="sm" className="w-full">
                  <FlipVertical size={14} className="mr-1" />
                  Flip V
                </Button>
                <Button onClick={handleDelete} variant="outline" size="sm" className="w-full text-red-600">
                  <Scissors size={14} className="mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-800 dark:to-slate-900">
            {/* Top Toolbar */}
            <div className="h-14 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Button onClick={handleUndo} variant="ghost" size="sm">
                  <Undo2 size={18} />
                </Button>
                <div className="w-px h-6 bg-gray-300 dark:bg-slate-600 mx-1" />
                <Button onClick={() => handleZoom(true)} variant="ghost" size="sm">
                  <ZoomIn size={18} />
                </Button>
                <Button onClick={() => handleZoom(false)} variant="ghost" size="sm">
                  <ZoomOut size={18} />
                </Button>
              </div>

              {/* Color Picker */}
              {(activeTool === 'draw' || activeTool === 'text' || activeTool === 'shape') && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Color:</span>
                  <div className="relative">
                    <button
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    {showColorPicker && (
                      <div className="absolute top-12 right-0 z-50 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border">
                        <HexColorPicker color={color} onChange={setColor} />
                        <button 
                          onClick={() => setShowColorPicker(false)}
                          className="mt-2 w-full px-3 py-1 bg-gray-100 dark:bg-slate-700 rounded text-sm"
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Canvas */}
            <div ref={containerRef} className="flex-1 flex items-center justify-center p-8 relative">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 z-10">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 size={48} className="text-blue-500 animate-spin" />
                    <p className="text-gray-700 dark:text-gray-300 font-medium">Loading editor...</p>
                  </div>
                </div>
              )}
              <canvas ref={canvasRef} className="shadow-2xl rounded-lg" />
            </div>
          </div>

          {/* Right Panel - Tool Options */}
          <div className="w-80 bg-white dark:bg-slate-800 border-l border-gray-200 dark:border-slate-700 p-6 overflow-y-auto">
            {/* AI Edit Panel */}
            {activeTool === 'ai' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Wand2 className="text-purple-500" size={24} />
                  <h3 className="text-lg font-bold">AI Image Edit</h3>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Describe how you want to modify this image
                </p>
                
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="E.g., make it brighter, add sunlight, change background to beach, make colors more vibrant..."
                  className="w-full p-3 border-2 border-gray-300 dark:border-slate-600 rounded-lg text-sm resize-none min-h-[140px] focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 bg-white dark:bg-slate-700"
                  disabled={isAiEditing}
                />
                
                <Button
                  onClick={handleAiEdit}
                  disabled={!aiPrompt.trim() || isAiEditing}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                  size="lg"
                >
                  {isAiEditing ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      AI Working...
                    </>
                  ) : (
                    <>
                      <Wand2 size={18} className="mr-2" />
                      Apply AI Edit
                    </>
                  )}
                </Button>

                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">💡 Examples:</h4>
                  <ul className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
                    <li>• &quot;Make it brighter and add warmth&quot;</li>
                    <li>• &quot;Change background to sunset&quot;</li>
                    <li>• &quot;Add professional lighting&quot;</li>
                    <li>• &quot;Make colors more saturated&quot;</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Draw Panel */}
            {activeTool === 'draw' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Brush Settings</h3>
                <div>
                  <label className="text-sm font-medium block mb-2">Brush Size: {brushSize}px</label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Text Panel */}
            {activeTool === 'text' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Text Settings</h3>
                
                <div>
                  <label className="text-sm font-medium block mb-2">Font Family</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Courier New">Courier New</option>
                    <option value="Verdana">Verdana</option>
                    <option value="Impact">Impact</option>
                    <option value="Comic Sans MS">Comic Sans MS</option>
                    <option value="Trebuchet MS">Trebuchet MS</option>
                    <option value="Palatino">Palatino</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium block mb-2">Font Size: {fontSize}px</label>
                  <input
                    type="range"
                    min="12"
                    max="120"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium block mb-2">Text Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={() => setTextBold(!textBold)}
                      variant={textBold ? 'default' : 'outline'}
                      size="sm"
                      className="font-bold"
                    >
                      B
                    </Button>
                    <Button
                      onClick={() => setTextItalic(!textItalic)}
                      variant={textItalic ? 'default' : 'outline'}
                      size="sm"
                      className="italic"
                    >
                      I
                    </Button>
                    <Button
                      onClick={() => setTextUnderline(!textUnderline)}
                      variant={textUnderline ? 'default' : 'outline'}
                      size="sm"
                      className="underline"
                    >
                      U
                    </Button>
                  </div>
                </div>
                
                <Button onClick={() => handleToolChange('text')} className="w-full">
                  <Type size={16} className="mr-2" />
                  Add New Text
                </Button>
              </div>
            )}

            {/* Shape Panel */}
            {activeTool === 'shape' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Add Shapes</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => addShape('rect')} variant="outline" className="h-20 flex-col">
                    <Square size={24} className="mb-2" />
                    Rectangle
                  </Button>
                  <Button onClick={() => addShape('circle')} variant="outline" className="h-20 flex-col">
                    <Circle size={24} className="mb-2" />
                    Circle
                  </Button>
                  <Button onClick={() => addShape('triangle')} variant="outline" className="h-20 flex-col">
                    <span className="text-2xl mb-1">△</span>
                    Triangle
                  </Button>
                  <Button onClick={() => addShape('star')} variant="outline" className="h-20 flex-col">
                    <span className="text-2xl mb-1">★</span>
                    Star
                  </Button>
                  <Button onClick={() => addShape('line')} variant="outline" className="h-20 flex-col">
                    <span className="text-2xl mb-1">─</span>
                    Line
                  </Button>
                  <Button onClick={() => addShape('arrow')} variant="outline" className="h-20 flex-col">
                    <span className="text-2xl mb-1">→</span>
                    Arrow
                  </Button>
                </div>
              </div>
            )}

            {/* Filter Panel */}
            {activeTool === 'filter' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Filters & Adjustments</h3>
                
                <div>
                  <label className="text-sm font-medium block mb-2">Photo Filters</label>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { name: 'None', value: 'none' },
                      { name: 'Grayscale', value: 'grayscale' },
                      { name: 'Sepia', value: 'sepia' },
                      { name: 'Vintage', value: 'vintage' },
                      { name: 'Polaroid', value: 'polaroid' },
                      { name: 'Kodachrome', value: 'kodachrome' },
                      { name: 'Technicolor', value: 'technicolor' },
                      { name: 'B&W', value: 'blackwhite' },
                      { name: 'Brownie', value: 'brownie' },
                      { name: 'Invert', value: 'invert' },
                      { name: 'Pixelate', value: 'pixelate' },
                    ].map((filter) => (
                      <Button
                        key={filter.value}
                        onClick={() => setActiveFilter(filter.value)}
                        variant={activeFilter === filter.value ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs"
                      >
                        {filter.name}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="h-px bg-gray-200 dark:bg-slate-700 my-4" />
                
                <div>
                  <label className="text-sm font-medium block mb-2">Manual Adjustments</label>
                </div>
                
                <div>
                  <label className="text-sm font-medium block mb-2">Brightness: {brightness}</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Contrast: {contrast}</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Saturation: {saturation}</label>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={saturation}
                    onChange={(e) => setSaturation(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">Blur: {blur}</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={blur}
                    onChange={(e) => setBlur(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                <Button 
                  onClick={() => {
                    setActiveFilter('none');
                    setBrightness(0);
                    setContrast(0);
                    setSaturation(0);
                    setBlur(0);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Reset All Filters
                </Button>
              </div>
            )}

            {/* Resize Panel */}
            {activeTool === 'resize' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold">Resize Image</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Choose a preset size:</p>
                <div className="space-y-2">
                  {SIZE_PRESETS.map((preset) => (
                    <Button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <ImageIcon size={16} className="mr-2" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{preset.name}</div>
                        {preset.width && (
                          <div className="text-xs text-gray-500">{preset.width} × {preset.height}</div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
