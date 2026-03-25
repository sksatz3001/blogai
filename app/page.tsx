import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { LandingFAQ } from "@/components/landing-faq";
import {
  Sparkles, TrendingUp, ImageIcon,
  ArrowRight, Bot, Wand2, LineChart,
  Search, BarChart3, Shield, Globe,
  CheckCircle2, Layers, PenTool, Rocket,
  Zap, FileText, Eye, BarChart2,
  Lock, Award, Users, Star,
  Check, X, MessageSquare, Target,
  Cpu, BookOpen, Settings, Activity,
} from "lucide-react";

export default async function Home() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-white antialiased">
      {/* ─── NAVBAR ────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Pinnara.ai" className="h-8" />
          </Link>

          <div className="hidden md:flex items-center gap-7 text-[13px] font-medium text-gray-500">
            <a href="#features" className="hover:text-[#534AB7] transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-[#534AB7] transition-colors">How it Works</a>
            <a href="#comparison" className="hover:text-[#534AB7] transition-colors">Compare</a>
            <a href="#faq" className="hover:text-[#534AB7] transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-2">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-[#534AB7] font-medium">
                Log in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm" className="bg-[#534AB7] hover:bg-[#4339A0] text-white rounded-lg px-4 text-[13px] shadow-sm shadow-purple-300/30">
                Try for Free
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </SignUpButton>
          </div>
        </div>
      </nav>

      {/* ─── HERO ──────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-50/80 via-white to-white" />
          <div className="absolute inset-0 opacity-[0.35]" style={{ backgroundImage: "radial-gradient(circle, #534AB7 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
          <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[900px] h-[550px] rounded-full bg-gradient-to-br from-[#534AB7]/15 via-purple-200/30 to-transparent blur-3xl" />
          <div className="absolute top-20 -left-40 w-[400px] h-[400px] rounded-full bg-purple-200/50 blur-3xl" />
          <div className="absolute top-40 -right-32 w-[350px] h-[350px] rounded-full bg-indigo-200/40 blur-3xl" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-300/60 to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto px-5 text-center relative z-10">
          <h1 className="text-[2.5rem] sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08] mb-5">
            <span className="text-gray-900">SEO AI Tools for Content</span>
            <br />
            <span className="text-gray-900">Creation &amp; </span>
            <span className="bg-gradient-to-r from-[#534AB7] to-[#9D93E2] bg-clip-text text-transparent">Optimization</span>
          </h1>

          <p className="max-w-2xl mx-auto text-gray-500 text-base md:text-lg leading-relaxed mb-6">
            AI SEO tools generate optimized blog content, improve keyword targeting, and
            help websites rank higher on Google.
          </p>

          {/* Integration logos */}
          <div className="flex items-center justify-center gap-6 mb-6 opacity-60">
            {["ChatGPT", "Gemini", "Claude", "Shopify", "WordPress"].map((name) => (
              <div key={name} className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                <Cpu className="w-4 h-4" />
                <span>{name}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mb-8">Integrated with top platforms</p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <SignUpButton mode="modal">
              <Button className="h-12 px-7 text-base bg-[#534AB7] hover:bg-[#4339A0] text-white rounded-xl shadow-lg shadow-purple-300/30 font-semibold">
                Start Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </SignUpButton>
            <a href="#features">
              <Button variant="outline" className="h-12 px-7 text-base rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 font-medium">
                Generate SEO Blogs
              </Button>
            </a>
          </div>

          {/* Hero screenshot placeholder */}
          <div className="max-w-4xl mx-auto mt-12 rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-purple-100/50 overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-2.5 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-300" />
                <div className="w-3 h-3 rounded-full bg-yellow-300" />
                <div className="w-3 h-3 rounded-full bg-green-300" />
              </div>
              <div className="flex-1 mx-12">
                <div className="bg-white border border-gray-200 rounded-md px-3 py-1 text-xs text-gray-400 text-center">pinnara.ai/dashboard</div>
              </div>
            </div>
            <div className="p-8 md:p-12 bg-gradient-to-br from-white to-purple-50/50">
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="text-xs text-gray-400 mb-1">SEO Score</div>
                  <div className="text-2xl font-bold text-[#534AB7]">98/100</div>
                  <div className="mt-2 h-2 bg-gray-100 rounded-full"><div className="h-2 bg-[#534AB7] rounded-full" style={{ width: "98%" }} /></div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="text-xs text-gray-400 mb-1">AEO Score</div>
                  <div className="text-2xl font-bold text-[#6B5FCE]">95/100</div>
                  <div className="mt-2 h-2 bg-gray-100 rounded-full"><div className="h-2 bg-[#6B5FCE] rounded-full" style={{ width: "95%" }} /></div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <div className="text-xs text-gray-400 mb-1">GEO Score</div>
                  <div className="text-2xl font-bold text-[#8478D8]">92/100</div>
                  <div className="mt-2 h-2 bg-gray-100 rounded-full"><div className="h-2 bg-[#8478D8] rounded-full" style={{ width: "92%" }} /></div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <FileText className="w-4 h-4 text-[#534AB7]" />
                  AI Blog Generator
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-5/6" />
                  <div className="h-3 bg-gray-100 rounded w-4/6" />
                  <div className="h-3 bg-purple-50 rounded w-3/4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BENEFITS SECTION ──────────────────────────────── */}
      <section className="py-24 px-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-white" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Benefits of Using AI SEO Tools for Content
              <br className="hidden md:block" /> and <span className="text-[#534AB7]">Blog Creation</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              {[
                { text: "Generate SEO-friendly blogs in minutes", icon: Zap },
                { text: "Optimize content for Google search & AI Overviews", icon: Search },
                { text: "Use AI to match search intent perfectly", icon: Target },
                { text: "Rank faster with built-in SEO optimization", icon: TrendingUp },
                { text: "One tool. One click. High-ranking content.", icon: Sparkles },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 hover:bg-purple-50/50 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-[#534AB7]/10 flex items-center justify-center shrink-0 group-hover:bg-[#534AB7]/15 transition-colors">
                    <item.icon className="w-5 h-5 text-[#534AB7]" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Right side - decorative UI card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg shadow-purple-50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#534AB7] to-[#7B6FD4] flex items-center justify-center">
                  <PenTool className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">SEO Blog Writer</div>
                  <div className="text-xs text-gray-400">AI-powered content engine</div>
                </div>
              </div>
              <div className="space-y-3">
                {["Keyword Optimization", "Search Intent Matching", "Structured Headings (H1–H3)", "Google Ranking Signals"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Pinnara SEO Score</span>
                  <span className="text-sm font-bold text-[#534AB7]">98/100</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full">
                  <div className="h-2.5 bg-gradient-to-r from-[#534AB7] to-[#9D93E2] rounded-full" style={{ width: "98%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6 FEATURE CARDS ───────────────────────────────── */}
      <section id="features" className="py-24 px-5 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gray-50/80" />
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(#534AB7 1px, transparent 1px), linear-gradient(90deg, #534AB7 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
          <div className="absolute -top-20 -right-20 w-[350px] h-[350px] rounded-full bg-purple-200/50 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full bg-indigo-100/50 blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#534AB7] mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              SEO AI Content Generator Tools for <span className="text-[#534AB7]">Optimized Articles</span>
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
              AI SEO content generator tools create keyword-optimized, structured articles
              aligned with search intent. They improve semantic relevance and increase chances of
              ranking on Google.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: Search,
                title: "Advanced SEO AI Tool",
                desc: "Powerful content writing tool with built-in keyword optimization and search intent matching for every article.",
              },
              {
                icon: FileText,
                title: "SEO Blog Generator",
                desc: "Generate long-form, structured blog articles with proper heading hierarchy and semantic keyword placement.",
              },
              {
                icon: Wand2,
                title: "Smart SEO Blog Writer",
                desc: "AI-powered writing with automatic keyword optimization, meta tag generation, and content structuring.",
              },
              {
                icon: Layers,
                title: "AI-Powered Headings",
                desc: "Automatically generates optimized H1-H3 headings, FAQ sections, and featured snippet content.",
              },
              {
                icon: TrendingUp,
                title: "On-Page SEO Optimized",
                desc: "Built for Google updates with E-E-A-T compliance, structured data, and semantic relevance scoring.",
              },
              {
                icon: Sparkles,
                title: "No Technical Skills Needed",
                desc: "Simply enter your topic and keywords. The AI handles SEO structure, optimization, and content generation.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-lg hover:shadow-purple-50 transition-shadow group">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#534AB7] to-[#8478D8] flex items-center justify-center mb-5">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI-POWERED BLOG WRITING ───────────────────────── */}
      <section className="py-24 px-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-white" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-200/60 to-transparent" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              AI-Powered Blog Writing with <span className="text-[#534AB7]">Pinnara.ai</span>
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
              Pinnara.ai&apos;s AI engine creates structured, SEO-friendly blog content aligned with
              user intent, supporting efficient planning and optimized formatting.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Left — Feature pills + badges */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#534AB7] text-white rounded-full text-xs font-semibold">
                  <Rocket className="w-3 h-3" />
                  SEO Friendly Blog Generator
                </span>
              </div>
              <div className="space-y-3 mb-8">
                {[
                  "AI SEO Writer for Blogs & Websites",
                  "SEO Automation Tools for Faster Rankings",
                  "AI Assisted SEO & Content Optimization",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#534AB7]" />
                    <span className="text-sm text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Zap, label: "Generate Blogs in Seconds" },
                  { icon: Wand2, label: "Rewrite & Optimize" },
                  { icon: Users, label: "Humanize AI Text" },
                  { icon: BarChart3, label: "Competitive Analysis" },
                ].map((badge) => (
                  <div key={badge.label} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 hover:bg-purple-50/50 transition-colors">
                    <badge.icon className="w-4 h-4 text-[#534AB7]" />
                    <span className="text-xs font-medium text-gray-700">{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — UI mockup */}
            <div className="relative">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-purple-50 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#534AB7] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-900">Content Generator</span>
                  <span className="ml-auto text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">Active</span>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Topic</div>
                    <div className="text-sm text-gray-700">Best SEO strategies for 2026</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Keywords</div>
                    <div className="flex gap-1.5 flex-wrap">
                      {["SEO tools", "blog optimization", "AI writer", "rankings"].map((k) => (
                        <span key={k} className="px-2 py-0.5 bg-purple-50 text-[#534AB7] rounded text-xs font-medium">{k}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full mb-2">
                  <div className="h-2.5 bg-gradient-to-r from-[#534AB7] to-[#9D93E2] rounded-full animate-pulse" style={{ width: "75%" }} />
                </div>
                <div className="text-xs text-gray-400 text-right">Generating... 75%</div>
              </div>
              {/* Floating stat badge */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl border border-gray-100 shadow-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Rankings</div>
                    <div className="text-sm font-bold text-gray-900">+340%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SEO SCORE / ON-PAGE OPTIMIZATION ──────────────── */}
      <section className="py-24 px-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-50/80" />
        <div className="absolute -top-20 right-[10%] w-[300px] h-[300px] rounded-full bg-purple-100/60 blur-3xl" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              AI-Powered SEO Tools for On-Page &amp; <span className="text-[#534AB7]">Technical Optimization</span>
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
              Pinnara.ai creates fully optimized blog content aligned with search intent and
              structured for long-term SEO growth.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* SEO Score card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg shadow-purple-50 p-8">
              <div className="text-center mb-6">
                <div className="text-xs font-semibold text-[#534AB7] uppercase tracking-wider mb-2">Pinnara SEO Score</div>
                <div className="text-6xl font-black text-[#534AB7]">98<span className="text-2xl text-gray-300">/100</span></div>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Keyword Optimization", pct: 98 },
                  { label: "Search Intent Matching", pct: 95 },
                  { label: "Structured Headings (H1–H3)", pct: 100 },
                  { label: "Google Ranking Signals", pct: 96 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">{item.label}</span>
                      <span className="text-[#534AB7] font-bold">{item.pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className="h-2 bg-gradient-to-r from-[#534AB7] to-[#9D93E2] rounded-full" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Checklist */}
            <div className="space-y-4">
              {[
                "SEO-optimized titles & meta structure",
                "Clean heading hierarchy",
                "Keyword-rich, semantically relevant content",
                "FAQ sections for featured snippets",
                "E-E-A-T compliance built in",
                "Internal linking suggestions",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100 hover:border-purple-200 transition-colors">
                  <CheckCircle2 className="w-5 h-5 text-[#534AB7] shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE PINNARA ────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-white" />
        <div className="absolute inset-0 opacity-[0.25]" style={{ backgroundImage: "radial-gradient(circle, #534AB7 0.8px, transparent 0.8px)", backgroundSize: "24px 24px" }} />
        <div className="absolute top-10 left-[5%] w-20 h-20 rounded-full border-2 border-[#534AB7]/12" />
        <div className="absolute bottom-10 right-[8%] w-28 h-28 rounded-full border-2 border-purple-300/25" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Why Choose <span className="text-[#534AB7]">Pinnara.ai SEO?</span>
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
              Unlock the full potential of your content strategy with our AI-powered suite.
              Designed for ranking, built for growth.
            </p>
          </div>

          {/* Feature showcase card */}
          <div className="bg-gradient-to-br from-[#534AB7] to-[#7B6FD4] rounded-3xl p-8 md:p-12 text-center text-white mb-10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-5">
                <Layers className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Intelligent Content Structuring</h3>
              <p className="text-purple-100/80 text-sm max-w-lg mx-auto mb-6">
                Automatically generates optimized headings, internal flow, and content hierarchy
                for maximum search visibility.
              </p>
              <div className="flex items-center justify-center gap-3">
                {["Headings", "Content Flow", "Interlinking"].map((tag) => (
                  <span key={tag} className="px-4 py-2 bg-white/15 rounded-full text-xs font-semibold backdrop-blur-sm">{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* How it works steps */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: "01",
                icon: PenTool,
                title: "Enter Your Topic",
                desc: "Type your topic and target keywords. Our AI suggests the best angles based on keyword research.",
              },
              {
                n: "02",
                icon: Layers,
                title: "Review & Customise",
                desc: "Get an AI outline with sections, images and talking points. Drag to reorder and tweak before writing.",
              },
              {
                n: "03",
                icon: Rocket,
                title: "Publish & Track",
                desc: "Your SEO-optimised blog with AI images is ready. Export, publish, and monitor rankings.",
              },
            ].map((s) => (
              <div key={s.n} className="relative bg-gray-50/70 rounded-3xl p-8 group hover:bg-white hover:shadow-lg hover:shadow-purple-50 transition-all border border-transparent hover:border-gray-100">
                <span className="text-5xl font-black text-[#534AB7]/10 absolute top-6 right-6">{s.n}</span>
                <div className="w-11 h-11 rounded-xl bg-[#534AB7] flex items-center justify-center mb-5">
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SEO AUTOMATION SOFTWARE ───────────────────────── */}
      <section className="py-24 px-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-50/80" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              SEO Automation Software for <span className="text-[#534AB7]">Modern Websites</span>
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
              Pinnara.ai is not just a writing tool — it is a full SEO Automation Software.
            </p>
          </div>

          {/* Before/After cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                <div className="grid grid-cols-2">
                  <div className="p-4 border-r border-gray-100">
                    <div className="text-xs font-semibold text-red-400 mb-2">Before</div>
                    <div className="space-y-2">
                      <div className="h-2 bg-red-100 rounded w-full" />
                      <div className="h-2 bg-red-50 rounded w-4/5" />
                      <div className="text-lg font-bold text-red-400">{i === 1 ? "12" : i === 2 ? "5" : "8"}</div>
                      <div className="text-[10px] text-gray-400">clicks/day</div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-xs font-semibold text-green-500 mb-2">After</div>
                    <div className="space-y-2">
                      <div className="h-2 bg-green-100 rounded w-full" />
                      <div className="h-2 bg-green-50 rounded w-4/5" />
                      <div className="text-lg font-bold text-green-500">{i === 1 ? "340" : i === 2 ? "180" : "520"}</div>
                      <div className="text-[10px] text-gray-400">clicks/day</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SMART SEO BLOG GENERATOR ──────────────────────── */}
      <section className="py-24 px-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-white" />
        <div className="absolute top-20 -right-20 w-[400px] h-[400px] rounded-full bg-purple-100/40 blur-3xl" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              <span className="text-[#534AB7]">⚡</span> Smart SEO Blog Generator for <span className="text-[#534AB7]">High Traffic</span>
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
              Our SEO blog generator is built for speed and performance.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              "Long-form SEO blogs",
              "Niche-specific articles",
              "Affiliate & business blogs",
              "High-traffic SEO content",
            ].map((item) => (
              <div key={item} className="bg-gray-50 rounded-2xl p-5 text-center hover:bg-purple-50/50 transition-colors border border-transparent hover:border-purple-200">
                <h3 className="text-sm font-bold text-gray-900">{item}</h3>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-6">
              All content is optimized using AI SEO tools to help you rank on the <strong className="text-gray-900">1st page of Google.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* ─── SEO FRIENDLY BLOG GENERATOR ───────────────────── */}
      <section className="py-24 px-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-50/80" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              SEO Friendly Blog Generator <span className="text-[#534AB7]">Built for Rankings</span>
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
              Pinnara.ai is a powerful SEO friendly blog generator designed for ranking-focused content creation.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: Bot, title: "Content Agent", desc: "Automated blog generation tasks" },
              { icon: BarChart2, title: "Performance Insights", desc: "Analyze blog performance & data" },
              { icon: Eye, title: "Proofreading Assist", desc: "Enhance clarity & correctness" },
              { icon: Activity, title: "Search Console", desc: "Track clicks, impressions & SEO" },
            ].map((card) => (
              <div key={card.title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:shadow-purple-50 transition-shadow group text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#534AB7] to-[#8478D8] flex items-center justify-center mx-auto mb-4">
                  <card.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">{card.title}</h3>
                <p className="text-xs text-gray-500">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUSTED BY ────────────────────────────────────── */}
      <section className="py-24 px-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-white" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              <span className="text-[#534AB7]">🏆</span> Trusted by Marketers, Bloggers &amp; <span className="text-[#534AB7]">SEO Experts</span>
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
              Thousands of users trust Pinnara.ai because it delivers <strong className="text-gray-900">real SEO results.</strong>
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { icon: Lock, title: "Secure Platform", desc: "Enterprise grade" },
              { icon: Search, title: "SEO-focused AI Engine", desc: "Rank higher" },
              { icon: Globe, title: "Global Ranking", desc: "Worldwide reach" },
              { icon: Shield, title: "Built for Google & AI", desc: "Future proof" },
            ].map((trust) => (
              <div key={trust.title} className="bg-gray-50 rounded-2xl p-5 text-center hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-[#534AB7]/10 flex items-center justify-center mx-auto mb-3">
                  <trust.icon className="w-5 h-5 text-[#534AB7]" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-0.5">{trust.title}</h3>
                <p className="text-xs text-gray-400">{trust.desc}</p>
              </div>
            ))}
          </div>

          {/* Who should use */}
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Who Should Use Pinnara.ai?</h3>
            <div className="space-y-2">
              {[
                "Bloggers & niche website owners",
                "SEO agencies",
                "Digital marketers",
                "Affiliate marketers",
                "SaaS & startup founders",
              ].map((who) => (
                <div key={who} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#534AB7]" />
                  <span className="text-sm text-gray-700">{who}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-400 text-center">
              If you want a reliable SEO AI tool or SEO blog writer, Pinnara.ai is made for you.
            </p>
          </div>
        </div>
      </section>

      {/* ─── COMPARISON TABLE ──────────────────────────────── */}
      <section id="comparison" className="py-24 px-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-50/80" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Pinnara.ai vs. <span className="text-[#534AB7]">Generic AI Tools</span>
            </h2>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-lg shadow-purple-50 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-[#534AB7] to-[#7B6FD4]">
                  <th className="text-left px-6 py-4 text-white text-sm font-semibold">Feature</th>
                  <th className="text-center px-6 py-4 text-white text-sm font-semibold">Pinnara.ai</th>
                  <th className="text-center px-6 py-4 text-white text-sm font-semibold">Generic AI</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "SEO Optimization", pinnara: "Built-in (On-Page SEO)", generic: "No (Requires manual SEO)" },
                  { feature: "Google Search Intent", pinnara: "Matches User Intent", generic: "Generic / Random Output" },
                  { feature: "Content Structure", pinnara: "H1, H2, H3 (Structured)", generic: "Flat Text / Requires Formatting" },
                  { feature: "Automatic FAQs", pinnara: "Added for Snippets", generic: "User must prompt for it" },
                  { feature: "Blog Ranking Speed", pinnara: "Fast (Rank-Ready)", generic: "Slow (Needs editing)" },
                  { feature: "AI Images", pinnara: "Auto-generated per section", generic: "Not included" },
                  { feature: "AEO & GEO Optimization", pinnara: "Triple-optimized", generic: "Not supported" },
                  { feature: "E-E-A-T Compliance", pinnara: "Built-in by default", generic: "Manual effort required" },
                ].map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.feature}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700">{row.pinnara}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <X className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-gray-400">{row.generic}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── FAQ SECTION ───────────────────────────────────── */}
      <section id="faq" className="py-24 px-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-white" />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Frequently Asked Questions About <span className="text-[#534AB7]">SEO AI Tools</span>
            </h2>
          </div>
          <LandingFAQ />
        </div>
      </section>

      {/* ─── STATS BANNER ──────────────────────────────────── */}
      <section className="py-16 px-5 relative">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-[#534AB7] to-[#7B6FD4] p-10 md:p-14 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
          <div className="grid md:grid-cols-3 gap-8 text-center relative z-10">
            {[
              { val: "10x", label: "Faster content creation" },
              { val: "100%", label: "SEO, AEO & GEO optimised" },
              { val: "AI", label: "Images in every blog" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-4xl md:text-5xl font-extrabold text-white mb-1">{s.val}</div>
                <p className="text-sm text-purple-100/80 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─────────────────────────────────────── */}
      <section className="py-28 px-5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#534AB7] via-[#6B5FCE] to-[#8478D8]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="text-4xl mb-4">🚀</div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
            Start Ranking Faster with Pinnara.ai
          </h2>
          <p className="text-base md:text-lg text-purple-100/80 mb-9 max-w-xl mx-auto leading-relaxed">
            Stop wasting time on manual writing and SEO guesswork. Use Pinnara.ai — the smartest
            SEO AI tool for blogs that rank, convert, and scale traffic.
          </p>
          <SignUpButton mode="modal">
            <Button className="h-12 px-8 text-base bg-white text-[#534AB7] hover:bg-purple-50 rounded-xl font-bold shadow-xl shadow-purple-900/15">
              Start Using Pinnara.ai Today
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </SignUpButton>
          <p className="text-purple-200/60 text-sm mt-4 font-semibold">AND DOMINATE GOOGLE SEARCH</p>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────── */}
      <footer className="py-14 px-5 bg-gray-950 text-gray-400">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-10 mb-12">
            <div className="max-w-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Pinnara.ai" className="h-7 brightness-0 invert mb-4" />
              <p className="text-sm leading-relaxed mb-4">
                Pinnara.ai is an AI-powered content automation platform. Create optimised blogs
                that rank on search engines and AI platforms.
              </p>
              <a href="mailto:support@pinnara.ai" className="text-sm text-gray-400 hover:text-white transition-colors">
                support@pinnara.ai
              </a>
            </div>
            <div className="flex gap-12 md:gap-16 flex-wrap">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-4">Quick Links</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#comparison" className="hover:text-white transition-colors">Compare</a></li>
                  <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-4">Tools</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="#" className="hover:text-white transition-colors">AI Blog Writer</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">SEO Optimizer</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">AI Image Generator</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Keyword Research</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-4">Solutions</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="#" className="hover:text-white transition-colors">SEO Content Writing</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Content Optimization</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Blog Generation</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">AI Search Optimization</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800/60 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
            <span>&copy; {new Date().getFullYear()} Pinnara.ai. All rights reserved.</span>
            <div className="flex gap-5 mt-3 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Terms &amp; Conditions</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
