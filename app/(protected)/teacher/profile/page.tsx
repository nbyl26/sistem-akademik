import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { Guru, User } from "@/types/user";
import { SubjectData, AcademicYear } from "@/types/master";
import { getAllDocuments, getActiveAcademicYear } from "@/lib/firestore";
import { notFound } from "next/navigation";
import {
  User as UserIcon,
  Mail,
  Clock,
  Hash,
  Briefcase,
  BookOpen,
} from "lucide-react";

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
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-6 text-indigo-700">Profil Guru</h1>

        <div className="max-w-xl mx-auto bg-white p-8 rounded-lg shadow-2xl border-t-4 border-indigo-500">
          <div className="flex items-center space-x-4 mb-6 pb-4 border-b">
            <UserIcon className="w-12 h-12 text-indigo-600 bg-indigo-50 p-2 rounded-full" />
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {teacherUser.nama}
              </p>
              <p className="text-sm text-gray-500 capitalize">
                Role: {teacherUser.role}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Detail Informasi Guru */}
            <div className="flex items-center text-gray-700">
              <Briefcase className="w-5 h-5 mr-3 text-indigo-500" />
              <span className="font-semibold w-32">NIP</span>
              <span>: {teacherUser.nip}</span>
            </div>

            <div className="flex items-center text-gray-700">
              <Mail className="w-5 h-5 mr-3 text-indigo-500" />
              <span className="font-semibold w-32">Email</span>
              <span>: {teacherUser.email}</span>
            </div>

            <div className="flex text-gray-700">
              <BookOpen className="w-5 h-5 mr-3 text-indigo-500 mt-1" />
              <span className="font-semibold w-32">Mengajar Mapel</span>
              <div>
                {taughtSubjects.length > 0 ? (
                  <ul className="list-disc list-inside space-y-0.5">
                    {taughtSubjects.map((subject) => (
                      <li key={subject} className="text-sm">
                        {subject}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm text-red-500">Belum ditugaskan</span>
                )}
              </div>
            </div>

            <div className="flex items-center text-gray-700 pt-2">
              <Clock className="w-5 h-5 mr-3 text-indigo-500" />
              <span className="font-semibold w-32">Tahun Ajaran Aktif</span>
              <span>: {activeYear?.name || "Belum Diatur"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Gagal memuat Profil Guru:", error);
    return (
      <div className="p-4 text-red-600">
        Terjadi kesalahan saat memuat data profil.
      </div>
    );
  }
}
