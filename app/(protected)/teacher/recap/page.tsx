import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { Guru, Siswa, User } from "@/types/user";
import {
  AttendanceRecord,
  ClassData,
  SubjectData,
  ScheduleData,
} from "@/types/master";
import { getAllDocuments, getActiveAcademicYear } from "@/lib/firestore";
import { notFound } from "next/navigation";
import { Printer, Users } from "lucide-react";
import Link from "next/link";

interface ClassSubjectCombo {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
}

export default async function TeacherRecapPage() {
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
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) {
      return (
        <div className="p-8 text-center text-red-500 bg-red-900/20 rounded-xl border border-red-900/50">
          Sistem Belum Aktif. Hubungi Admin.
        </div>
      );
    }

    const [schedules, classes, subjects, allStudents, attendanceRecords] =
      await Promise.all([
        getAllDocuments<ScheduleData>("schedules", [
          ["teacherId", "==", teacherUser.uid],
          ["academicYearId", "==", activeYear.id!],
        ]),
        getAllDocuments<ClassData>("classes"),
        getAllDocuments<SubjectData>("subjects"),
        getAllDocuments<Siswa>("users", [["role", "==", "siswa"]]),
        getAllDocuments<AttendanceRecord>("attendance", [
          ["teacherId", "==", teacherUser.uid],
          ["academicYearId", "==", activeYear.id!],
        ]),
      ]);

    const combos: ClassSubjectCombo[] = [];
    const seen = new Set<string>();

    schedules.forEach((schedule) => {
      const key = `${schedule.classId}-${schedule.subjectId}`;
      if (!seen.has(key)) {
        seen.add(key);
        combos.push({
          classId: schedule.classId,
          className:
            classes.find((c) => c.id === schedule.classId)?.name || "N/A",
          subjectId: schedule.subjectId,
          subjectName:
            subjects.find((s) => s.id === schedule.subjectId)?.name || "N/A",
        });
      }
    });

    const countMap: Record<string, number> = {};
    attendanceRecords.forEach((record) => {
      const key = `${record.classId}-${record.subjectId}`;
      countMap[key] = (countMap[key] || 0) + 1;
    });

    return (
      <div className="p-2">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-zinc-100">
            Rekap Absensi Mengajar
          </h1>
          <p className="text-sm text-zinc-400">
            Tahun Ajaran:{" "}
            <span className="font-bold text-orange-500">{activeYear.name}</span>
          </p>
        </div>

        {combos.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900">
            <Users className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
            <p>Belum ada jadwal mengajar yang tersedia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {combos.map((combo) => {
              const key = `${combo.classId}-${combo.subjectId}`;
              const meetingCount = countMap[key] || 0;

              return (
                <div
                  key={key}
                  className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg hover:border-orange-500/30 transition-all"
                >
                  <h3 className="text-lg font-bold text-zinc-100 mb-1">
                    {combo.className}
                  </h3>
                  <p className="text-sm text-zinc-400 mb-4">
                    {combo.subjectName}
                  </p>

                  <div className="mb-4 p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                    <p className="text-xs text-zinc-500">Total Pertemuan</p>
                    <p className="text-2xl font-bold text-orange-500">
                      {meetingCount}
                    </p>
                  </div>

                  <Link
                    href={`/cetak/absensi?classId=${combo.classId}&subjectId=${combo.subjectId}`}
                    target="_blank"
                    className="w-full bg-zinc-100 text-zinc-900 px-4 py-2.5 rounded-lg font-bold flex items-center justify-center hover:bg-white transition-all shadow-lg active:scale-95"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Cetak Rekap
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Gagal memuat Rekap Absensi Guru:", error);
    return (
      <div className="p-4 text-red-500">
        Terjadi kesalahan saat memuat data.
      </div>
    );
  }
}
