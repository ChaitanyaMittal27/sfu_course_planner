"use client";

import Link from "next/link";
import { ShieldAlert, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { displayStyles, bodyStyles } from "@/app/fonts";

export default function AdminUnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 text-center">
        <CardContent className="p-0 flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-destructive" />
          </div>

          <div>
            <h1 className={`${displayStyles.sm} text-text-primary mb-2`}>Access denied</h1>
            <p className={`${bodyStyles.lg} text-text-muted`}>
              Your account does not have permission to access the administration area.
            </p>
          </div>

          <Button size="lg" className="gap-2" render={<Link href="/" />}>
            <Home />
            Return to course planner
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
