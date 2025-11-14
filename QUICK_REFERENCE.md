# Image Generation & Editing - Quick Reference

## File Structure
```
/home/sk/Contendo-new-version/
├── components/
│   ├── image-prompt-modal.tsx          # Modal for entering image prompts
│   ├── image-editor-modal.tsx          # 7-tab comprehensive image editor
│   └── tiptap-editor.tsx               # Enhanced with image generation/editing
├── lib/
│   ├── gemini-service.ts               # AI service functions
│   └── tiptap/
│       └── image-loading.tsx           # Custom loading state extension
└── app/
    └── api/
        └── images/
            ├── generate/route.ts       # Image generation endpoint
            └── edit-with-ai/route.ts   # AI image editing endpoint
```

## Quick Start

### 1. Generate an Image
```typescript
// User clicks Image button → Modal opens
// User enters: "A beautiful sunset over mountains"
// System flow:
1. ImagePromptModal submits prompt
2. handleImagePromptSubmit() inserts ImageLoading node
3. Calls /api/images/generate
4. Gemini enhances prompt
5. Pollinations generates image
6. Loading node replaced with Image node
```

### 2. Edit an Image
```typescript
// User clicks on image in editor
// Edit button appears in toolbar
// User clicks Edit → ImageEditorModal opens
// System flow:
1. handleImageClick() captures image src
2. User modifies in editor (AI, text, filters, etc.)
3. Clicks Save Changes
4. handleImageSave() finds and replaces image node
```

## Component Props

### ImagePromptModal
```typescript
interface ImagePromptModalProps {
  onClose: () => void;
  onSubmit: (prompt: string) => void;
  isGenerating?: boolean;
}
```

### ImageEditorModal
```typescript
interface ImageEditorModalProps {
  imageSrc: string;
  onClose: () => void;
  onSave: (editedImageSrc: string) => void;
}
```

### TiptapEditor (Enhanced)
```typescript
interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
}
```

## API Endpoints

### POST /api/images/generate
```bash
curl -X POST http://localhost:3000/api/images/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A serene mountain landscape"}'

# Response:
{
  "imageUrl": "https://image.pollinations.ai/prompt/...",
  "enhancedPrompt": "A breathtaking serene mountain landscape..."
}
```

### POST /api/images/edit-with-ai
```bash
curl -X POST http://localhost:3000/api/images/edit-with-ai \
  -H "Content-Type: application/json" \
  -d '{
    "imageData": "data:image/png;base64,...",
    "prompt": "Add sunlight and make it brighter"
  }'

# Response:
{
  "imageUrl": "https://image.pollinations.ai/prompt/..."
}
```

## Gemini Service Functions

### enhancePromptWithGemini
```typescript
const enhancedPrompt = await enhancePromptWithGemini("mountain sunset");
// Returns: "A breathtaking mountain sunset with vibrant orange..."
```

### generateImageWithPollinations
```typescript
const imageUrl = await generateImageWithPollinations(enhancedPrompt);
// Returns: "https://image.pollinations.ai/prompt/..."
```

### editImageWithGemini
```typescript
const newImageUrl = await editImageWithGemini(base64Image, "add snow");
// Returns: New image URL with modifications applied
```

## Editor Tabs Reference

| Tab | Features | Controls |
|-----|----------|----------|
| **AI Edit** | Natural language modifications | Textarea + Generate button |
| **Text** | Multiple text overlays | Text, size, color, position |
| **Adjust** | 8 adjustment sliders | Brightness, contrast, saturation, hue, blur, exposure, temperature, vignette |
| **Filters** | 7 preset filters | None, Grayscale, Sepia, Vintage, Dramatic, Cool, Warm |
| **Transform** | Rotation and flips | Rotation slider, flip H/V buttons |
| **Resize** | 6 aspect ratios | Original, 1:1, 16:9, 9:16, 4:3, 3:4 |
| **Crop** | *(Coming soon)* | Placeholder UI |

