import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import AdminDashboard from "@/components/AdminDashboard";
import SiswaDashboard from "@/components/SiswaDashboard";
import GuruDashboard from "@/components/GuruDashboard";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  if (!token) {
    return redirect("/auth/login");
  }

  const verifiedUser = await verifyCookie(token.value);
  if (!verifiedUser) {
    return redirect("/api/auth/logout");
  }

  const user = await mapUserRole(verifiedUser);

  if (!user) {
    return redirect("/api/auth/logout");
  }

  switch (user.role) {
    case "admin":
      return <AdminDashboard />;
    case "guru":
      return <GuruDashboard />; 
    case "siswa":
      return <SiswaDashboard user={user} />;
    default:
      return <div>Role tidak dikenal.</div>;
  }
}
