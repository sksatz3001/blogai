import { Sparkles, Image as ImageIcon, Wand2, Palette, Type } from "lucide-react";

export default function ImageFeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-2xl shadow-blue-600/30">
            <Sparkles size={40} className="text-white animate-pulse" />
          </div>
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Advanced Image Generation & Editing
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            AI-powered image creation with comprehensive editing tools powered by Gemini AI and Pollinations
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Image Generation Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <ImageIcon size={24} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Image Generation</h2>
            </div>
            <ul className="space-y-3 text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-3">
                <Sparkles size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <span>AI-enhanced prompts with Gemini 2.0-flash-exp</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Free unlimited image generation via Pollinations AI</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Beautiful loading states with animations</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <span>1024x1024 high-quality images</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <span>Seamless Tiptap editor integration</span>
              </li>
            </ul>
          </div>

          {/* Image Editor Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 hover:shadow-2xl transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                <Wand2 size={24} className="text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">7-Tab Image Editor</h2>
            </div>
            <ul className="space-y-3 text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-3">
                <Wand2 size={20} className="text-purple-600 mt-0.5 flex-shrink-0" />
                <span><strong>AI Edit:</strong> Natural language modifications with Gemini Vision</span>
              </li>
              <li className="flex items-start gap-3">
                <Type size={20} className="text-purple-600 mt-0.5 flex-shrink-0" />
                <span><strong>Text:</strong> Multiple overlays with custom fonts and colors</span>
              </li>
              <li className="flex items-start gap-3">
                <Palette size={20} className="text-purple-600 mt-0.5 flex-shrink-0" />
                <span><strong>Adjust:</strong> 8 sliders (brightness, contrast, saturation, etc.)</span>
              </li>
              <li className="flex items-start gap-3">
                <Palette size={20} className="text-purple-600 mt-0.5 flex-shrink-0" />
                <span><strong>Filters:</strong> 7 preset effects (grayscale, sepia, vintage, etc.)</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles size={20} className="text-purple-600 mt-0.5 flex-shrink-0" />
                <span><strong>Transform:</strong> Rotate, flip horizontal/vertical</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Technical Implementation</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-3">Frontend</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>• React 18 with TypeScript</li>
                <li>• Tiptap rich text editor</li>
                <li>• Custom node extensions</li>
                <li>• Canvas API for editing</li>
                <li>• Radix UI primitives</li>
                <li>• Tailwind CSS styling</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-3">Backend</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>• Next.js 15 App Router</li>
                <li>• Server-side API routes</li>
                <li>• Gemini AI integration</li>
                <li>• Pollinations API calls</li>
                <li>• Base64 image handling</li>
                <li>• Error handling & logging</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-pink-600 dark:text-pink-400 mb-3">AI Services</h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>• Gemini 2.0-flash-exp</li>
                <li>• Prompt enhancement</li>
                <li>• Vision-based editing</li>
                <li>• Pollinations generation</li>
                <li>• Async/await patterns</li>
                <li>• Fallback strategies</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Workflow Diagram */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 shadow-2xl text-white mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">Complete Workflow</h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex-1 text-center">
              <div className="text-3xl mb-2">📝</div>
              <div className="font-semibold">Enter Prompt</div>
              <div className="text-xs opacity-80 mt-1">User describes desired image</div>
            </div>
            <div className="text-2xl">→</div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex-1 text-center">
              <div className="text-3xl mb-2">✨</div>
              <div className="font-semibold">AI Enhancement</div>
              <div className="text-xs opacity-80 mt-1">Gemini adds details</div>
            </div>
            <div className="text-2xl">→</div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex-1 text-center">
              <div className="text-3xl mb-2">🎨</div>
              <div className="font-semibold">Image Generation</div>
              <div className="text-xs opacity-80 mt-1">Pollinations creates image</div>
            </div>
            <div className="text-2xl">→</div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex-1 text-center">
              <div className="text-3xl mb-2">🖼️</div>
              <div className="font-semibold">Insert & Edit</div>
              <div className="text-xs opacity-80 mt-1">Image appears in editor</div>
            </div>
          </div>
        </div>

        {/* How to Use */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">How to Use</h2>
          <div className="space-y-6">
            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">1. Generate an Image</h3>
              <ol className="space-y-1 text-slate-600 dark:text-slate-400 text-sm">
                <li>a) Open any blog in the editor</li>
                <li>b) Click the <strong>Image button (📷)</strong> in the toolbar</li>
                <li>c) Enter a descriptive prompt or use an example</li>
                <li>d) Click &quot;Generate Image&quot;</li>
                <li>e) Wait for the loading animation</li>
                <li>f) Image appears automatically in the editor</li>
              </ol>
            </div>

            <div className="border-l-4 border-purple-600 pl-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">2. Edit an Image</h3>
              <ol className="space-y-1 text-slate-600 dark:text-slate-400 text-sm">
                <li>a) Click on any image in the editor</li>
                <li>b) Click the <strong>Edit button (✏️)</strong> that appears</li>
                <li>c) Choose from 7 editing tabs:</li>
                <li className="pl-6">• AI Edit: &quot;Add sunlight&quot;, &quot;Make it darker&quot;</li>
                <li className="pl-6">• Text: Add custom text overlays</li>
                <li className="pl-6">• Adjust: Fine-tune brightness, contrast, etc.</li>
                <li className="pl-6">• Filters: Apply preset effects</li>
                <li className="pl-6">• Transform: Rotate and flip</li>
                <li className="pl-6">• Resize: Change aspect ratio</li>
                <li>d) Click &quot;Save Changes&quot; when done</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-600 dark:text-slate-400">
          <p className="text-sm">
            Built with ❤️ using Next.js, Gemini AI, and Pollinations • Open Source
          </p>
        </div>
      </div>
    </div>
  );
}
