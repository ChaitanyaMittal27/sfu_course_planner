"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/PageContainer";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { api, AboutInfo } from "@/lib/api";

export default function AboutPage() {
  const [aboutInfo, setAboutInfo] = useState<AboutInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAboutInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAbout();
      setAboutInfo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load about information");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAboutInfo();
  }, []);

  return (
    <PageContainer title="About">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8">
        {loading && <LoadingSpinner />}

        {error && <ErrorMessage message={error} onRetry={fetchAboutInfo} />}

        {aboutInfo && !loading && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">{aboutInfo.appName}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Created by <strong>{aboutInfo.authorName}</strong>
            </p>
            <p className="text-gray-600 dark:text-gray-300">A modern course planning application for SFU students.</p>

            <div className="mt-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-green-800 dark:text-green-300 font-medium">✓ API Connected Successfully</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
