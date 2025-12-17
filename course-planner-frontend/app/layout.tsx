import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Course Planner - Plan Your Academic Journey",
  description: "Browse courses, track enrollment, and plan your academic schedule",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.classList.add(theme);
                if (theme === 'dark') {
                  document.documentElement.classList.remove('light');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {
                document.documentElement.classList.add('dark');
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} transition-colors duration-300`}>
        <NuqsAdapter>
          <Navigation />
          <main className="min-h-screen">{children}</main>
        </NuqsAdapter>
      </body>
    </html>
  );
}
