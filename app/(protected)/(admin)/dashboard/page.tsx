"use client";
import { useAuth } from "@/context/AuthContext";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router: AppRouterInstance = useRouter();

  if (!loading && !user) {
    router.push("/login");
  }

  return <div>Selamat datang {user?.email}</div>;
}
