"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";

export default function GeneratingPage() {
  const router = useRouter();
  const params = useParams();
  const search = useSearchParams();
  const blogId = useMemo(() => Number(Array.isArray((params as any).id) ? (params as any).id[0] : (params as any).id), [params]);
  const [error, setError] = useState<string | null>(null);
  const [msgIdx, setMsgIdx] = useState(0);
  const messages = useMemo(() => [
    "Planning structure…",
    "Writing sections…",
    "Adding insights…",
    "Optimizing for SEO…",
    "Generating images…",
    "Finalizing content…",
  ], []);

  const ctx = useMemo(() => ({
    title: search.get("title") || "",
    primary: search.get("primary") || "",
    secondary: (search.get("secondary") || ""),
    wordCount: Number(search.get("wordCount") || "1000"),
    companyProfileId: search.get("companyProfileId") || "self",
  }), [search]);

  useEffect(() => {
    let mounted = true;
    // Rotate progress messages
    const iv = window.setInterval(() => setMsgIdx((i) => (i + 1) % messages.length), 1300);
    const run = async () => {
      try {
        const key = `outline:${blogId}`;
        const outlineJson = (typeof window !== 'undefined') ? window.sessionStorage.getItem(key) : null;
        if (!outlineJson) {
          setError("Outline not found. Returning to outline step…");
          setTimeout(() => router.push(`/dashboard/create/outline/${blogId}?title=${encodeURIComponent(ctx.title)}&primary=${encodeURIComponent(ctx.primary)}&secondary=${encodeURIComponent(ctx.secondary)}&wordCount=${ctx.wordCount}&companyProfileId=${encodeURIComponent(ctx.companyProfileId)}`), 1200);
          return;
        }
        const outline = JSON.parse(outlineJson);
        const res = await fetch("/api/blogs/generate-from-outline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            blogId,
            title: ctx.title,
            primaryKeyword: ctx.primary,
            secondaryKeywords: ctx.secondary.split(",").map(s=>s.trim()).filter(Boolean),
            targetWordCount: ctx.wordCount,
            outline: outline.sections || outline,
            featuredImage: outline.featuredImage !== undefined ? outline.featuredImage : true,
            companyProfileId: ctx.companyProfileId === "self" ? null : Number(ctx.companyProfileId),
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        await res.json();
        if (!mounted) return;
        router.replace(`/dashboard/blogs/${blogId}/edit`);
      } catch (e) {
        console.error(e);
        setError("Failed to generate blog. Returning to outline…");
        setTimeout(() => router.push(`/dashboard/create/outline/${blogId}?title=${encodeURIComponent(ctx.title)}&primary=${encodeURIComponent(ctx.primary)}&secondary=${encodeURIComponent(ctx.secondary)}&wordCount=${ctx.wordCount}&companyProfileId=${encodeURIComponent(ctx.companyProfileId)}`), 1500);
      }
    };
    run();
    return () => { mounted = false; window.clearInterval(iv); };
  }, [blogId, ctx.title, ctx.primary, ctx.secondary, ctx.wordCount, ctx.companyProfileId, router, messages.length]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }} className="relative mx-auto mb-6 w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 border border-border flex items-center justify-center">
          <Sparkles className="h-10 w-10 text-primary" />
          <motion.span
            className="absolute inset-0 rounded-2xl"
            initial={{ boxShadow: "0 0 0 0 rgba(0,0,0,0)" }}
            animate={{ boxShadow: [
              "0 0 0 0 rgba(0,0,0,0)",
              "0 0 30px 6px rgba(255,255,255,0.06)",
              "0 0 0 0 rgba(0,0,0,0)"
            ] }}
            transition={{ repeat: Infinity, duration: 2.2 }}
          />
        </motion.div>
        <div className="mx-auto w-[320px] h-3 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-accent"
            initial={{ width: "0%" }}
            animate={{ width: ["0%", "100%", "0%"] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          />
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{messages[msgIdx]}</p>
        {error && <p className="mt-2 text-destructive text-sm">{error}</p>}
      </div>
    </div>
  );
}
