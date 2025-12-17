"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme, mounted } = useTheme();

  const navLinks = [
    { name: "Browse", href: "/browse" },
    { name: "Graph", href: "/graph" },
    { name: "Watchers", href: "/watchers" },
    { name: "About", href: "/about" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-orange-200 dark:border-slate-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">SFU Course Planner</span>
          </Link>

          {/* Desktop Navigation + Theme Toggle */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive(link.href)
                    ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md"
                    : "text-gray-700 dark:text-gray-200 hover:bg-orange-100 dark:hover:bg-slate-800"
                }`}
              >
                {link.name}
              </Link>
            ))}

            {/* Theme Toggle (Desktop) */}
            {mounted && (
              <button
                onClick={toggleTheme}
                className="ml-2 p-2.5 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-700"
                aria-label="Toggle theme"
              >
                {theme === "light" ? (
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-orange-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-gray-900 dark:text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 animate-fade-in border-t border-orange-200 dark:border-slate-700 mt-2 pt-2">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${
                    isActive(link.href)
                      ? "bg-gradient-to-r from-red-600 to-orange-600 text-white"
                      : "text-gray-700 dark:text-gray-200 hover:bg-orange-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {/* Theme Toggle (Mobile) */}
              {mounted && (
                <button
                  onClick={toggleTheme}
                  className="px-4 py-3 rounded-lg font-medium text-left text-gray-700 dark:text-gray-200 hover:bg-orange-100 dark:hover:bg-slate-800 flex items-center justify-between border border-gray-200 dark:border-slate-700"
                >
                  <span>Switch Theme</span>
                  {theme === "light" ? (
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
