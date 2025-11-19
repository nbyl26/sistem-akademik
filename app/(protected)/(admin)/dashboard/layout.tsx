"use client";

import { useAuth } from "@/context/AuthContext";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router: AppRouterInstance = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return <p className="p-4">Checking authentication...</p>;
  }
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
