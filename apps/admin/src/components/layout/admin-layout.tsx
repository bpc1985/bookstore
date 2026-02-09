"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import { Skeleton } from "@bookstore/ui";
import { cn } from "@bookstore/lib";

const SIDEBAR_STORAGE_KEY = "admin-sidebar-collapsed";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isInitialized } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (stored !== null) {
      setCollapsed(stored === "true");
    }
  }, []);

  const handleToggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }

    if (isInitialized && user && user.role !== "admin") {
      router.push("/login");
    }
  }, [isInitialized, user, router]);

  // Allow login page to render without auth
  if (pathname === "/login") {
    return <>{children}</>;
  }

  // Show skeleton while initializing or redirecting unauthenticated users
  if (!isInitialized || !user || user.role !== "admin") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          "hidden border-r bg-card transition-all duration-300 ease-in-out md:block",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <AdminSidebar collapsed={collapsed} onToggle={handleToggle} />
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
