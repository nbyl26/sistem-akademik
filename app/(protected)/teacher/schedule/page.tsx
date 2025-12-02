import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { Guru, User } from "@/types/user";
import { notFound } from "next/navigation";
import TeacherScheduleContent from "@/components/Teacher/ScheduleContent";

export default async function TeacherSchedulePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return redirect("/login");

  const verifiedUser = await verifyCookie(token);
  if (!verifiedUser) return redirect("/api/auth/logout");

  const user: User | null = await mapUserRole(verifiedUser);
  if (!user || user.role !== "guru") return notFound();
  const teacherUser = user as Guru;

  return <TeacherScheduleContent teacherId={teacherUser.uid} />;
}
