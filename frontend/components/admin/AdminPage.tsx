import type { ReactNode } from "react";
import { bodyStyles, displayStyles } from "@/app/fonts";
import { Card, CardContent } from "@/components/ui/card";

type AdminPageProps = {
  children: ReactNode;
  className?: string;
};

type AdminPageHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
};

type AdminStatGridProps = {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5;
};

type AdminTableProps = {
  children: ReactNode;
  className?: string;
};

const statGridColumns = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
};

export function AdminPage({ children, className = "" }: AdminPageProps) {
  return <div className={`w-full max-w-[1180px] p-4 sm:p-6 lg:p-8 ${className}`}>{children}</div>;
}

export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className={`${displayStyles.mdResponsive} mb-1 text-text-primary`}>{title}</h1>
        <p className={`${bodyStyles.md} text-text-muted`}>{description}</p>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}

export function AdminStatGrid({ children, columns = 4 }: AdminStatGridProps) {
  return <div className={`mb-8 grid gap-3.5 ${statGridColumns[columns]}`}>{children}</div>;
}

export function AdminTable({ children, className = "" }: AdminTableProps) {
  return <Card className={`overflow-hidden ${className}`}><CardContent className="p-0">{children}</CardContent></Card>;
}
