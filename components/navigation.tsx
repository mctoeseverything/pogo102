"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileQuestion, LayoutGrid, GraduationCap } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: "/quiz", label: "Quiz Generator", icon: FileQuestion },
    { href: "/seating", label: "Seating Chart", icon: LayoutGrid },
    { href: "/classgo", label: "ClassGo", icon: GraduationCap },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <img 
            src="/pogolightfull.png" 
            alt="Pogo" 
            className="h-10 dark:hidden" 
          />
          <img 
            src="/pogoologofull.png" 
            alt="Pogo" 
            className="h-10 hidden dark:block" 
          />
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
