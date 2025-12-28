/**
 * =========================================================
 * Compare Landing Page
 * =========================================================
 *
 * Entry point for the course/section comparison feature.
 * Presents two distinct comparison modes to help students
 * make informed enrollment decisions.
 *
 * MODES:
 * ------
 * 1. Course Comparison (/compare/courses)
 *    - Compare DIFFERENT courses (e.g., CMPT 276 vs CMPT 295)
 *    - Shows: prerequisites, grade stats, difficulty, content
 *    - Use case: "Which course should I take for my degree?"
 *
 * 2. Section Comparison (/compare/sections)
 *    - Compare SAME course, different sections (e.g., D100 vs D200)
 *    - Shows: instructors, campus, enrollment, availability
 *    - Use case: "Which section fits my schedule/preferences?"
 *
 * DATA SOURCES:
 * -------------
 * - Course metadata: PostgreSQL database (static)
 * - Grade stats: CourseDiggers (static, course-level)
 * - Section details: CourseSys API (live, semester-specific)
 *
 * USER FLOW:
 * ----------
 * Landing → Choose mode → Select courses/sections → View comparison
 *
 * NOTE: All comparisons are shareable via URL (nuqs state management)
 * =========================================================
 */

"use client";

import Link from "next/link";
import PageContainer from "@/components/PageContainer";
import { Suspense } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";

function CompareLandingContent() {
  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">Compare & Decide</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Make informed decisions about your courses. Compare different courses to find the right fit, or compare
            sections to choose the best offering.
          </p>
        </div>

        {/* Two Mode Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Mode 1: Course Comparison */}
          <Link href="/compare/courses">
            <div className="light-card dark:dark-card p-8 cursor-pointer transition-all duration-300 hover:scale-105 h-full">
              <div className="flex flex-col h-full">
                {/* Icon */}
                <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>

                {/* Content */}
                <div className="text-center flex-grow">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Which Course Should I Take?</h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Compare different courses side-by-side to see prerequisites, difficulty, grade distributions, and
                    more.
                  </p>

                  {/* Example */}
                  <div className="bg-orange-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Example:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Compare <span className="font-semibold text-orange-600 dark:text-orange-400">CMPT 276</span> vs{" "}
                      <span className="font-semibold text-orange-600 dark:text-orange-400">CMPT 295</span> vs{" "}
                      <span className="font-semibold text-orange-600 dark:text-orange-400">CMPT 213</span>
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div className="text-center mt-auto">
                  <span className="inline-flex items-center text-orange-600 dark:text-orange-400 font-semibold group-hover:translate-x-1 transition-transform">
                    Compare Courses
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Mode 2: Section Comparison */}
          <Link href="/compare/sections">
            <div className="light-card dark:dark-card p-8 cursor-pointer transition-all duration-300 hover:scale-105 h-full">
              <div className="flex flex-col h-full">
                {/* Icon */}
                <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-amber-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                </div>

                {/* Content */}
                <div className="text-center flex-grow">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Which Section Should I Choose?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Compare sections of the same course to see instructors, campus locations, availability, and
                    enrollment status.
                  </p>

                  {/* Example */}
                  <div className="bg-orange-50 dark:bg-slate-700/50 rounded-lg p-4 mb-6">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Example:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Compare <span className="font-semibold text-orange-600 dark:text-orange-400">CMPT 276 D100</span>{" "}
                      vs <span className="font-semibold text-orange-600 dark:text-orange-400">D200</span> vs{" "}
                      <span className="font-semibold text-orange-600 dark:text-orange-400">D300</span>
                    </p>
                  </div>
                </div>

                {/* CTA */}
                <div className="text-center mt-auto">
                  <span className="inline-flex items-center text-orange-600 dark:text-orange-400 font-semibold group-hover:translate-x-1 transition-transform">
                    Compare Sections
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-16 text-center">
          <div className="light-card dark:dark-card p-6 inline-block">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Not sure which to use?</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm max-w-xl">
              <span className="font-medium">Course comparison</span> helps you decide between different courses.{" "}
              <span className="font-medium">Section comparison</span> helps you choose the best section once you've
              picked a course.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

export default function CompareLanding() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CompareLandingContent />
    </Suspense>
  );
}
