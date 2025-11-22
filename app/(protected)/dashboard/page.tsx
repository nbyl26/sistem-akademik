import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { Admin, User } from "@/types/user";
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
  return (
    <div>
      <h1>Hello bro</h1>
    </div>
  );
}
