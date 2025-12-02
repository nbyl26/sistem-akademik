import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { Siswa, User } from "@/types/user";
import { AnnouncementData } from "@/types/master";
import { getAllDocuments } from "@/lib/firestore";
import { notFound } from "next/navigation";
import { Clock, User as UserIcon } from "lucide-react";

export default async function TeacherAnnouncementsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return redirect("/login");
  const verifiedUser = await verifyCookie(token);
  if (!verifiedUser) {
    return redirect("/api/auth/logout");
  }
  const user: User | null = await mapUserRole(verifiedUser);
  if (!user || user.role !== "siswa") {
    return notFound();
  }
  const studentUser = user as Siswa;

  const announcements = await getAllDocuments<AnnouncementData>(
    "announcements"
  );
  const sortedAnnouncements = announcements.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="p-2 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-zinc-100">
        Papan Pengumuman
      </h1>
      <div className="space-y-4 mt-8">
        <h3 className="text-xl font-bold text-zinc-300 mb-4">
          Riwayat Pengumuman
        </h3>
        {sortedAnnouncements.length === 0 ? (
          <p className="text-zinc-500 text-center italic py-8">
            Belum ada pengumuman.
          </p>
        ) : (
          sortedAnnouncements.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg hover:border-orange-500/30 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-bold text-zinc-100">
                  {item.title}
                </h4>
                <span className="text-xs text-zinc-500 flex items-center bg-zinc-950 px-2 py-1 rounded">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(item.date).toLocaleDateString("id-ID")}
                </span>
              </div>
              <p className="text-zinc-400 whitespace-pre-wrap mb-4 leading-relaxed">
                {item.content}
              </p>
              <div className="border-t border-zinc-800 pt-3 flex items-center text-xs text-orange-500 font-medium">
                <UserIcon className="w-3 h-3 mr-1" /> Posted by:{" "}
                {item.authorName}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
