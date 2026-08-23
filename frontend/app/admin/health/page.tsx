"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api, ServiceHealthCheck } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminPage, AdminPageHeader } from "@/components/admin/AdminPage";
import AdminPageSkeleton from "@/components/admin/AdminPageSkeleton";
import ErrorMessage from "@/components/feedback/ErrorMessage";
import { healthServicePresentation } from "@/components/admin/health-services";
import { bodyStyles, headerStyles, labelStyles } from "@/app/fonts";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function AdminHealthPage() {
  const [checks, setChecks] = useState<ServiceHealthCheck[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<Record<string, Date>>({});
  const [loading, setLoading] = useState(true);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [refreshingService, setRefreshingService] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [serviceErrors, setServiceErrors] = useState<Record<string, string>>({});

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const results = await api.getHealthStatus();
      const refreshedAt = new Date();

      setChecks(results);
      setLastRefreshed(Object.fromEntries(results.map((result) => [result.service, refreshedAt])));
      setServiceErrors({});
    } catch (requestError: unknown) {
      setError(errorMessage(requestError, "Failed to fetch health status"));
    }
  }, []);

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  const handleRefreshAll = async () => {
    setRefreshingAll(true);
    await fetchAll();
    setRefreshingAll(false);
  };

  const handleRefreshService = async (service: string) => {
    setRefreshingService(service);
    setServiceErrors((current) => ({ ...current, [service]: "" }));

    try {
      const [result] = await api.getServiceHealth(service);
      if (!result) {
        throw new Error("The health service returned no result.");
      }

      setChecks((current) => current.map((check) => (check.service === service ? result : check)));
      setLastRefreshed((current) => ({ ...current, [service]: new Date() }));
    } catch (requestError: unknown) {
      setServiceErrors((current) => ({
        ...current,
        [service]: errorMessage(requestError, `Failed to recheck ${service}`),
      }));
    } finally {
      setRefreshingService(null);
    }
  };

  if (loading) {
    return <AdminPageSkeleton hasTable tableRows={5} />;
  }

  const actions = (
    <Button type="button" onClick={handleRefreshAll} disabled={refreshingAll} className="gap-2">
      <RefreshCw className={refreshingAll ? "animate-spin" : ""} />
      Refresh all
    </Button>
  );

  if (error && checks.length === 0) {
    return (
      <AdminPage>
        <AdminPageHeader title="System health" description="Live status checks for external services and infrastructure." actions={actions} />
        <ErrorMessage message={error} onRetry={handleRefreshAll} />
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <AdminPageHeader title="System health" description="Live status checks for external services and infrastructure." actions={actions} />

      {error && <div className="mb-6"><ErrorMessage message={error} onRetry={handleRefreshAll} /></div>}

      {checks.length === 0 ? (
        <Card className="p-6">
          <CardContent className="p-0">
            <h2 className={`${headerStyles.sm} text-text-primary`}>No health checks configured</h2>
            <p className={`${bodyStyles.md} mt-1 text-text-muted`}>No service checks were returned by the API.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {checks.map((check) => {
            const { icon: Icon, label } = healthServicePresentation(check.service);
            const isUp = check.status === "up";
            const isRefreshing = refreshingService === check.service;
            const refreshedAt = lastRefreshed[check.service];
            const serviceError = serviceErrors[check.service];

            return (
              <Card key={check.service} className="p-5">
                <CardContent className="p-0">
                  <div className="mb-3 flex items-center justify-between">
                    <div className={`flex size-9 items-center justify-center rounded-lg border ${isUp ? "border-success/20 bg-success/10 text-success" : "border-destructive/20 bg-destructive/10 text-destructive"}`}>
                      <Icon className="size-4" />
                    </div>
                    <Badge className={isUp ? "border-transparent bg-success/15 text-success" : "border-transparent bg-destructive/15 text-destructive"}>
                      {isUp ? "Operational" : "Down"}
                    </Badge>
                  </div>

                  <h2 className={`${headerStyles.xs} mb-3 text-text-primary`}>{label}</h2>

                  <dl className="mb-4 space-y-1.5">
                    <div className="flex items-center justify-between gap-4">
                      <dt className={`${labelStyles.md} text-text-muted`}>Latency</dt>
                      <dd className={`${labelStyles.md} font-mono text-text-primary`}>{check.latencyMs}ms</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className={`${labelStyles.md} text-text-muted`}>Endpoint</dt>
                      <dd className={`${labelStyles.sm} truncate font-mono text-text-subtle`}>{check.url}</dd>
                    </div>
                    {refreshedAt && (
                      <div className="flex items-center justify-between gap-4">
                        <dt className={`${labelStyles.md} text-text-muted`}>Last refreshed</dt>
                        <dd className={`${labelStyles.sm} font-mono text-text-subtle`}>{formatTime(refreshedAt)}</dd>
                      </div>
                    )}
                  </dl>

                  {serviceError && <p className={`${bodyStyles.sm} mb-3 text-destructive`} role="status">{serviceError}</p>}

                  <Button type="button" variant="outline" size="sm" onClick={() => handleRefreshService(check.service)} disabled={isRefreshing} className="w-full gap-1.5">
                    <RefreshCw className={isRefreshing ? "animate-spin" : ""} />
                    Recheck
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
