"use client";

import { Suspense } from "react";
import { BarChart2, TrendingUp, Users } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import LoadingSpinner from "@/components/feedback/LoadingSpinner";
import TaskHub from "@/components/TaskHub";

const analyticsActions = [
  {
    href: "/graph/load",
    icon: TrendingUp,
    title: "Load over time",
    description: "Track how full a course has been across recent semesters.",
    detail: "Use this to spot consistently high-demand courses.",
  },
  {
    href: "/graph/enrollment",
    icon: Users,
    title: "Enrollment vs. capacity",
    description: "Compare enrollment with the number of available seats over time.",
    detail: "Use this to understand whether capacity has kept pace with demand.",
  },
  {
    href: "/graph/grades",
    icon: BarChart2,
    title: "Grade distribution",
    description: "Review historical grade breakdowns and course-level statistics.",
    detail: "Grade data is sourced from CourseDiggers.",
  },
];

function GraphLandingPageContent() {
  return (
    <PageContainer>
      <TaskHub
        title="Course Analytics"
        description="Explore historical enrollment and grade data before choosing a course or section."
        actions={analyticsActions}
        note={{
          title: "About the data",
          description:
            "Enrollment data is fetched from SFU’s CourseSys API. Grade distributions are historical course-level averages from CourseDiggers and may not be available for every course.",
        }}
      />
    </PageContainer>
  );
}

export default function GraphLandingPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <GraphLandingPageContent />
    </Suspense>
  );
}
