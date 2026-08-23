import { Skeleton } from "@/components/ui/skeleton";
import { AdminPage, AdminStatGrid } from "@/components/admin/AdminPage";

interface AdminPageSkeletonProps {
  statCards?: number;
  hasChart?: boolean;
  hasTable?: boolean;
  tableRows?: number;
  hasSecondTable?: boolean;
}

export default function AdminPageSkeleton({
  statCards,
  hasChart,
  hasTable,
  tableRows = 8,
  hasSecondTable,
}: AdminPageSkeletonProps) {
  return (
    <AdminPage>
      {/* Heading */}
      <div className="mb-6">
        <Skeleton className="h-8 w-52 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Stat cards */}
      {statCards && (
        <AdminStatGrid columns={statCards === 5 ? 5 : statCards === 4 ? 4 : 2}>
          {Array.from({ length: statCards }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </AdminStatGrid>
      )}

      {/* Chart */}
      {hasChart && <Skeleton className="h-64 rounded-xl mb-8" />}

      {/* Table */}
      {hasTable && (
        <Skeleton className={`h-[${tableRows * 48}px] min-h-64 rounded-xl ${hasSecondTable ? "mb-8" : ""}`} style={{ height: tableRows * 48 }} />
      )}

      {/* Second table */}
      {hasSecondTable && (
        <Skeleton className="rounded-xl" style={{ height: tableRows * 40 }} />
      )}
    </AdminPage>
  );
}
