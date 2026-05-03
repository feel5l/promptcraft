import { Link, useLocation } from "wouter";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  MessageSquare,
  Image,
  Video,
  Settings,
  BookOpen,
  Zap,
  Wand2,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/", icon: MessageSquare, label: "Text Prompt", desc: "Generate professional prompts" },
  { href: "/image", icon: Image, label: "Image Prompt", desc: "Midjourney, DALL-E, Flux..." },
  { href: "/video", icon: Video, label: "Video Prompt", desc: "Sora, Runway, Kling..." },
  { href: "/optimize", icon: Wand2, label: "Optimizer", desc: "Improve an existing prompt" },
  { href: "/guide", icon: BookOpen, label: "Guide", desc: "Techniques & best practices" },
  { href: "/settings", icon: Settings, label: "Settings", desc: "Configure your API key" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex w-16 lg:w-56 flex-col fixed inset-y-0 left-0 bg-sidebar border-r border-sidebar-border z-30">
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 lg:px-4 h-14 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 shrink-0">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <span className="hidden lg:block font-mono text-sm font-bold tracking-wider text-foreground">
            PromptCraft
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 py-4 px-2">
          {navItems.map(({ href, icon: Icon, label, desc }) => {
            const active = href === "/" ? location === "/" : location.startsWith(href);
            return (
              <Tooltip key={href} delayDuration={300}>
                <TooltipTrigger asChild>
                  <Link
                    href={href}
                    data-testid={`nav-${label.toLowerCase().replace(" ", "-")}`}
                    className={cn(
                      "flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-md text-sm transition-all duration-150 group",
                      active
                        ? "bg-primary/15 text-primary border border-primary/20"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground border border-transparent"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    <span className="hidden lg:block font-medium">{label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="lg:hidden">
                  <p className="font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border">
          <p className="hidden lg:block text-xs text-muted-foreground font-mono">v1.0 · 2025</p>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 border border-primary/30">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <span className="font-mono text-sm font-bold tracking-wider">PromptCraft</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)} data-testid="button-mobile-menu">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-14 left-0 right-0 bg-sidebar border-b border-sidebar-border p-4" onClick={(e) => e.stopPropagation()}>
            <nav className="flex flex-col gap-1">
              {navItems.map(({ href, icon: Icon, label }) => {
                const active = href === "/" ? location === "/" : location.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-all",
                      active ? "bg-primary/15 text-primary" : "text-sidebar-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-16 lg:ml-56 pt-14 md:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
