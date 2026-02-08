import { Sparkles, Image as ImageIcon, Wand2, Palette, Type } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ImageFeaturesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
          <Sparkles size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Advanced Image Generation & Editing
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          AI-powered image creation with comprehensive editing tools powered by Gemini AI and Pollinations
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Image Generation Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <ImageIcon size={20} className="text-white" />
              </div>
              <CardTitle>Image Generation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <Sparkles size={18} className="text-primary mt-0.5 flex-shrink-0" />
                <span>AI-enhanced prompts with Gemini 2.0-flash-exp</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles size={18} className="text-primary mt-0.5 flex-shrink-0" />
                <span>Free unlimited image generation via Pollinations AI</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles size={18} className="text-primary mt-0.5 flex-shrink-0" />
                <span>Beautiful loading states with animations</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles size={18} className="text-primary mt-0.5 flex-shrink-0" />
                <span>1024x1024 high-quality images</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles size={18} className="text-primary mt-0.5 flex-shrink-0" />
                <span>Seamless Tiptap editor integration</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Image Editor Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Wand2 size={20} className="text-white" />
              </div>
              <CardTitle>Professional Image Editor</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <Type size={18} className="text-primary mt-0.5 flex-shrink-0" />
                <span><strong className="text-foreground">Text:</strong> Multiple overlays with custom fonts and colors</span>
              </li>
              <li className="flex items-start gap-3">
                <Palette size={18} className="text-primary mt-0.5 flex-shrink-0" />
                <span><strong className="text-foreground">Adjust:</strong> 8 sliders (brightness, contrast, saturation, etc.)</span>
              </li>
              <li className="flex items-start gap-3">
                <Palette size={18} className="text-primary mt-0.5 flex-shrink-0" />
                <span><strong className="text-foreground">Filters:</strong> 7 preset effects (grayscale, sepia, vintage, etc.)</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles size={18} className="text-primary mt-0.5 flex-shrink-0" />
                <span><strong className="text-foreground">Transform:</strong> Rotate, flip horizontal/vertical</span>
              </li>
              <li className="flex items-start gap-3">
                <Wand2 size={18} className="text-primary mt-0.5 flex-shrink-0" />
                <span><strong className="text-foreground">Draw:</strong> Freehand drawing and annotations</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Technical Details */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Technical Implementation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-base font-semibold text-primary mb-3">Frontend</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• React 18 with TypeScript</li>
                <li>• Tiptap rich text editor</li>
                <li>• Custom node extensions</li>
                <li>• Fabric.js canvas editing</li>
                <li>• Radix UI primitives</li>
                <li>• Tailwind CSS styling</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-semibold text-primary mb-3">Backend</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Next.js 15 App Router</li>
                <li>• Server-side API routes</li>
                <li>• OpenAI DALL-E 3 integration</li>
                <li>• Database image storage</li>
                <li>• Base64 image handling</li>
                <li>• Error handling & logging</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-semibold text-primary mb-3">AI Services</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• OpenAI DALL-E 3</li>
                <li>• Smart prompt generation</li>
                <li>• Topic-aware images</li>
                <li>• Infographic styles</li>
                <li>• Section-specific visuals</li>
                <li>• 1024×1024 resolution</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Diagram */}
      <Card className="mb-8 bg-primary text-white">
        <CardHeader>
          <CardTitle className="text-center text-white">Complete Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
            <div className="bg-white/10 rounded-xl p-4 flex-1 text-center">
              <div className="text-3xl mb-2">📝</div>
              <div className="font-semibold">Enter Prompt</div>
              <div className="text-xs opacity-80 mt-1">User describes desired image</div>
            </div>
            <div className="text-2xl">→</div>
            <div className="bg-white/10 rounded-xl p-4 flex-1 text-center">
              <div className="text-3xl mb-2">✨</div>
              <div className="font-semibold">AI Enhancement</div>
              <div className="text-xs opacity-80 mt-1">Gemini adds details</div>
            </div>
            <div className="text-2xl">→</div>
            <div className="bg-white/10 rounded-xl p-4 flex-1 text-center">
              <div className="text-3xl mb-2">🎨</div>
              <div className="font-semibold">Image Generation</div>
              <div className="text-xs opacity-80 mt-1">Pollinations creates image</div>
            </div>
            <div className="text-2xl">→</div>
            <div className="bg-white/10 rounded-xl p-4 flex-1 text-center">
              <div className="text-3xl mb-2">🖼️</div>
              <div className="font-semibold">Insert & Edit</div>
              <div className="text-xs opacity-80 mt-1">Image appears in editor</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to Use */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">1. Generate an Image</h3>
            <ol className="space-y-1 text-muted-foreground text-sm">
              <li>a) Open any blog in the editor</li>
              <li>b) Click the <strong className="text-foreground">Image button (📷)</strong> in the toolbar</li>
              <li>c) Enter a descriptive prompt or use an example</li>
              <li>d) Click &quot;Generate Image&quot;</li>
              <li>e) Wait for the loading animation</li>
              <li>f) Image appears automatically in the editor</li>
            </ol>
          </div>

          <div className="border-l-4 border-primary pl-6">
            <h3 className="font-semibold text-foreground mb-2">2. Edit an Image</h3>
            <ol className="space-y-1 text-muted-foreground text-sm">
              <li>a) Click on any image in the editor</li>
              <li>b) Click the <strong className="text-foreground">Edit button (✏️)</strong> that appears</li>
              <li>c) Choose from editing tools:</li>
              <li className="pl-6">• Text: Add custom text overlays</li>
              <li className="pl-6">• Adjust: Fine-tune brightness, contrast, etc.</li>
              <li className="pl-6">• Filters: Apply preset effects</li>
              <li className="pl-6">• Transform: Rotate and flip</li>
              <li className="pl-6">• Draw: Freehand annotations</li>
              <li className="pl-6">• Resize: Change aspect ratio</li>
              <li>d) Click &quot;Save Changes&quot; when done</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center mt-8 text-muted-foreground">
        <p className="text-sm">
          Built with ❤️ using Next.js, Gemini AI, and Pollinations • Open Source
        </p>
      </div>
    </div>
  );
}
