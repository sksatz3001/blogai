import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, PenTool, TrendingUp, Zap, ImageIcon, BarChart3, Rocket, ArrowRight, Users, FileText, Building2, Star, Quote, Check, Globe, Layers, Target, Award, ChevronRight, Activity, Lock, Cloud, Cpu, ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { blogs, employees, users } from "@/db/schema";
import { count } from "drizzle-orm";

export default async function Home() {
  const user = await currentUser();
  if (user) redirect("/dashboard");

  // Live stats for social proof
  const [uc, ec, bc] = await Promise.all([
    db.select({ c: count() }).from(users),
    db.select({ c: count() }).from(employees),
    db.select({ c: count() }).from(blogs),
  ]);
  const usersCount = uc?.[0]?.c || 0;
  const employeesCount = ec?.[0]?.c || 0;
  const blogsCount = bc?.[0]?.c || 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B1220]">
      {/* Multiple Gradient Orbs for depth */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-[#88C0D0]/20 to-[#8FBCBB]/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 h-[700px] w-[700px] rounded-full bg-gradient-to-tl from-[#D08770]/20 to-[#BF616A]/10 blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-gradient-to-r from-[#8FBCBB]/10 to-[#A3BE8C]/10 blur-[100px] animate-pulse" style={{ animationDelay: '4s' }} />
        <div className="absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full bg-[#88C0D0]/5 blur-[80px]" />
        <div className="absolute bottom-1/3 left-0 h-[400px] w-[400px] rounded-full bg-[#D08770]/5 blur-[80px]" />
      </div>

      {/* Glassmorphic Navigation Bar */}
      <nav className="relative z-50 backdrop-blur-2xl bg-gradient-to-b from-[#0B1220]/60 to-[#0B1220]/40 border-b border-white/5">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-transparent via-[#88C0D0]/5 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-10">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#88C0D0] to-[#8FBCBB] p-[1px]">
                  <div className="flex h-full w-full items-center justify-center rounded-lg bg-[#0B1220]">
                    <Sparkles className="h-4 w-4 text-[#88C0D0]" />
                  </div>
                </div>
                <span className="font-bold text-[#E6EDF3] text-lg">Contendo AI</span>
              </div>
              {/* Nav links removed per request */}
            </div>
            <div className="flex items-center gap-3">
              <SignInButton mode="modal">
                <Button variant="ghost" className="text-[#E6EDF3] hover:bg-white/10 hover:backdrop-blur-xl">Sign in</Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="bg-gradient-to-r from-[#88C0D0] to-[#8FBCBB] hover:from-[#88C0D0]/90 hover:to-[#8FBCBB]/90 transition-all duration-500 text-[#0B1220] font-semibold shadow-lg shadow-[#88C0D0]/20">
                  Start Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </nav>


      {/* Hero Section - Ultra Modern Design */}
      <section className="relative z-10 pt-24 pb-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-5xl text-center">
            {/* Animated Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#88C0D0]/10 via-[#8FBCBB]/10 to-[#88C0D0]/10 border border-[#88C0D0]/20 px-5 py-2.5 backdrop-blur-xl mb-10 animate-pulse">
              <div className="h-2 w-2 rounded-full bg-[#88C0D0] animate-pulse" />
              <span className="text-sm font-medium text-[#88C0D0]">Generate SEO‑optimized blogs your team can ship fast.</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-transparent bg-gradient-to-b from-[#E6EDF3] to-[#9DA7BA] bg-clip-text leading-[0.9] mb-2">
              Write. Optimize.
            </h1>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8">
              <span className="relative">
                <span className="absolute inset-0 bg-gradient-to-r from-[#88C0D0] via-[#8FBCBB] to-[#D08770] blur-2xl opacity-50"></span>
                <span className="relative bg-gradient-to-r from-[#88C0D0] via-[#8FBCBB] to-[#D08770] bg-clip-text text-transparent">
                  Rank Higher.
                </span>
              </span>
            </h1>

            <p className="mt-8 text-lg text-[#9DA7BA]/80 max-w-2xl mx-auto leading-relaxed backdrop-blur-sm">
              Contendo AI helps your team create and save SEO‑ready blogs with live metrics, image tools, and employee workflows—so content goes from idea to “Saved” in minutes.
            </p>

            {/* CTA Buttons with Glass Effect */}
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
              <SignUpButton mode="modal">
                <Button size="lg" className="group relative overflow-hidden bg-gradient-to-r from-[#88C0D0] to-[#8FBCBB] hover:from-[#88C0D0]/90 hover:to-[#8FBCBB]/90 text-[#0B1220] px-10 py-7 text-base font-semibold transition-all duration-500 shadow-2xl shadow-[#88C0D0]/30">
                  <span className="relative z-10">Get Started Free</span>
                  <ArrowRight className="ml-2 h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </Button>
              </SignUpButton>
            </div>

            {/* Glassy Stats Cards */}
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-2xl border border-white/10 p-6 hover:border-[#88C0D0]/30 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-[#88C0D0]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-[#88C0D0] to-[#8FBCBB] bg-clip-text">{blogsCount}+</div>
                  <div className="text-sm text-[#9DA7BA] mt-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#88C0D0]/60" />
                    Blogs Generated
                  </div>
                </div>
                <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-[#88C0D0]/10 blur-2xl" />
              </div>

              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-2xl border border-white/10 p-6 hover:border-[#8FBCBB]/30 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-[#8FBCBB]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-[#8FBCBB] to-[#A3BE8C] bg-clip-text">{employeesCount}+</div>
                  <div className="text-sm text-[#9DA7BA] mt-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#8FBCBB]/60" />
                    Active Writers
                  </div>
                </div>
                <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-[#8FBCBB]/10 blur-2xl" />
              </div>

              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-2xl border border-white/10 p-6 hover:border-[#D08770]/30 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-[#D08770]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                  <div className="text-4xl font-bold text-transparent bg-gradient-to-r from-[#D08770] to-[#BF616A] bg-clip-text">{usersCount}+</div>
                  <div className="text-sm text-[#9DA7BA] mt-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#D08770]/60" />
                    Companies
                  </div>
                </div>
                <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-[#D08770]/10 blur-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Blocks Section - Ultra Glassy Design */}
      <section id="features" className="relative z-10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-gradient-to-r from-[#E6EDF3] to-[#9DA7BA] bg-clip-text mb-4">Trending Blocks</h2>
            <p className="text-lg text-[#9DA7BA]/70 max-w-2xl mx-auto">Beautiful components that make your SaaS stand out from the competition</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: PenTool,
                title: "AI Blog Generation",
                description: "Stream perfect content with semantic headings and FAQ",
                gradient: "from-[#88C0D0] to-[#8FBCBB]",
                delay: "0ms"
              },
              {
                icon: ImageIcon,
                title: "Smart Images",
                description: "Reliable generation with proxy and inline editing",
                gradient: "from-[#8FBCBB] to-[#A3BE8C]",
                delay: "100ms"
              },
              {
                icon: TrendingUp,
                title: "SEO Intelligence",
                description: "E-E-A-T scoring and density analysis in real-time",
                gradient: "from-[#D08770] to-[#BF616A]",
                delay: "200ms"
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Throttled streaming for silky-smooth experience",
                gradient: "from-[#A3BE8C] to-[#88C0D0]",
                delay: "300ms"
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#88C0D0]/20 via-transparent to-[#D08770]/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <Card className="relative h-full overflow-hidden border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-2xl hover:border-white/20 transition-all duration-500 rounded-3xl">
                  <CardContent className="p-8">
                    {/* Icon with gradient background */}
                    <div className="relative mb-6">
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} blur-xl opacity-50`} />
                      <div className={`relative inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient}`}>
                        <feature.icon className="h-6 w-6 text-[#0B1220]" />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-[#E6EDF3] mb-3">{feature.title}</h3>
                    <p className="text-sm text-[#9DA7BA]/70 leading-relaxed">{feature.description}</p>
                    
                    {/* Hover effect line */}
                    <div className="mt-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Additional Features Grid */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: ShieldCheck, title: "Enterprise Security", desc: "Bank-level encryption and compliance" },
              { icon: Activity, title: "Real-time Analytics", desc: "Track performance with live dashboards" },
              { icon: Cloud, title: "Global CDN", desc: "Lightning fast delivery worldwide" }
            ].map((item, i) => (
              <div key={i} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[#88C0D0]/10 to-transparent rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start gap-4 p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#88C0D0]/20 to-[#8FBCBB]/20">
                    <item.icon className="h-5 w-5 text-[#88C0D0]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[#E6EDF3] mb-1">{item.title}</h4>
                    <p className="text-sm text-[#9DA7BA]/60">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Users Say - Glassy Card Design */}
      <section id="testimonials" className="relative z-10 py-24 bg-gradient-to-b from-transparent via-[#0E1626]/20 to-transparent">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-gradient-to-r from-[#E6EDF3] to-[#9DA7BA] bg-clip-text mb-4">What our users say</h2>
            <p className="text-lg text-[#9DA7BA]/70">Trusted by teams worldwide to build faster</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "Streaming is buttery smooth. Our writers finished posts 3x faster than before.",
                author: "Sarah Chen",
                role: "Product Lead",
                company: "TechCorp",
                rating: 5,
                gradient: "from-[#88C0D0] to-[#8FBCBB]"
              },
              {
                quote: "The SEO score and FAQ sections are absolute lifesavers for publishing at scale.",
                author: "Mike Johnson",
                role: "Content Ops Manager",
                company: "MediaHub",
                rating: 5,
                gradient: "from-[#8FBCBB] to-[#A3BE8C]"
              },
              {
                quote: "Image generation just works—no broken links or CORS issues ever.",
                author: "Emily Davis",
                role: "SEO Manager",
                company: "Growth Co",
                rating: 5,
                gradient: "from-[#D08770] to-[#BF616A]"
              },
            ].map((testimonial, i) => (
              <div key={i} className="group relative">
                <div className={`absolute inset-0 bg-gradient-to-br ${testimonial.gradient} rounded-3xl blur-2xl opacity-10 group-hover:opacity-20 transition-opacity duration-700`} />
                <Card className="relative h-full border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-2xl rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-500">
                  <CardContent className="p-8">
                    {/* Rating Stars */}
                    <div className="flex gap-1 mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-[#88C0D0] text-[#88C0D0]" />
                      ))}
                    </div>
                    
                    {/* Quote */}
                    <Quote className="h-8 w-8 text-white/10 mb-4" />
                    <p className="text-[#E6EDF3]/90 mb-8 leading-relaxed text-base">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                    
                    {/* Author Info with Glass Effect */}
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className={`absolute inset-0 bg-gradient-to-br ${testimonial.gradient} blur-md`} />
                        <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl flex items-center justify-center text-lg font-bold text-[#E6EDF3]">
                          {testimonial.author.split(' ').map(n => n[0]).join('')}
                        </div>
                      </div>
                      <div>
                        <div className="font-semibold text-[#E6EDF3]">{testimonial.author}</div>
                        <div className="text-sm text-[#9DA7BA]/70">{testimonial.role} at {testimonial.company}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Build. Customize. Deploy Section - Ultra Modern */}
      <section className="relative z-10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#D08770]/20 via-[#88C0D0]/20 to-[#8FBCBB]/20 rounded-[3rem] blur-3xl" />
            
            {/* Main Card */}
            <Card className="relative border border-white/20 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-3xl rounded-[3rem] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#D08770]/5 via-transparent to-[#88C0D0]/5" />
              <CardContent className="relative p-16 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 mb-8">
                  <Rocket className="h-4 w-4 text-[#88C0D0]" />
                  <span className="text-sm font-medium text-[#88C0D0]">Ready to ship?</span>
                </div>
                
                <h2 className="text-5xl md:text-6xl font-bold mb-6">
                  <span className="text-transparent bg-gradient-to-r from-[#E6EDF3] to-[#9DA7BA] bg-clip-text">Build. </span>
                  <span className="text-transparent bg-gradient-to-r from-[#88C0D0] to-[#8FBCBB] bg-clip-text">Customize. </span>
                  <span className="text-transparent bg-gradient-to-r from-[#D08770] to-[#BF616A] bg-clip-text">Deploy Quickly.</span>
                </h2>
                
                <p className="text-lg text-[#9DA7BA]/70 mb-10 max-w-2xl mx-auto">
                  Join thousands of companies shipping faster with Contendo AI&apos;s powerful content generation platform
                </p>
                
                <SignUpButton mode="modal">
                  <Button size="lg" className="relative group overflow-hidden bg-white text-[#0B1220] hover:bg-gray-100 px-10 py-7 text-base font-bold shadow-2xl shadow-white/20 transition-all duration-300 hover:shadow-white/30">
                    <span className="relative z-10">Start your free trial today</span>
                    <ArrowRight className="ml-2 h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </Button>
                </SignUpButton>
                
                {/* Feature Pills */}
                <div className="mt-10 flex flex-wrap justify-center gap-3">
                  {['No credit card required', '14-day free trial', 'Cancel anytime'].map((feature, i) => (
                    <div key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
                      <Check className="h-3 w-3 text-[#88C0D0]" />
                      <span className="text-sm text-[#9DA7BA]">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section - Modern Glass Accordion */}
      <section className="relative z-10 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-gradient-to-r from-[#E6EDF3] to-[#9DA7BA] bg-clip-text mb-4">
              Questions? We&apos;ve got answers
            </h2>
            <p className="text-lg text-[#9DA7BA]/70">Everything you need to know about Contendo AI</p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What is Contendo AI?",
                a: "A powerful SaaS platform that generates long-form, SEO-ready blog posts with AI—including images and comprehensive metrics.",
                icon: Cpu
              },
              {
                q: "Do I need to know SEO?",
                a: "No technical SEO knowledge required. We automatically compute on-page metrics, E-E-A-T scores, keyword density, and provide actionable suggestions.",
                icon: Target
              },
              {
                q: "Can I export my content?",
                a: "Yes, absolutely. Export your content as HTML anytime directly from the editor or preview screens with one click.",
                icon: Cloud
              },
              {
                q: "How reliable are the AI-generated images?",
                a: "Very reliable. We proxy, preload, and continuously poll images before inserting them to ensure they never break or fail to load.",
                icon: ShieldCheck
              },
            ].map((faq, i) => (
              <details key={i} className="group">
                <summary className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-2xl px-8 py-6 text-[#E6EDF3] font-medium list-none hover:border-white/20 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#88C0D0]/20 to-[#8FBCBB]/20">
                      <faq.icon className="h-5 w-5 text-[#88C0D0]" />
                    </div>
                    <span className="text-lg">{faq.q}</span>
                  </div>
                  <ChevronIcon className="h-5 w-5 transition-transform group-open:rotate-180 text-[#88C0D0]" />
                </summary>
                <div className="mt-4 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-xl p-6 ml-16">
                  <p className="text-[#9DA7BA]/80 leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>

          {/* CTA after FAQ */}
          <div className="mt-16 text-center">
            <p className="text-[#9DA7BA] mb-6">Still have questions?</p>
            <Link href="/contact">
              <Button variant="outline" className="border-white/10 bg-white/5 backdrop-blur-xl text-[#E6EDF3] hover:bg-white/10">
                Contact our team
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Enhanced Glassy Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-gradient-to-b from-transparent to-[#0E1626]/50 backdrop-blur-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#88C0D0]/5 via-transparent to-[#D08770]/5" />
        <div className="relative mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Brand Column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#88C0D0] to-[#8FBCBB] p-[1px]">
                  <div className="flex h-full w-full items-center justify-center rounded-xl bg-[#0B1220]">
                    <Sparkles className="h-5 w-5 text-[#88C0D0]" />
                  </div>
                </div>
                <span className="font-bold text-xl text-[#E6EDF3]">Contendo AI</span>
              </div>
              <p className="text-sm text-[#9DA7BA]/70 max-w-xs mb-6">
                The fastest way to build and ship beautiful, SEO-optimized content with AI.
              </p>
              {/* Social Icons */}
              <div className="flex gap-3">
                {['Twitter', 'LinkedIn', 'GitHub'].map((social, i) => (
                  <div key={i} className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#88C0D0] to-[#8FBCBB] rounded-xl blur-md opacity-0 group-hover:opacity-50 transition-opacity" />
                    <div className="relative h-10 w-10 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer">
                      <span className="text-xs text-[#9DA7BA]">{social[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Links Columns */}
            <div>
              <h4 className="text-sm font-semibold text-[#E6EDF3] mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-[#9DA7BA]/70">
                {['Features', 'Pricing', 'API Docs', 'Changelog'].map((item) => (
                  <li key={item}>
                    <Link href="#" className="hover:text-[#88C0D0] transition-colors flex items-center gap-2 group">
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-[#E6EDF3] mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-[#9DA7BA]/70">
                {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <li key={item}>
                    <Link href="#" className="hover:text-[#88C0D0] transition-colors flex items-center gap-2 group">
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-[#E6EDF3] mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-[#9DA7BA]/70">
                {['Templates', 'Tutorials', 'Support', 'Status'].map((item) => (
                  <li key={item}>
                    <Link href="#" className="hover:text-[#88C0D0] transition-colors flex items-center gap-2 group">
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-[#9DA7BA]/50">
                © {new Date().getFullYear()} Contendo AI. All rights reserved.
              </div>
              <div className="flex gap-6 text-sm">
                <Link href="#" className="text-[#9DA7BA]/50 hover:text-[#88C0D0] transition-colors">Privacy Policy</Link>
                <Link href="#" className="text-[#9DA7BA]/50 hover:text-[#88C0D0] transition-colors">Terms of Service</Link>
                <Link href="#" className="text-[#9DA7BA]/50 hover:text-[#88C0D0] transition-colors">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Chevron Icon Component
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      height="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}