"use client";

import LoadingSpinner from "@/components/LoadingSpinner";
import PageContainer from "@/components/PageContainer";
import { Suspense } from "react";

function PrivacyPageContent() {
  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">Last updated: December 29, 2024</p>

        <div className="space-y-8">
          {/* Introduction */}
          <section className="light-card dark:dark-card p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Introduction</h2>
            <p className="text-gray-700 dark:text-gray-300">
              SFU Course Planner ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, and safeguard your information when you use our course planning application.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="light-card dark:dark-card p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Information We Collect</h2>

            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3 mt-4">Public Course Data</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We aggregate and display publicly available course information from:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li>SFU's CourseSys API (enrollment data, course offerings, sections)</li>
              <li>CourseDiggers (grade distributions and historical statistics)</li>
              <li>SFU's public course catalog</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3 mt-6">Usage Data</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We may collect basic usage analytics to improve our service, including:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li>Pages visited and features used</li>
              <li>Browser type and device information</li>
              <li>Approximate location (city/country level only)</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-3 mt-6">Cookies and Local Storage</h3>
            <p className="text-gray-700 dark:text-gray-300">
              We use browser local storage to save your theme preferences (light/dark mode). No tracking cookies are
              used.
            </p>
          </section>

          {/* How We Use Your Information */}
          <section className="light-card dark:dark-card p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li>Provide accurate and up-to-date course information</li>
              <li>Display enrollment trends and grade distributions</li>
              <li>Improve application performance and user experience</li>
              <li>Maintain and troubleshoot the service</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section className="light-card dark:dark-card p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Data Sharing</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We do not sell, trade, or otherwise transfer your information to third parties. Course data displayed in
              our application is sourced from publicly available SFU systems.
            </p>
          </section>

          {/* Third-Party Services */}
          <section className="light-card dark:dark-card p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Third-Party Services</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Our application uses the following third-party services:
            </p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li>
                <strong>Vercel:</strong> Hosting and deployment infrastructure
              </li>
              <li>
                <strong>AWS Elastic Beanstalk:</strong> Backend API hosting
              </li>
              <li>
                <strong>Supabase:</strong> Database storage
              </li>
              <li>
                <strong>Cloudflare:</strong> DNS and HTTPS proxy
              </li>
            </ul>
            <p className="text-gray-700 dark:text-gray-300 mt-4">
              These services have their own privacy policies governing their collection and use of your information.
            </p>
          </section>

          {/* Data Security */}
          <section className="light-card dark:dark-card p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Data Security</h2>
            <p className="text-gray-700 dark:text-gray-300">
              We implement appropriate security measures to protect against unauthorized access, alteration, disclosure,
              or destruction of data. All data transmission is encrypted using HTTPS.
            </p>
          </section>

          {/* Your Rights */}
          <section className="light-card dark:dark-card p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Your Rights</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
              <li>Access information we hold about you</li>
              <li>Request correction or deletion of your information</li>
              <li>Object to processing of your information</li>
              <li>Clear your browser's local storage at any time</li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section className="light-card dark:dark-card p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Children's Privacy</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Our service is intended for use by university students and adults. We do not knowingly collect information
              from individuals under 13 years of age.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section className="light-card dark:dark-card p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              We may update this Privacy Policy from time to time. We will notify users of any material changes by
              posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          {/* Contact */}
          <section className="light-card dark:dark-card p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Contact Us</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you have questions about this Privacy Policy, please contact us through the{" "}
              <a href="/about" className="text-orange-600 dark:text-orange-400 hover:underline">
                About page
              </a>
              .
            </p>
          </section>

          {/* Disclaimer */}
          <section className="light-card dark:dark-card p-6 border-l-4 border-orange-500">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Disclaimer</h2>
            <p className="text-gray-700 dark:text-gray-300">
              SFU Course Planner is an independent application and is not officially affiliated with, endorsed by, or
              connected to Simon Fraser University. All course data is sourced from publicly available SFU systems.
            </p>
          </section>
        </div>
      </div>
    </PageContainer>
  );
}

export default function PrivacyPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PrivacyPageContent />
    </Suspense>
  );
}
