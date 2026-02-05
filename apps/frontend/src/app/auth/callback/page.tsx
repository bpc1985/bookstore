"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const loginWithTokens = useAuthStore(state => state.loginWithTokens);
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const handleCallback = () => {
      try {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));

        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (!accessToken || !refreshToken) {
          toast.error("Sign-in failed. No tokens received.");
          router.replace("/login");
          return;
        }

        loginWithTokens(api, accessToken, refreshToken);
        toast.success("Welcome!");
        router.replace("/");
      } catch (error) {
        // const message = (error as Error).message;
        toast.error("Sign-in failed. Please try again.");
        router.replace("/login");
      }
    };

    handleCallback();
  }, [loginWithTokens, router]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Completing sign-in...</p>
      </div>
    </div>
  );
}
