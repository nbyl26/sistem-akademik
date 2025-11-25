import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { Guru, User } from "@/types/user";
import {
  ScheduleData,
  ClassData,
  SubjectData,
  AcademicYear,
} from "@/types/master";
import { getAllDocuments, getActiveAcademicYear } from "@/lib/firestore";
import { notFound } from "next/navigation";
import { Calendar } from "lucide-react";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

export default async function TeacherSchedulePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return redirect("/login");

  const verifiedUser = await verifyCookie(token);
  if (!verifiedUser) return redirect("/api/auth/logout");

  const user: User | null = await mapUserRole(verifiedUser);
  if (!user || user.role !== "guru") return notFound();
  const teacherUser = user as Guru;

  try {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) {
      return (
        <div className="p-8 text-center text-lg text-red-500 bg-red-900/20 rounded-lg border border-red-900/50">
          Sistem Belum Aktif. Hubungi Admin.
        </div>
      );
    }

    const [schedules, classes, subjects] = await Promise.all([
      getAllDocuments<ScheduleData>("schedules", [
        ["teacherId", "==", teacherUser.uid],
        ["academicYearId", "==", activeYear.id!],
      ]),
      getAllDocuments<ClassData>("classes"),
      getAllDocuments<SubjectData>("subjects"),
    ]);

    const getName = (id: string, list: { id: string; name: string }[]) =>
      list.find((item) => item.id === id)?.name || "N/A";

    return (
      <div className="p-2">
        <h1 className="text-3xl font-bold mb-2 text-zinc-100">
          Jadwal Mengajar Saya
        </h1>
        <p className="text-sm text-zinc-400 mb-6">
          Tahun Ajaran:{" "}
          <span className="font-bold text-orange-500">{activeYear.name}</span>
        </p>

        {schedules.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
            <p>Tidak ada jadwal mengajar yang ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg overflow-hidden">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-950/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Hari/Waktu
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Kelas
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Mata Pelajaran
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Ruang
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {schedules
                  .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day))
                  .map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-200">
                        <span className="font-bold text-orange-500">
                          {s.day}
                        </span>
                        <br />
                        <span className="text-xs text-zinc-500">
                          {s.startTime} - {s.endTime}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300 font-medium">
                        {getName(s.classId, classes)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                        {getName(s.subjectId, subjects)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                        {s.room}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4 text-red-500">
        Terjadi kesalahan saat memuat data.
      </div>
    );
  }
}
