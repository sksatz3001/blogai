"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Image as ImageIcon } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number; // 1,2,3
  hasImage: boolean;
  children: TocItem[];
}

interface BlogTocProps {
  html: string;
  className?: string;
}

export function BlogToc({ html, className }: BlogTocProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!html) {
      setItems([]);
      return;
    }
    
    // Parse all headings (with or without IDs)
    const headingRegex = /<h([1-3])(?:\s+id="([^"]+)")?[^>]*>([^<]+)<\/h\1>/gi;
    const imgRegex = /<img[^>]+>/gi;
    
    const found: Array<{ level: number; id: string; text: string; hasImage: boolean }> = [];
    let match: RegExpExecArray | null;
    let lastIndex = 0;
    
    while ((match = headingRegex.exec(html)) !== null) {
      const level = parseInt(match[1], 10);
      const id = match[2] || `heading-${found.length}`;
      const text = match[3].trim();
      
      // Check if there's an image between this heading and the next
      const nextHeadingIndex = html.indexOf('<h', match.index + match[0].length);
      const searchEnd = nextHeadingIndex > 0 ? nextHeadingIndex : html.length;
      const sectionHtml = html.substring(match.index, searchEnd);
      const hasImage = imgRegex.test(sectionHtml);
      
      found.push({ level, id, text, hasImage });
      lastIndex = match.index + match[0].length;
    }
    
    // Build hierarchical structure
    const buildTree = (items: typeof found): TocItem[] => {
      const tree: TocItem[] = [];
      const stack: TocItem[] = [];
      
      items.forEach(item => {
        const node: TocItem = { ...item, children: [] };
        
        // Find parent
        while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
          stack.pop();
        }
        
        if (stack.length === 0) {
          tree.push(node);
        } else {
          stack[stack.length - 1].children.push(node);
        }
        
        stack.push(node);
      });
      
      return tree;
    };
    
    const tree = buildTree(found);
    setItems(tree);
    
    // Auto-expand all by default
    const autoExpand: Record<string, boolean> = {};
    found.forEach(item => {
      autoExpand[item.id] = true;
    });
    setExpanded(autoExpand);
  }, [html]);

  const scrollToHeading = (id: string, text: string) => {
    // Find the editor container
    const editorContainer = document.querySelector('.ProseMirror');
    if (!editorContainer) return;
    
    // Try to find element by ID first
    let el = editorContainer.querySelector(`#${CSS.escape(id)}`) as HTMLElement;
    
    // If not found, try to find by text content
    if (!el) {
      const headings = editorContainer.querySelectorAll('h1, h2, h3');
      headings.forEach(heading => {
        if (heading.textContent?.trim() === text) {
          el = heading as HTMLElement;
        }
      });
    }
    
    if (el) {
      // Scroll the editor container
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("toc-highlight");
      setTimeout(() => el?.classList.remove("toc-highlight"), 1200);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderItem = (item: TocItem) => {
    const hasChildren = item.children.length > 0;
    const isExpanded = expanded[item.id];
    
    return (
      <li key={item.id}>
        <div className="flex items-center gap-1 group">
          {hasChildren && (
            <button
              onClick={() => toggleExpand(item.id)}
              className="p-0.5 hover:bg-muted rounded flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
            </button>
          )}
          {!hasChildren && <span className="w-4 flex-shrink-0" />}
          
          <button
            className={cn(
              "flex-1 flex items-center gap-1.5 rounded px-2 py-1 hover:bg-muted transition-colors text-left min-w-0",
              item.level === 1 && "font-semibold text-sm",
              item.level === 2 && "text-sm",
              item.level === 3 && "text-xs text-muted-foreground"
            )}
            onClick={() => scrollToHeading(item.id, item.text)}
          >
            <span className="flex-1 truncate break-words" title={item.text}>{item.text}</span>
            {item.hasImage && (
              <ImageIcon className="h-3 w-3 text-blue-500 flex-shrink-0" />
            )}
          </button>
        </div>
        
        {hasChildren && isExpanded && (
          <ul className="ml-3 mt-1 space-y-1 border-l border-border pl-2">
            {item.children.map(child => renderItem(child))}
          </ul>
        )}
      </li>
    );
  };

  if (items.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-8">
        No headings found. Start writing to see the structure.
      </div>
    );
  }

  return (
    <nav className={cn("text-sm overflow-hidden", className)} aria-label="Table of contents">
      <ul className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto overflow-x-hidden pr-2">
        {items.map(item => renderItem(item))}
      </ul>
    </nav>
  );
}
