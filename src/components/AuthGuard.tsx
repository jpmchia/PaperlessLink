"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/api/hooks/use-auth";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // Allow access to signin page without authentication
    if (pathname === "/signin") {
      return;
    }

    // Check authentication status (only on client)
    if (!isAuthenticated()) {
      router.push("/signin");
    }
  }, [isMounted, isAuthenticated, router, pathname]);

  // Don't render children during SSR or if not authenticated (except on signin page)
  if (!isMounted) {
    return null; // Prevent hydration mismatch
  }

  if (pathname !== "/signin" && !isAuthenticated()) {
    return null;
  }

  return <>{children}</>;
}

