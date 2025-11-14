"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  text: string;
  level: number; // 1,2,3
}

interface BlogTocProps {
  html: string;
  className?: string;
}

export function BlogToc({ html, className }: BlogTocProps) {
  const [items, setItems] = useState<TocItem[]>([]);

  useEffect(() => {
    if (!html) {
      setItems([]);
      return;
    }
    // Parse headings via regex (fast & sufficient for controlled HTML)
    const regex = /<h([1-3]) id="([^"]+)"[^>]*>([^<]+)<\/h\1>/gi;
    const found: TocItem[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(html)) !== null) {
      found.push({ level: parseInt(match[1], 10), id: match[2], text: match[3] });
    }
    setItems(found);
  }, [html]);

  if (items.length === 0) return null;

  return (
    <nav className={cn("text-sm space-y-2", className)} aria-label="Table of contents">
      <div className="font-semibold mb-2 text-[#ECEFF4]">Table of Contents</div>
      <ul className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
        {items.map((item) => (
          <li key={item.id} className={cn("", item.level === 1 && "mt-2 font-bold", item.level === 2 && "ml-2", item.level === 3 && "ml-4")}>            
            <a
              href={`#${item.id}`}
              className="block rounded px-2 py-1 hover:bg-[#2E3440] text-[#D8DEE9] hover:text-[#88C0D0] transition-colors duration-150"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(item.id);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                  // brief highlight
                  el.classList.add("toc-highlight");
                  setTimeout(() => el.classList.remove("toc-highlight"), 1200);
                }
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
