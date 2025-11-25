import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { Siswa, User } from "@/types/user";
import { ClassData } from "@/types/master";
import { getAllDocuments, getActiveAcademicYear } from "@/lib/firestore";
import { notFound } from "next/navigation";
import { User as UserIcon, Mail, Clock, Hash, Users } from "lucide-react";

export default async function StudentProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return redirect("/login");
  const user: User | null = await mapUserRole(await verifyCookie(token));
  if (!user || user.role !== "siswa") return notFound();
  const studentUser = user as Siswa;

  try {
    const [activeYear, classes] = await Promise.all([
      getActiveAcademicYear(),
      getAllDocuments<ClassData>("classes"),
    ]);
    const studentClassName =
      classes.find((c) => c.id === studentUser.kelasId)?.name || "Unknown";

    return (
      <div className="p-2">
        <h1 className="text-3xl font-bold mb-6 text-zinc-100">Profil Siswa</h1>

        <div className="max-w-xl mx-auto bg-zinc-900 p-8 rounded-xl shadow-2xl border border-zinc-800 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-orange-500"></div>
          <div className="flex items-center space-x-6 mb-8 pb-6 border-b border-zinc-800">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center border-2 border-orange-500 shadow-lg shadow-orange-500/20">
              <UserIcon className="w-10 h-10 text-zinc-200" />
            </div>
            <div>
              <p className="text-3xl font-bold text-zinc-100">
                {studentUser.nama}
              </p>
              <span className="inline-block mt-2 px-3 py-1 bg-orange-900/30 text-orange-400 text-xs font-bold uppercase rounded-full border border-orange-900/50">
                {studentUser.role}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center text-zinc-300 group hover:text-orange-400 transition-colors">
              <Hash className="w-5 h-5 mr-4 text-zinc-500 group-hover:text-orange-500 transition-colors" />
              <span className="font-medium w-32 text-zinc-500">NIS</span>
              <span className="text-zinc-200 font-mono">{studentUser.nis}</span>
            </div>
            <div className="flex items-center text-zinc-300 group hover:text-orange-400 transition-colors">
              <Mail className="w-5 h-5 mr-4 text-zinc-500 group-hover:text-orange-500 transition-colors" />
              <span className="font-medium w-32 text-zinc-500">Email</span>
              <span className="text-zinc-200">{studentUser.email}</span>
            </div>
            <div className="flex items-center text-zinc-300 group hover:text-orange-400 transition-colors">
              <Users className="w-5 h-5 mr-4 text-zinc-500 group-hover:text-orange-500 transition-colors" />
              <span className="font-medium w-32 text-zinc-500">Kelas</span>
              <span className="text-zinc-200 font-bold">
                {studentClassName}
              </span>
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
    return <div className="p-4 text-red-500">Error.</div>;
  }
}
