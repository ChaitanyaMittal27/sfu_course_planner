import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { bodyStyles, displayStyles, headerStyles, labelStyles } from "@/app/fonts";

type TaskHubAction = {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  detail?: string;
};

type TaskHubProps = {
  title: string;
  description: string;
  actions: TaskHubAction[];
  note?: {
    title: string;
    description: string;
  };
};

export default function TaskHub({ title, description, actions, note }: TaskHubProps) {
  return (
    <div>
      <header className="mb-6 sm:mb-8">
        <h1 className={`${displayStyles.mdResponsive} text-text-primary mb-2`}>{title}</h1>
        <p className={`${bodyStyles.lg} text-text-muted max-w-2xl`}>{description}</p>
      </header>

      <div className={`grid gap-4 ${actions.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.href} href={action.href} className="group block h-full focus:outline-none">
              <Card className="h-full p-5 sm:p-6 transition-colors hover:border-accent/50 group-focus-visible:ring-2 group-focus-visible:ring-ring">
                <CardContent className="flex h-full flex-col p-0">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-raised">
                      <Icon className="h-5 w-5 text-accent" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-text-subtle transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                  </div>

                  <h2 className={`${headerStyles.lg} text-text-primary mb-2 group-hover:text-accent transition-colors`}>
                    {action.title}
                  </h2>
                  <p className={`${bodyStyles.md} text-text-muted`}>{action.description}</p>
                  {action.detail && <p className={`${labelStyles.md} text-text-subtle mt-4`}>{action.detail}</p>}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {note && (
        <Card className="mt-6 sm:mt-8 p-5 sm:p-6">
          <CardContent className="p-0">
            <h2 className={`${headerStyles.sm} text-text-primary mb-2`}>{note.title}</h2>
            <p className={`${bodyStyles.md} text-text-muted max-w-3xl`}>{note.description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
