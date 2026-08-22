import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { bodyStyles, headerStyles } from "@/app/fonts";

type TaskEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export default function TaskEmptyState({ icon: Icon, title, description }: TaskEmptyStateProps) {
  return (
    <Card className="min-h-64 p-5 sm:p-6">
      <CardContent className="flex min-h-48 flex-col items-center justify-center p-0 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-raised">
          <Icon className="h-6 w-6 text-text-subtle" />
        </div>
        <h3 className={`${headerStyles.md} text-text-primary mb-2`}>{title}</h3>
        <p className={`${bodyStyles.md} text-text-muted max-w-md`}>{description}</p>
      </CardContent>
    </Card>
  );
}
