import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { 
  Sparkles, TrendingUp, ImageIcon, 
  ArrowRight, Bot, Wand2, LineChart,
  Search, Target, BarChart3, Shield, Globe
} from "lucide-react";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100/50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Pinnara.ai" className="h-9 w-auto" />
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-500 hover:text-[#534AB7] transition-colors font-medium">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-500 hover:text-[#534AB7] transition-colors font-medium">How it Works</a>
              <a href="#pricing" className="text-sm text-gray-500 hover:text-[#534AB7] transition-colors font-medium">Pricing</a>
            </div>

            <div className="flex items-center gap-3">
              <SignInButton mode="modal">
                <Button variant="ghost" className="text-gray-600 hover:text-[#534AB7] hover:bg-purple-50 font-medium">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="bg-[#534AB7] hover:bg-[#4339A0] text-white rounded-xl px-5 shadow-md shadow-purple-200/50">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-24 px-6 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-purple-50/80 via-purple-50/30 to-transparent rounded-full blur-3xl -z-10" />
        <div className="absolute top-40 -left-20 w-72 h-72 bg-purple-100/40 rounded-full blur-3xl -z-10" />
        <div className="absolute top-60 -right-20 w-72 h-72 bg-indigo-100/30 rounded-full blur-3xl -z-10" />

        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-100 text-[#534AB7] text-sm font-semibold mb-8">
              <Sparkles className="w-4 h-4" />
              SEO Content That Climbs to #1
            </div>
            
            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold leading-[1.1] mb-6 tracking-tight">
              <span className="text-gray-900">Create SEO Content</span>
              <br />
              <span className="bg-gradient-to-r from-[#534AB7] via-[#7B6FD4] to-[#AFA9EC] bg-clip-text text-transparent">That Actually Ranks</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Pinnara.ai generates SEO, AEO & GEO optimized blog posts with AI-powered images 
              — helping your content rank higher on search engines and AI platforms.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <SignUpButton mode="modal">
                <Button size="lg" className="bg-[#534AB7] hover:bg-[#4339A0] text-white rounded-xl px-8 py-6 text-lg shadow-lg shadow-purple-300/40 font-semibold">
                  Start Creating for Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </SignUpButton>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="rounded-xl px-8 py-6 text-lg border-purple-200 text-[#534AB7] hover:bg-purple-50 font-semibold">
                  See How It Works
                </Button>
              </a>
            </div>
            
            <p className="text-sm text-gray-400">No credit card required &middot; Free credits to start</p>
          </div>

          {/* Optimization Badges */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { label: "SEO", desc: "Search Optimized", icon: Search, color: "from-[#534AB7] to-[#6B5FCE]" },
              { label: "AEO", desc: "AI Engine Ready", icon: Bot, color: "from-[#6B5FCE] to-[#8478D8]" },
              { label: "GEO", desc: "Generative Ready", icon: Globe, color: "from-[#8478D8] to-[#9D93E2]" },
              { label: "E-E-A-T", desc: "Compliant", icon: Shield, color: "from-[#9D93E2] to-[#AFA9EC]" },
            ].map((item) => (
              <div key={item.label} className="group relative bg-white rounded-2xl border border-purple-100 p-5 text-center hover:shadow-lg hover:shadow-purple-100/50 hover:border-purple-200 transition-all duration-300">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-3`}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-lg font-bold text-gray-900">{item.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-gradient-to-b from-purple-50/50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-[#534AB7] text-xs font-semibold mb-4 uppercase tracking-wider">
              Features
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Everything You Need to
              <span className="text-[#534AB7]"> Create & Rank</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Powerful AI tools built for content marketers, SEO professionals, and businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Bot,
                title: "AI Content Generation",
                desc: "Generate high-quality blog posts with advanced AI that understands your brand voice, target keywords, and audience intent.",
                gradient: "from-[#534AB7] to-[#6B5FCE]",
              },
              {
                icon: TrendingUp,
                title: "Triple SEO Optimization",
                desc: "Built-in scoring for traditional SEO, AI Engine Optimization (AEO), and Generative Engine Optimization (GEO).",
                gradient: "from-[#6B5FCE] to-[#8478D8]",
              },
              {
                icon: ImageIcon,
                title: "AI Image Generation",
                desc: "Create stunning, contextual images for each blog section using GPT-5 and Gemini image models.",
                gradient: "from-[#8478D8] to-[#9D93E2]",
              },
              {
                icon: Wand2,
                title: "Smart Outlines",
                desc: "Generate structured blog outlines you can drag, edit, and customize before the AI writes your full content.",
                gradient: "from-[#534AB7] to-[#7B6FD4]",
              },
              {
                icon: Search,
                title: "Keyword Research",
                desc: "Built-in keyword research and competitor analysis to find the best topics and gaps to target.",
                gradient: "from-[#7B6FD4] to-[#9D93E2]",
              },
              {
                icon: LineChart,
                title: "Analytics Dashboard",
                desc: "Track content performance, credit usage, and team productivity with a comprehensive dashboard.",
                gradient: "from-[#9D93E2] to-[#AFA9EC]",
              },
            ].map((feature) => (
              <Card key={feature.title} className="group border border-purple-100/60 shadow-none hover:shadow-xl hover:shadow-purple-100/40 transition-all duration-300 rounded-2xl bg-white hover:border-purple-200">
                <CardContent className="p-8">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 border border-purple-100 text-[#534AB7] text-xs font-semibold mb-4 uppercase tracking-wider">
              How It Works
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              From Idea to Published
              <span className="text-[#534AB7]"> in 3 Steps</span>
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              No complex setup. Just enter your topic and let Pinnara.ai handle the rest.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-[#534AB7]/20 via-[#534AB7]/40 to-[#534AB7]/20" />

            {[
              {
                step: "1",
                title: "Enter Your Topic",
                desc: "Add your blog topic, target keywords, and select your preferred AI models. Our keyword research tool helps you find the best angles.",
                icon: Target,
              },
              {
                step: "2",
                title: "Review & Customize",
                desc: "Get an AI-generated outline with sections, talking points, and image options. Drag to reorder, edit, or add your own sections.",
                icon: Wand2,
              },
              {
                step: "3",
                title: "Publish & Track",
                desc: "Your fully SEO-optimized blog with AI images is ready. Export, publish, and track performance from the analytics dashboard.",
                icon: BarChart3,
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#534AB7] to-[#7B6FD4] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-200/50 group-hover:shadow-purple-300/60 transition-shadow">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Trust Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-white to-purple-50/30">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-3xl border border-purple-100 p-10 md:p-14 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              {[
                { value: "10x", label: "Faster Content Creation" },
                { value: "100%", label: "SEO, AEO & GEO Optimized" },
                { value: "AI", label: "Images Included with Every Blog" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-4xl font-extrabold bg-gradient-to-r from-[#534AB7] to-[#AFA9EC] bg-clip-text text-transparent mb-2">{stat.value}</div>
                  <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#534AB7] via-[#6B5FCE] to-[#8478D8]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2230%22%20height%3D%2230%22%20viewBox%3D%220%200%2030%2030%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%221%22%20cy%3D%221%22%20r%3D%221%22%20fill%3D%22rgba(255%2C255%2C255%2C0.05)%22%2F%3E%3C%2Fsvg%3E')] opacity-60" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
            Ready to Rank Higher?
          </h2>
          <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Start creating SEO-optimized content that drives organic traffic. 
            Free credits included — no credit card needed.
          </p>
          <SignUpButton mode="modal">
            <Button size="lg" className="bg-white text-[#534AB7] hover:bg-purple-50 rounded-xl px-10 py-6 text-lg font-bold shadow-xl shadow-purple-900/20">
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="Pinnara.ai" className="h-8 w-auto brightness-0 invert" />
              </div>
              <p className="text-gray-400 max-w-sm leading-relaxed text-sm">
                AI-powered SEO content platform that helps you create optimized blogs 
                that rank on search engines and AI platforms.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-300">Product</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-300">Company</h4>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Pinnara.ai. All rights reserved.
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
