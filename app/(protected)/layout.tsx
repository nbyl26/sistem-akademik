import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { User } from "@/types/user";
import Sidebar from "@/components/Layout/Sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return redirect("/auth/login");

  const verifiedUser = await verifyCookie(token);
  if (!verifiedUser) return redirect("/api/auth/logout");

  const user: User | null = await mapUserRole(verifiedUser);
  if (!user) return redirect("/api/auth/logout");

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden">
      <Sidebar user={user} />
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-950 text-zinc-100">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
