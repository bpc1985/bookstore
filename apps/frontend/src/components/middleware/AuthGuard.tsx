"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthGuard({
  children,
  requireAuth = true,
}: AuthGuardProps) {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;

    if (requireAuth && !user) {
      // Protected page but user not logged in -> redirect to login
      router.push("/login");
    } else if (!requireAuth && user) {
      // Guest-only page (login/register) but user is logged in -> redirect to profile
      router.push("/profile");
    }
  }, [isInitialized, user, requireAuth, router]);

  // Show loading while checking auth state
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  // Protected page but no user - don't render children while redirecting
  if (requireAuth && !user) {
    return null;
  }

  // Guest-only page but user exists - don't render children while redirecting
  if (!requireAuth && user) {
    return null;
  }

  return <>{children}</>;
}
