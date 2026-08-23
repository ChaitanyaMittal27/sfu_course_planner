import { BarChart3, Database, GraduationCap, Mail, Server, type LucideIcon } from "lucide-react";

type HealthServicePresentation = {
  label: string;
  icon: LucideIcon;
};

const healthServicePresentations: Record<string, HealthServicePresentation> = {
  api: { label: "API", icon: Server },
  database: { label: "Database", icon: Database },
  coursesys: { label: "CourseSys", icon: GraduationCap },
  coursediggers: { label: "CourseDiggers", icon: BarChart3 },
  resend: { label: "Resend", icon: Mail },
};

export function healthServicePresentation(service: string): HealthServicePresentation {
  return healthServicePresentations[service] ?? { label: service, icon: Server };
}
