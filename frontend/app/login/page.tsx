"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { displayStyles, bodyStyles, labelStyles, headerStyles } from "@/app/fonts";
import { resolveAuthRedirect } from "@/lib/auth/redirect";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "signup") setActiveTab("signup");
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(resolveAuthRedirect(searchParams.get("redirectTo")));
    }
  }, [authLoading, isAuthenticated, router, searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace(resolveAuthRedirect(searchParams.get("redirectTo")));
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to sign in"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setSuccessMessage("Account created! Please check your email to verify your account.");
      // reset form fields
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to create account"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const redirectTo = resolveAuthRedirect(searchParams.get("redirectTo"));
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}` },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to sign in with Google"));
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setForgotSuccess(true);
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotSuccess(false);
        setForgotEmail("");
      }, 3000);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to send reset email"));
    } finally {
      setForgotLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12">
      <Card className="p-5 sm:p-8 max-w-md w-full">
        <CardContent className="p-0">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className={`${displayStyles.sm} text-text-primary mb-2`}>Welcome to SFU Course Planner</h1>
            <p className={`${bodyStyles.md} text-text-muted`}>Sign in to manage your course bookmarks</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border mb-6" role="tablist" aria-label="Account actions">
            {(["signin", "signup"] as const).map((tab) => (
              <button
                key={tab}
                id={`${tab}-tab`}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`${tab}-panel`}
                onClick={() => {
                  setActiveTab(tab);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className={`flex-1 py-2 ${labelStyles.lg} border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-accent text-accent"
                    : "border-transparent text-text-muted hover:text-text-primary"
                }`}
              >
                {tab === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div
              className={`mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded ${bodyStyles.md} text-destructive`}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Success */}
          {successMessage && (
            <div className={`mb-4 p-3 bg-success/10 border border-success/30 rounded ${bodyStyles.md} text-success`} role="status" aria-live="polite">
              {successMessage}
            </div>
          )}

          {/* Sign In Form */}
          {activeTab === "signin" && (
            <form id="signin-panel" role="tabpanel" aria-labelledby="signin-tab" onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="signin-email" className={`${labelStyles.lg} text-text-primary block mb-1`}>Email</label>
                <Input id="signin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="signin-password" className={`${labelStyles.lg} text-text-primary block mb-1`}>Password</label>
                <Input id="signin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="text-right">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-accent p-0 h-auto"
                >
                  Forgot password?
                </Button>
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          )}

          {/* Sign Up Form */}
          {activeTab === "signup" && (
            <form id="signup-panel" role="tabpanel" aria-labelledby="signup-tab" onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label htmlFor="signup-email" className={`${labelStyles.lg} text-text-primary block mb-1`}>Email</label>
                <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="signup-password" className={`${labelStyles.lg} text-text-primary block mb-1`}>Password</label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label htmlFor="signup-confirm-password" className={`${labelStyles.lg} text-text-primary block mb-1`}>Confirm Password</label>
                <Input
                  id="signup-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className={`px-2 bg-background ${bodyStyles.md} text-text-subtle`}>Or continue with</span>
            </div>
          </div>

          {/* Google OAuth */}
          <Button variant="outline" onClick={handleGoogleSignIn} disabled={isLoading} className="w-full gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className={`${labelStyles.lg} text-text-primary`}>Sign in with Google</span>
          </Button>
        </CardContent>
      </Card>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center px-4 z-50">
          <Card className="p-6 max-w-md w-full">
            <CardContent className="p-0" role="dialog" aria-modal="true" aria-labelledby="forgot-password-title" aria-describedby="forgot-password-description">
              {!forgotSuccess ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <h2 id="forgot-password-title" className={`${headerStyles.lg} text-text-primary mb-2`}>Reset Password</h2>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Close reset password dialog"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotEmail("");
                      }}
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <p id="forgot-password-description" className={`${bodyStyles.md} text-text-muted mb-4`}>
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label htmlFor="forgot-password-email" className={`${labelStyles.lg} text-text-primary block mb-1`}>Email</label>
                      <Input
                        id="forgot-password-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setForgotEmail("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={forgotLoading} className="flex-1">
                        {forgotLoading ? "Sending..." : "Send Reset Link"}
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center" role="status" aria-live="polite">
                  <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-success" aria-hidden="true" />
                  </div>
                  <h3 className={`${headerStyles.md} text-text-primary mb-2`}>Email Sent!</h3>
                  <p className={`${bodyStyles.md} text-text-muted`}>Check your email for the password reset link.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LoginPageContent />
    </Suspense>
  );
}
