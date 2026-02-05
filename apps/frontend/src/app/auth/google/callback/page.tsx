"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginWithGoogle = useAuthStore(state => state.loginWithGoogle);
  const hasAttempted = useRef(false);

  useEffect(() => {
    if (hasAttempted.current) return;
    hasAttempted.current = true;

    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      router.replace("/login");
      return;
    }

    const handleCallback = async () => {
      try {
        await loginWithGoogle(api, code, state);
        toast.success("Welcome!");
        router.replace("/");
      } catch (error) {
        const message = (error as Error).message;
        if (
          message.includes("400") ||
          message.toLowerCase().includes("state")
        ) {
          toast.error("Sign-in failed. Please try again.");
        } else if (
          message.includes("401") ||
          message.toLowerCase().includes("code")
        ) {
          toast.error("Sign-in failed. Please try again.");
        } else {
          toast.error("Sign-in failed. Please try again.");
        }
        router.replace("/login");
      }
    };

    handleCallback();
  }, [searchParams, loginWithGoogle, router]);

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Completing sign-in...</p>
      </div>
    </div>
  );
}
