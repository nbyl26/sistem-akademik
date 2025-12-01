import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { Guru, User } from "@/types/user";
import { SubjectData, AcademicYear } from "@/types/master";
import { getAllDocuments, getActiveAcademicYear } from "@/lib/firestore";
import { notFound } from "next/navigation";
import { User as UserIcon, Mail, Clock, Hash, BookOpen } from "lucide-react";

export default async function TeacherProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return redirect("/login");

  const verifiedUser = await verifyCookie(token);
  if (!verifiedUser) return redirect("/api/auth/logout");

  const user: User | null = await mapUserRole(verifiedUser);

  if (!user || user.role !== "guru") {
    return notFound();
  }
  const teacherUser = user as Guru;

  try {
    const [activeYear, subjects] = await Promise.all([
      getActiveAcademicYear(),
      getAllDocuments<SubjectData>("subjects"),
    ]);

    const taughtSubjects = teacherUser.mapelIds
      .map((id) => subjects.find((s) => s.id === id)?.name)
      .filter((name): name is string => !!name);

    return (
      <div className="p-2">
        <h1 className="text-3xl font-bold mb-6 text-zinc-100">Profil Guru</h1>

        <div className="max-w-xl mx-auto bg-zinc-900 p-8 rounded-xl shadow-2xl border border-zinc-800 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-orange-500"></div>
          <div className="flex items-center space-x-6 mb-8 pb-6 border-b border-zinc-800">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-orange-500 shadow-lg shadow-orange-500/20">
              <UserIcon className="w-10 h-10 text-zinc-200" />
            </div>
            <div>
              <p className="text-3xl font-bold text-zinc-100">
                {teacherUser.nama}
              </p>
              <span className="inline-block mt-2 px-3 py-1 bg-orange-900/30 text-orange-400 text-xs font-bold uppercase rounded-full border border-orange-900/50">
                {teacherUser.role}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center text-zinc-300 group hover:text-orange-400 transition-colors">
              <Hash className="w-5 h-5 mr-4 text-zinc-500 group-hover:text-orange-500 transition-colors" />
              <span className="font-medium w-32 text-zinc-500">NIP</span>
              <span className="text-zinc-200 font-mono">{teacherUser.nip}</span>
            </div>
            <div className="flex items-center text-zinc-300 group hover:text-orange-400 transition-colors">
              <Mail className="w-5 h-5 mr-4 text-zinc-500 group-hover:text-orange-500 transition-colors" />
              <span className="font-medium w-32 text-zinc-500">Email</span>
              <span className="text-zinc-200">{teacherUser.email}</span>
            </div>
            <div className="flex text-zinc-300 group hover:text-orange-400 transition-colors">
              <BookOpen className="w-5 h-5 mr-4 mt-1 text-zinc-500 group-hover:text-orange-500 transition-colors flex-shrink-0" />
              <span className="font-medium w-32 text-zinc-500">
                Mata Pelajaran
              </span>
              <div className="flex-1">
                {taughtSubjects.length > 0 ? (
                  <ul className="space-y-1">
                    {taughtSubjects.map((subject, index) => (
                      <li
                        key={index}
                        className="text-zinc-200 flex items-center"
                      >
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-2"></span>
                        {subject}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-red-400 text-sm">Belum ditugaskan</span>
                )}
              </div>
            </div>
            <div className="flex items-center text-zinc-300 pt-4 border-t border-zinc-800 mt-4">
              <Clock className="w-5 h-5 mr-4 text-orange-500" />
              <span className="font-medium w-32 text-zinc-500">
                Tahun Ajaran
              </span>
              <span className="text-orange-400 font-bold">
                {activeYear?.name || "..."}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Gagal memuat Profil Guru:", error);
    return (
      <div className="p-4 text-red-500">
        Terjadi kesalahan saat memuat data profil.
      </div>
    );
  }
}
