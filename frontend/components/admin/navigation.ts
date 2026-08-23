import {
  Activity,
  Calendar,
  Eye,
  FlaskConical,
  MessageSquare,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AdminNavigationItem = {
  id: "overview" | "health" | "support" | "terms" | "users" | "bookmarks" | "diagnostics";
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

export const adminNavigationItems = [
  { id: "overview", label: "Overview", href: "/admin", icon: Activity },
  {
    id: "health",
    label: "Health",
    href: "/admin/health",
    icon: Activity,
    description: "Live status checks for the API, database, CourseSys, CourseDiggers, and Resend.",
  },
  {
    id: "support",
    label: "Support",
    href: "/admin/support",
    icon: MessageSquare,
    description: "Review contact submissions and respond to student questions.",
  },
  {
    id: "terms",
    label: "Terms",
    href: "/admin/terms",
    icon: Calendar,
    description: "Manage the current and enrolling academic terms.",
  },
  {
    id: "users",
    label: "Users",
    href: "/admin/users",
    icon: Users,
    description: "Review registered users, signup trends, and notification preferences.",
  },
  {
    id: "bookmarks",
    label: "Bookmarks",
    href: "/admin/bookmarks",
    icon: Eye,
    description: "Inspect bookmarked offerings, popular courses, and department rankings.",
  },
  {
    id: "diagnostics",
    label: "Diagnostics",
    href: "/admin/test",
    icon: FlaskConical,
    description: "Run manual notification and endpoint checks in a controlled environment.",
  },
] as const satisfies readonly AdminNavigationItem[];
