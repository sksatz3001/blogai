import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { 
  Sparkles, TrendingUp, ImageIcon, 
  ArrowRight, Bot, Wand2, LineChart,
  Search, BarChart3, Shield, Globe,
  CheckCircle2, Layers, PenTool, Rocket
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
            <a href="#pricing" className="hover:text-[#534AB7] transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-2">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-[#534AB7] font-medium">
                Log in
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm" className="bg-[#534AB7] hover:bg-[#4339A0] text-white rounded-lg px-4 text-[13px] shadow-sm shadow-purple-300/30">
                Get Started
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </SignUpButton>
          </div>
        </div>
      </nav>

      {/* ─── HERO ──────────────────────────────────────────── */}
      <section className="relative pt-32 pb-28 overflow-hidden">
        {/* Ambient background + grid */}
        <div className="absolute inset-0">
          {/* Base tint so patterns show */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-50/80 via-white to-white" />
          {/* Dot grid */}
          <div className="absolute inset-0 opacity-[0.40]" style={{ backgroundImage: "radial-gradient(circle, #534AB7 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
          {/* Gradient orbs */}
          <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[900px] h-[550px] rounded-full bg-gradient-to-br from-[#534AB7]/15 via-purple-200/30 to-transparent blur-3xl" />
          <div className="absolute top-20 -left-40 w-[400px] h-[400px] rounded-full bg-purple-200/50 blur-3xl" />
          <div className="absolute top-40 -right-32 w-[350px] h-[350px] rounded-full bg-indigo-200/40 blur-3xl" />
          {/* Decorative rings */}
          <div className="absolute top-28 left-[8%] w-24 h-24 rounded-full border-2 border-[#534AB7]/15" />
          <div className="absolute top-48 left-[12%] w-12 h-12 rounded-full border border-[#534AB7]/12" />
          <div className="absolute top-20 right-[10%] w-32 h-32 rounded-full border-2 border-purple-300/30" />
          <div className="absolute bottom-32 right-[15%] w-16 h-16 rounded-full border border-[#534AB7]/15" />
          {/* Grid lines overlay */}
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(#534AB7 1px, transparent 1px), linear-gradient(90deg, #534AB7 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
          {/* Bottom divider */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-300/60 to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto px-5 text-center relative z-10">
          {/* Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#534AB7]/8 text-[#534AB7] border border-[#534AB7]/15 mb-7">
            <Sparkles className="w-3 h-3" />
            AI-Powered SEO Content Platform
          </div>

          {/* Headline */}
          <h1 className="text-[2.75rem] sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-5">
            <span className="text-gray-900">Write Once.</span>
            <br />
            <span className="bg-gradient-to-r from-[#534AB7] to-[#9D93E2] bg-clip-text text-transparent">Rank Everywhere.</span>
          </h1>

          {/* Sub */}
          <p className="max-w-xl mx-auto text-gray-500 text-base md:text-lg leading-relaxed mb-9">
            Pinnara.ai creates SEO, AEO &amp; GEO optimised blog posts with
            AI-generated images — so every article is ready to rank on Google,
            ChatGPT and Perplexity.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <SignUpButton mode="modal">
              <Button className="h-12 px-7 text-base bg-[#534AB7] hover:bg-[#4339A0] text-white rounded-xl shadow-lg shadow-purple-300/30 font-semibold">
                Start Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </SignUpButton>
            <a href="#how-it-works">
              <Button variant="outline" className="h-12 px-7 text-base rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50 font-medium">
                See How It Works
              </Button>
            </a>
          </div>
          <p className="text-xs text-gray-400 tracking-wide">Free credits included &middot; No card required</p>
        </div>

        {/* Optimisation badges row */}
        <div className="max-w-3xl mx-auto mt-20 px-5 grid grid-cols-4 gap-3 relative z-10">
          {[
            { tag: "SEO", desc: "Search", icon: Search },
            { tag: "AEO", desc: "AI Engines", icon: Bot },
            { tag: "GEO", desc: "Generative", icon: Globe },
            { tag: "E-E-A-T", desc: "Compliant", icon: Shield },
          ].map((b) => (
            <div key={b.tag} className="flex flex-col items-center gap-2 py-4 rounded-2xl border border-gray-100 bg-white hover:border-purple-200 hover:shadow-sm transition-all group">
              <b.icon className="w-5 h-5 text-[#534AB7] opacity-70 group-hover:opacity-100 transition" />
              <span className="text-sm font-bold text-gray-900">{b.tag}</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">{b.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── BENTO FEATURES ────────────────────────────────── */}
      <section id="features" className="py-24 px-5 relative overflow-hidden">
        {/* Background decoration */}
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
              Everything you need to <span className="text-[#534AB7]">create &amp; rank</span>
            </h2>
          </div>

          {/* Bento grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Large card — spans 2 cols */}
            <div className="md:col-span-2 bg-white rounded-3xl border border-gray-100 p-8 md:p-10 flex flex-col justify-between hover:shadow-lg hover:shadow-purple-50 transition-shadow group">
              <div>
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#534AB7] to-[#7B6FD4] flex items-center justify-center mb-5">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">AI Content Generation</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-md">
                  Generate full-length, publish-ready blog posts that match your brand voice —
                  complete with headings, key takeaways, FAQ schema, and internal linking suggestions.
                </p>
              </div>
              <div className="mt-8 flex gap-2">
                {["GPT-4o", "Gemini 2.5", "Claude", "Llama"].map((m) => (
                  <span key={m} className="px-2.5 py-1 text-[10px] rounded-md bg-purple-50 text-[#534AB7] font-medium">{m}</span>
                ))}
              </div>
            </div>

            {/* Right tall card */}
            <div className="bg-white rounded-3xl border border-gray-100 p-8 hover:shadow-lg hover:shadow-purple-50 transition-shadow group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#6B5FCE] to-[#9D93E2] flex items-center justify-center mb-5">
                <ImageIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI Images</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Auto-generate contextual featured &amp; section images using
                GPT-5 Image and Gemini models. Each image matches the section content.
              </p>
            </div>

            {/* Bottom 3 equal cards */}
            {[
              {
                icon: TrendingUp,
                title: "Triple SEO Scoring",
                desc: "Real-time SEO + AEO + GEO scoring so you optimise for traditional search and AI answers simultaneously.",
              },
              {
                icon: Wand2,
                title: "Smart Outlines",
                desc: "AI generates structured outlines you can drag, edit and customise before the full blog is written.",
              },
              {
                icon: LineChart,
                title: "Analytics Dashboard",
                desc: "Track content performance, credit usage and team productivity from a single dashboard.",
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

      {/* ─── HOW IT WORKS ──────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-5 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-white" />
          <div className="absolute inset-0 opacity-[0.30]" style={{ backgroundImage: "radial-gradient(circle, #534AB7 0.8px, transparent 0.8px)", backgroundSize: "24px 24px" }} />
          <div className="absolute top-10 left-[5%] w-20 h-20 rounded-full border-2 border-[#534AB7]/12" />
          <div className="absolute bottom-10 right-[8%] w-28 h-28 rounded-full border-2 border-purple-300/25" />
          <div className="absolute top-1/2 -left-16 w-[250px] h-[250px] rounded-full bg-purple-100/60 blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#534AB7] mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Idea to published in <span className="text-[#534AB7]">3 minutes</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: "01",
                icon: PenTool,
                title: "Enter Your Topic",
                desc: "Type your topic, target keywords, and pick your AI model. Our keyword research tool suggests the best angles.",
              },
              {
                n: "02",
                icon: Layers,
                title: "Review & Customise",
                desc: "Get an AI outline with sections, images and talking points. Drag to reorder, tweak or add your own sections.",
              },
              {
                n: "03",
                icon: Rocket,
                title: "Publish & Track",
                desc: "Your SEO-optimised blog with AI images is ready. Export, publish, and monitor performance in-dashboard.",
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

      {/* ─── STATS BANNER ──────────────────────────────────── */}
      <section className="py-16 px-5 relative">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-[#534AB7] to-[#7B6FD4] p-10 md:p-14 relative overflow-hidden">
          {/* Inner pattern */}
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

      {/* ─── CHECKLIST / WHY PINNARA ───────────────────────── */}
      <section className="py-24 px-5 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gray-50/80" />
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(#534AB7 1px, transparent 1px), linear-gradient(90deg, #534AB7 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
          <div className="absolute -top-10 right-[10%] w-[300px] h-[300px] rounded-full bg-purple-200/50 blur-3xl" />
          <div className="absolute bottom-0 left-[5%] w-[250px] h-[250px] rounded-full bg-indigo-100/50 blur-3xl" />
          <div className="absolute top-1/3 right-[3%] w-14 h-14 rounded-full border-2 border-[#534AB7]/15" />
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#534AB7] mb-3">Why Pinnara.ai</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-6">
              Built for content teams that need to <span className="text-[#534AB7]">rank fast</span>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              Most AI writing tools create generic content. Pinnara.ai
              produces articles that are optimised for search engines and
              AI-powered answer engines from the first draft.
            </p>
            <SignUpButton mode="modal">
              <Button className="h-11 px-6 bg-[#534AB7] hover:bg-[#4339A0] text-white rounded-xl shadow-md shadow-purple-300/30 font-semibold">
                Try It Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </SignUpButton>
          </div>
          <div className="space-y-4">
            {[
              "SEO + AEO + GEO triple optimisation in every blog",
              "AI images generated for each section automatically",
              "Keyword research & competitor gap analysis built in",
              "E-E-A-T compliant content structure by default",
              "Team collaboration with role-based access",
              "Credit-based pricing — only pay for what you use",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100">
                <CheckCircle2 className="w-5 h-5 text-[#534AB7] shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 font-medium">{item}</span>
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
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
            Ready to rank higher?
          </h2>
          <p className="text-base md:text-lg text-purple-100/80 mb-9 max-w-xl mx-auto leading-relaxed">
            Create your first SEO-optimised blog in minutes — complete with
            AI images and triple-optimised scoring.
          </p>
          <SignUpButton mode="modal">
            <Button className="h-12 px-8 text-base bg-white text-[#534AB7] hover:bg-purple-50 rounded-xl font-bold shadow-xl shadow-purple-900/15">
              Get Started for Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </SignUpButton>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────── */}
      <footer className="py-14 px-5 bg-gray-950 text-gray-400">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between gap-10 mb-12">
            <div className="max-w-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.svg" alt="Pinnara.ai" className="h-7 brightness-0 invert mb-4" />
              <p className="text-sm leading-relaxed">
                AI-powered SEO content platform. Create optimised blogs
                that rank on search engines and AI platforms.
              </p>
            </div>
            <div className="flex gap-16">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-4">Product</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
                  <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-300 mb-4">Company</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800/60 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
            <span>&copy; {new Date().getFullYear()} Pinnara.ai. All rights reserved.</span>
            <div className="flex gap-5 mt-3 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
