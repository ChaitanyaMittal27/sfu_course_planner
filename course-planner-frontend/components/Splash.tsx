"use client";

import { useEffect, useState } from "react";

interface SplashProps {
  onComplete: () => void;
}

export default function Splash({ onComplete }: SplashProps) {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [floatingBooks, setFloatingBooks] = useState<number[]>([]);

  // Generate floating book positions
  useEffect(() => {
    setFloatingBooks(Array.from({ length: 6 }, (_, i) => i));
  }, []);

  // Stage progression
  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 300), // Logo appears
      setTimeout(() => setStage(2), 800), // Title types
      setTimeout(() => setStage(3), 1500), // Subtitle + progress
      setTimeout(() => setStage(4), 2800), // Complete
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  // Progress animation
  useEffect(() => {
    if (stage >= 3) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 3;
        });
      }, 30);

      return () => clearInterval(interval);
    }
  }, [stage]);

  // Fade out and complete
  useEffect(() => {
    if (stage === 4) {
      setTimeout(onComplete, 500);
    }
  }, [stage, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-500 ${
        stage === 4 ? "opacity-0" : "opacity-100"
      }`}
      style={{
        background: "linear-gradient(135deg, #E63946 0%, #cd3d3d 100%)",
      }}
    >
      {/* Floating graduation caps background animation */}
      <div className="absolute inset-0 overflow-hidden">
        {floatingBooks.map((i) => (
          <div
            key={i}
            className="absolute animate-float"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${3 + (i % 2)}s`,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="rgba(139, 21, 56, 0.3)" className="drop-shadow-lg">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
            </svg>
          </div>
        ))}
      </div>

      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-red-500/15 rounded-full blur-3xl animate-pulse-slow"
          style={{ top: "10%", left: "20%" }}
        />
        <div
          className="absolute w-80 h-80 bg-red-400/15 rounded-full blur-3xl animate-pulse-slow"
          style={{ bottom: "15%", right: "25%", animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 text-center max-w-2xl px-6">
        {/* Animated Logo Circle */}
        {stage >= 1 && (
          <div className="mb-8 animate-scale-in">
            <div className="relative w-28 h-28 mx-auto">
              {/* Rotating ring */}
              <div className="absolute inset-0 border-4 border-white/30 rounded-full animate-spin-slow" />
              <div className="absolute inset-2 border-4 border-white/20 rounded-full animate-spin-reverse" />

              {/* Center logo */}
              <div className="absolute inset-0 flex items-center justify-center bg-white rounded-full shadow-2xl">
                <svg className="w-16 h-16 text-[#8B1538]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3L1 9l11 6 9-4.91V17h2V9M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Title with typewriter effect */}
        {stage >= 2 && (
          <div className="mb-6">
            <h1
              className="text-6xl md:text-7xl font-bold mb-3 tracking-tight animate-fade-in"
              style={{ color: "#ffffff" }}
            >
              SFU Course Planner
            </h1>
            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-white to-transparent animate-width-expand" />
          </div>
        )}

        {/* Subtitle */}
        {stage >= 2 && (
          <p
            className="text-xl mb-12 animate-fade-in-delay font-light tracking-wide"
            style={{ color: "rgba(255, 255, 255, 0.9)" }}
          >
            Plan Your Academic Journey
          </p>
        )}

        {/* Progress section */}
        {stage >= 3 && (
          <div className="animate-slide-up">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl">
              {/* Progress bar */}
              <div className="relative h-3 bg-black/20 rounded-full overflow-hidden mb-4">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#8B1538] via-white to-[#8B1538] rounded-full transition-all duration-300 ease-out shadow-glow"
                  style={{ width: `${progress}%` }}
                >
                  {/* Animated shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                </div>
              </div>

              {/* Status text */}
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                  {progress < 30 && "Loading courses..."}
                  {progress >= 30 && progress < 60 && "Preparing interface..."}
                  {progress >= 60 && progress < 100 && "Almost ready..."}
                  {progress === 100 && "✓ Ready!"}
                </span>
                <span className="font-bold" style={{ color: "#ffffff" }}>
                  {Math.round(progress)}%
                </span>
              </div>
            </div>

            {/* Floating stats */}
            <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
              <div className="animate-fade-in-stagger-1">
                <div className="font-bold" style={{ color: "#ffffff" }}>
                  500+
                </div>
                <div style={{ color: "rgba(255, 255, 255, 0.7)" }}>Courses</div>
              </div>
              <div className="animate-fade-in-stagger-2">
                <div className="font-bold" style={{ color: "#ffffff" }}>
                  50+
                </div>
                <div style={{ color: "rgba(255, 255, 255, 0.7)" }}>Departments</div>
              </div>
              <div className="animate-fade-in-stagger-3">
                <div className="font-bold" style={{ color: "#ffffff" }}>
                  3
                </div>
                <div style={{ color: "rgba(255, 255, 255, 0.7)" }}>Campuses</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