## Keyboard Shortcuts (Toolbar)

| Action | Shortcut | Icon |
|--------|----------|------|
| Bold | Ctrl+B | **B** |
| Italic | Ctrl+I | *I* |
| Heading 2 | - | H2 |
| Heading 3 | - | H3 |
| Bullet List | - | • |
| Ordered List | - | 1. |
| Align Left | - | ⬅ |
| Align Center | - | ⬌ |
| Align Right | - | ➡ |
| Link | - | 🔗 |
| **Image** | - | 📷 |
| **Edit** | - | ✏️ |

## Styling Classes

### Modal Backdrop
```css
bg-black/60 backdrop-blur-sm
```

### Loading Animation
```css
animate-spin border-2 border-blue-600 border-t-transparent
```

### Button Variants
```typescript
variant="ghost"    // Transparent with hover
variant="outline"  // Border only
variant="default"  // Solid fill
variant="destructive"  // Red for delete
```

### Gradient Backgrounds
```css
bg-gradient-to-br from-blue-600 to-purple-600
```

## Error Handling

### API Errors
```typescript
try {
  const response = await fetch("/api/images/generate", {...});
  if (!response.ok) throw new Error("Failed to generate");
  const data = await response.json();
} catch (error) {
  console.error("Error:", error);
  alert("Failed to generate image. Please try again.");
  // Cleanup loading state
}
```

### Canvas Errors
```typescript
const ctx = canvas.getContext("2d");
if (!ctx) return; // Guard clause

// Safe image operations
if (!imageRef.current) return;
```

## Testing Checklist

### Image Generation
- [ ] Click Image button opens modal
- [ ] Enter prompt and submit
- [ ] Loading animation appears
- [ ] Image replaces loading state
- [ ] Error handling shows alert
- [ ] Modal closes after success

### Image Editing
- [ ] Click image shows Edit button
- [ ] Edit button opens editor modal
- [ ] All 7 tabs render correctly
- [ ] Adjustments update canvas preview
- [ ] Save button replaces image
- [ ] Close button resets state

### Edge Cases
- [ ] Empty prompt shows disabled button
- [ ] Multiple rapid clicks prevented
- [ ] Large images load properly
- [ ] Network errors handled gracefully
- [ ] Invalid base64 data rejected

## Performance Tips

### Canvas Optimization
```typescript
// Use useCallback to prevent unnecessary redraws
const drawCanvas = useCallback(() => {
  // Drawing logic
}, [dependencies]);
```

### Image Loading
```typescript
// Add crossOrigin for external images
const img = new Image();
img.crossOrigin = "anonymous";
img.src = imageUrl;
```

### State Management
```typescript
// Batch state updates
setShowModal(false);
setSelectedImage("");
// Better than separate setState calls
```

## Debugging

### Console Logs
```typescript
console.log("Updating editor content, length:", content.length);
console.log("Image generation started:", prompt);
console.error("AI edit error:", error);
```

### React DevTools
- Check component state
- Verify prop changes
- Monitor re-renders

### Network Tab
- Verify API calls
- Check response times
- Inspect image URLs

## Common Issues

### Image Not Appearing
1. Check CORS on image URL
2. Verify `crossOrigin="anonymous"`
3. Check network tab for 404s
4. Confirm base64 format correct

### Editor Not Updating
1. Verify `onChange` callback
2. Check content prop changes
3. Ensure useEffect dependencies correct
4. Test `editor.commands.setContent()`

### Modal Not Closing
1. Check state reset in onClose
2. Verify backdrop onClick handler
3. Test escape key listener
4. Confirm z-index not overlapped

## Resources

- **Next.js**: https://nextjs.org/docs
- **Tiptap**: https://tiptap.dev/
- **Gemini AI**: https://ai.google.dev/
- **Pollinations**: https://pollinations.ai/
- **Canvas API**: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API

---

**Last Updated**: January 2025  
**Version**: 1.0.0
