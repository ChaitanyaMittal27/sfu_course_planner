"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ArrowLeft, Calendar, Eye, FlaskConical, Menu, MessageSquare, Users, X } from "lucide-react";
import { bodyStyles, labelStyles } from "@/app/fonts";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { label: "Overview", href: "/admin", icon: Activity },
  { label: "Health", href: "/admin/health", icon: Activity },
  { label: "Support", href: "/admin/support", icon: MessageSquare },
  { label: "Terms", href: "/admin/terms", icon: Calendar },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Bookmarks", href: "/admin/bookmarks", icon: Eye },
  { label: "Diagnostics", href: "/admin/test", icon: FlaskConical },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === href : pathname.startsWith(href);
}

function AdminBrand() {
  return (
    <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <span className={`font-display ${labelStyles.sm} font-bold`}>SFU</span>
      </div>
      <div className="min-w-0">
        <p className={`${labelStyles.lg} truncate text-sidebar-foreground`}>Course Planner</p>
        <p className={`${labelStyles.sm} uppercase tracking-widest text-accent`}>Administration</p>
      </div>
    </Link>
  );
}

function AdminNavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className="flex flex-col gap-0.5">
      {navigationItems.map(({ label, href, icon: Icon }) => {
        const active = isActive(pathname, href);

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`relative flex items-center gap-3 rounded-lg px-3 py-2 ${labelStyles.lg} transition-colors ${
              active
                ? "bg-sidebar-accent font-semibold text-sidebar-foreground"
                : "text-text-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
          >
            {active && <span className="absolute -left-3 h-5 w-1 rounded-r-sm bg-primary" />}
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function AdminUserSummary() {
  const { user } = useAuth();
  const initial = (user?.email?.trim()[0] || "A").toUpperCase();

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <span className={`font-display ${labelStyles.sm} font-bold`}>{initial}</span>
      </div>
      <span className={`${bodyStyles.sm} truncate text-sidebar-foreground`}>{user?.email || "Administrator"}</span>
    </div>
  );
}

export default function AdminSidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="border-b border-sidebar-border p-4"><AdminBrand /></div>
        <div className="flex-1 overflow-y-auto p-3">
          <p className={`${labelStyles.sm} mb-2 px-3 uppercase tracking-widest text-text-subtle`}>Operations</p>
          <AdminNavigationLinks />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <AdminUserSummary />
          <Link href="/" className={`mt-3 flex items-center gap-2 px-1 text-text-muted hover:text-text-primary ${labelStyles.md}`}>
            <ArrowLeft className="size-3.5" />
            View course planner
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 lg:hidden">
        <AdminBrand />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label="Toggle admin navigation"
          aria-expanded={mobileMenuOpen}
          aria-controls="admin-mobile-navigation"
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </header>

      {mobileMenuOpen && (
        <div id="admin-mobile-navigation" className="fixed inset-x-0 top-14 z-30 border-b border-sidebar-border bg-sidebar p-4 shadow-lg lg:hidden">
          <AdminNavigationLinks onNavigate={() => setMobileMenuOpen(false)} />
          <div className="mt-4 border-t border-sidebar-border pt-4">
            <AdminUserSummary />
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className={`mt-3 flex items-center gap-2 text-text-muted hover:text-text-primary ${labelStyles.md}`}>
              <ArrowLeft className="size-3.5" />
              View course planner
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
