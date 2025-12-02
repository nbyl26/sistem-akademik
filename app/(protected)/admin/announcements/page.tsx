import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { User } from "@/types/user";
import { AnnouncementData } from "@/types/master";
import { getAllDocuments } from "@/lib/firestore";
import { notFound } from "next/navigation";
import AdminAnnouncementManager from "@/components/Admin/AnnouncementManager";

export default async function AdminAnnouncementsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return redirect("/login");

  const verifiedUser = await verifyCookie(token);
  if (!verifiedUser) return redirect("/api/auth/logout");

  const user: User | null = await mapUserRole(verifiedUser);
  if (!user || user.role !== "admin") {
    return notFound();
  }

  const announcements = await getAllDocuments<AnnouncementData>(
    "announcements"
  );
  const sortedAnnouncements = announcements.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <AdminAnnouncementManager
      initialAnnouncements={sortedAnnouncements}
      adminName={user.nama}
      adminId={user.uid}
    />
  );
}
