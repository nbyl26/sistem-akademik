import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import AdminDashboard from "@/pages/AdminDashboard";
import SiswaDashboard from "@/pages/SiswaDashboard";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  if (!token) {
    return redirect("/login");
  }
  const verify = await verifyCookie(token?.value);
  if (!verify) {
    return redirect("/api/auth/logout");
  }

  const user = await mapUserRole(verify);
  if(!user){
    return;
  }

  switch (user.role) {
    case "admin":
      return <AdminDashboard/>  
    break;
    case "siswa":
      return <SiswaDashboard user={user}/>
      break;
    default:
      break;
  }
}
