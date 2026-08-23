"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Bookmark, Calendar, Mail, ShieldCheck, User } from "lucide-react";
import { api, AdminUserDetailResponse } from "@/lib/api";
import { bodyStyles, headerStyles, labelStyles } from "@/app/fonts";
import { formatSemesterCode } from "@/lib/semester";
import { AdminPage, AdminPageHeader, AdminTable } from "@/components/admin/AdminPage";
import AdminPageSkeleton from "@/components/admin/AdminPageSkeleton";
import ErrorMessage from "@/components/ErrorMessage";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatDate(value: string | null) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<AdminUserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const result = await api.getAdminUser(params.id);
        if (active) {
          setError(null);
          setData(result);
        }
      } catch (requestError: unknown) {
        if (active) setError(errorMessage(requestError, "Failed to load this user."));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUser();
    return () => { active = false; };
  }, [params.id]);

  const fetchUser = useCallback(async () => {
    try {
      setError(null);
      setData(await api.getAdminUser(params.id));
    } catch (requestError: unknown) {
      setError(errorMessage(requestError, "Failed to load this user."));
    }
  }, [params.id]);

  if (loading) return <AdminPageSkeleton hasTable tableRows={5} />;

  const backLink = (
    <Link href="/admin/users" className={`${labelStyles.md} inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}>
      <ArrowLeft className="size-4" />
      Back to users
    </Link>
  );

  if (error || !data) {
    return (
      <AdminPage>
        <div className="mb-4">{backLink}</div>
        <ErrorMessage message={error ?? "User not found."} onRetry={fetchUser} />
      </AdminPage>
    );
  }

  const { user, bookmarks } = data;
  const details = [
    { label: "Email", value: user.email, icon: Mail },
    { label: "Provider", value: user.provider || "email", icon: User },
    { label: "Joined", value: formatDate(user.createdAt), icon: Calendar },
    { label: "Last sign-in", value: formatDate(user.lastSignInAt), icon: Calendar },
  ];

  return (
    <AdminPage>
      <div className="mb-4">{backLink}</div>
      <AdminPageHeader title={user.displayName || user.email} description="Account information and saved course offerings." />

      <div className="mb-8 grid gap-3.5 md:grid-cols-2">
        {details.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5">
            <CardContent className="p-0">
              <div className="mb-2 flex items-center gap-2 text-text-muted"><Icon className="size-4" /><span className={labelStyles.md}>{label}</span></div>
              <p className={`${bodyStyles.md} break-words text-text-primary`}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-8 p-5">
        <CardContent className="p-0">
          <h2 className={`${headerStyles.xs} mb-4 text-text-primary`}>Account status</h2>
          <div className="flex flex-wrap gap-2">
            <Badge className={user.emailVerified ? "border-transparent bg-success/15 text-success" : "border-transparent bg-warning/15 text-warning"}>
              <ShieldCheck className="mr-1 size-3" />
              {user.emailVerified ? "Email verified" : "Email unverified"}
            </Badge>
            <Badge variant="secondary">{user.emailNotificationsEnabled ? "Notifications enabled" : "Notifications disabled"}</Badge>
            {user.isAnonymous && <Badge variant="secondary">Anonymous account</Badge>}
          </div>
          {user.preferredEmail && <p className={`${bodyStyles.sm} mt-3 text-text-muted`}>Notification email: {user.preferredEmail}</p>}
        </CardContent>
      </Card>

      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className={`${headerStyles.xs} text-text-primary`}>Saved offerings</h2>
        <span className={`${labelStyles.sm} font-mono text-text-subtle`}>{bookmarks.length} saved</span>
      </div>
      <AdminTable>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left">
            <thead className="border-b border-border bg-surface-raised">
              <tr className={`${labelStyles.sm} uppercase tracking-wider text-text-subtle`}>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Term</th>
                <th className="px-4 py-3 font-medium">Section</th>
              </tr>
            </thead>
            <tbody>
              {bookmarks.map((bookmark) => (
                <tr key={bookmark.bookmarkId} className="border-b border-border last:border-0">
                  <td className={`${labelStyles.lg} whitespace-nowrap px-4 py-3 text-text-primary`}>{bookmark.deptCode} {bookmark.courseNumber}</td>
                  <td className={`${bodyStyles.sm} max-w-80 truncate px-4 py-3 text-text-muted`}>{bookmark.title || "—"}</td>
                  <td className={`${bodyStyles.sm} whitespace-nowrap px-4 py-3 text-text-muted`}>{formatSemesterCode(bookmark.semesterCode)}</td>
                  <td className={`${labelStyles.md} whitespace-nowrap px-4 py-3 font-mono text-text-primary`}>{bookmark.section}</td>
                </tr>
              ))}
              {bookmarks.length === 0 && (
                <tr><td colSpan={4} className={`${bodyStyles.md} px-4 py-10 text-center text-text-muted`}>This user has no saved offerings.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminTable>

      <div className="mt-8 flex items-center gap-2 text-text-muted">
        <Bookmark className="size-4" />
        <p className={bodyStyles.sm}>Bookmark data is read-only in the admin console.</p>
      </div>
    </AdminPage>
  );
}
