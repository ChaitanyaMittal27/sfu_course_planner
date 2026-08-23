"use client";

import { Suspense } from "react";
import { BookOpen, ClipboardList } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import LoadingSpinner from "@/components/feedback/LoadingSpinner";
import TaskHub from "@/components/TaskHub";

const comparisonActions = [
  {
    href: "/compare/courses",
    icon: BookOpen,
    title: "Compare courses",
    description: "Choose between different courses using requirements, grade data, and course details.",
    detail: "For example: compare CMPT 276, CMPT 295, and CMPT 213.",
  },
  {
    href: "/compare/sections",
    icon: ClipboardList,
    title: "Compare sections",
    description: "Choose between sections of one course using instructors, campus, availability, and enrollment.",
    detail: "Use this after you have picked a course.",
  },
];

function CompareLandingContent() {
  return (
    <PageContainer>
      <TaskHub
        title="Compare courses and sections"
        description="Use course comparison to choose what to take, then section comparison to choose the best offering."
        actions={comparisonActions}
        note={{
          title: "Which should I use?",
          description:
            "Compare courses when you are deciding between subjects. Compare sections when you already know the course and need to choose the right offering.",
        }}
      />
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
