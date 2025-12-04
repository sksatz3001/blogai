"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Sliders,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Blogs", href: "/dashboard/blogs", icon: FileText },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(true);

  const settingsItems = [
    { name: "General", href: "/dashboard/settings", icon: Sliders },
    // Temporarily hidden - uncomment when needed
    // { name: "Team", href: "/dashboard/team", icon: Users },
    // { name: "Roles", href: "/dashboard/roles", icon: Shield },
  ];

  const isSettingsActive = settingsItems.some(item => pathname === item.href);

  return (
    <div className="flex h-screen w-64 flex-col fixed left-0 top-0 border-r border-border bg-white z-40">
      {/* Logo */}
      <Link href="/dashboard" className="flex h-16 items-center px-6 border-b border-border hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-foreground">Contendo</span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} prefetch={true}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-10 transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Button>
            </Link>
          );
        })}

        {/* Settings Dropdown */}
        <div className="space-y-1">
          <Button
            variant="ghost"
            onClick={() => setSettingsOpen(!settingsOpen)}
            className={cn(
              "w-full justify-start gap-3 h-10 transition-colors",
              isSettingsActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4" />
            <span className="flex-1 text-left">Settings</span>
            {settingsOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          {settingsOpen && (
            <div className="ml-4 space-y-1 mt-1">
              {settingsItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.name} href={item.href} prefetch={true}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 h-9 text-sm pl-3",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* User section */}
      <div className="border-t border-border p-4">
        <div className="flex items-center justify-center">
          <UserButton afterSignOutUrl="/" appearance={{
            elements: {
              avatarBox: "w-9 h-9"
            }
          }} />
        </div>
      </div>
    </div>
  );
}
