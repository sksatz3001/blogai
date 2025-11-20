"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Sparkles,
  Users,
  Shield,
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
    <div className="flex h-screen w-64 flex-col fixed left-0 top-0 border-r border-border bg-background/95 backdrop-blur-xl z-40 shadow-xl">
      {/* Logo */}
      <Link href="/dashboard" className="flex h-16 items-center px-6 border-b border-border hover:bg-muted transition-all duration-200">
        <Image src="/logo.svg" alt="Contendo" width={120} height={24} priority className="h-8 w-auto" />
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-3 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} prefetch={true}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-12 transition-all duration-200 rounded-xl",
                  isActive
                    ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border border-primary/30 shadow-lg shadow-primary/10"
                    : "text-foreground hover:bg-muted hover:text-primary"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
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
              "w-full justify-start gap-3 h-12 transition-all duration-200 rounded-xl",
              isSettingsActive
                ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border border-primary/30 shadow-lg shadow-primary/10"
                : "text-foreground hover:bg-muted hover:text-primary"
            )}
          >
            <Settings className="h-5 w-5" />
            <span className="font-medium flex-1 text-left">Settings</span>
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
                        "w-full justify-start gap-3 h-10 transition-all duration-200 rounded-lg text-sm pl-3",
                        isActive
                          ? "bg-primary/10 text-primary border-l-2 border-primary ml-0"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-primary hover:border-l-2 hover:border-primary/30 ml-0"
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
      <div className="border-t border-border p-4 bg-background/50">
        <div className="flex items-center justify-center">
          <UserButton afterSignOutUrl="/" appearance={{
            elements: {
              avatarBox: "w-10 h-10 ring-2 ring-primary"
            }
          }} />
        </div>
      </div>
    </div>
  );
}
