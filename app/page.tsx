import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { 
  Sparkles, TrendingUp, ImageIcon, 
  ArrowRight, Check, Bot, Wand2, LineChart
} from "lucide-react";

export default async function Home() {
  const user = await currentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Contendo</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How it Works</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            </div>

            <div className="flex items-center gap-3">
              <SignInButton mode="modal">
                <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered Content Creation Platform
            </div>
            
            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
              Create SEO-Optimized
              <span className="block text-blue-600">Blogs in Minutes</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Transform your content strategy with AI. Generate high-quality, SEO-friendly blog posts 
              that rank higher and engage your audience—all in a fraction of the time.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <SignUpButton mode="modal">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-6 text-lg shadow-lg shadow-blue-600/25">
                  Start Creating for Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </SignUpButton>
            </div>
          </div>

          {/* Stats Section - Value Props */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl">
              <CardContent className="p-5 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">SEO</div>
                <div className="text-sm text-gray-600">Optimized</div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl">
              <CardContent className="p-5 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">AEO</div>
                <div className="text-sm text-gray-600">AI Engine Ready</div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl">
              <CardContent className="p-5 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">GEO</div>
                <div className="text-sm text-gray-600">Generative Ready</div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl">
              <CardContent className="p-5 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">E-E-A-T</div>
                <div className="text-sm text-gray-600">Compliant</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need to Create
              <span className="text-blue-600"> Amazing Content</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful AI tools designed to supercharge your content creation workflow
            </p>
          </div>

          {/* Features Grid - 2 rows */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Feature 1 */}
            <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-6">
                  <Bot className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Content Generation</h3>
                <p className="text-gray-600 leading-relaxed">
                  Generate high-quality, engaging blog posts with advanced AI that understands your brand voice and target audience.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-6">
                  <TrendingUp className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">SEO Optimization</h3>
                <p className="text-gray-600 leading-relaxed">
                  Built-in SEO analysis with real-time scoring for traditional SEO, AEO, and GEO to help your content rank higher.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                  <ImageIcon className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Image Generation</h3>
                <p className="text-gray-600 leading-relaxed">
                  Create stunning, unique images for your blog posts with AI-powered generation and professional editing tools.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Second Row - 2 cards centered */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Feature 4 */}
            <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center mb-6">
                  <Wand2 className="w-7 h-7 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Smart Outlines</h3>
                <p className="text-gray-600 leading-relaxed">
                  Generate structured blog outlines that you can customize before AI writes the full content for you.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-xl bg-rose-100 flex items-center justify-center mb-6">
                  <LineChart className="w-7 h-7 text-rose-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Analytics Dashboard</h3>
                <p className="text-gray-600 leading-relaxed">
                  Track your content performance with detailed analytics and insights to optimize your strategy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Create Blogs in
              <span className="text-blue-600"> 3 Simple Steps</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From idea to published blog in minutes, not hours
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6">
                  1
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Enter Your Topic</h3>
                <p className="text-gray-600 leading-relaxed">
                  Simply enter your blog topic and target keywords. Our AI will understand your intent and audience.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6">
                  2
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Review & Customize</h3>
                <p className="text-gray-600 leading-relaxed">
                  Review the AI-generated outline, customize sections, and add your personal touch before generation.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6">
                  3
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Publish & Track</h3>
                <p className="text-gray-600 leading-relaxed">
                  Export your SEO-optimized blog and track its performance with our built-in analytics dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Content?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of content creators who are saving time and creating better content with Contendo.
          </p>
          <SignUpButton mode="modal">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 rounded-xl px-10 py-6 text-lg font-semibold shadow-lg">
              Get Started for Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </SignUpButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Contendo</span>
              </div>
              <p className="text-gray-400 max-w-sm leading-relaxed">
                AI-powered content creation platform that helps you create SEO-optimized blogs in minutes.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-500 text-sm">
              © {new Date().getFullYear()} Contendo. All rights reserved.
            </p>
            <div className="flex items-center gap-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
