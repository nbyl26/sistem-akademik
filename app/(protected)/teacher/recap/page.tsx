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
import TeacherRecapContent from "@/components/TeacherRecapContent";

interface ClassSubjectCombo {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  meetingCount: number;
}

export interface TeacherRecapData {
  combos: ClassSubjectCombo[];
  yearName: string;
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
        const meetingCount = attendanceRecords.filter(
          (record) =>
            record.classId === schedule.classId &&
            record.subjectId === schedule.subjectId
        ).length;

        combos.push({
          classId: schedule.classId,
          className:
            classes.find((c) => c.id === schedule.classId)?.name || "N/A",
          subjectId: schedule.subjectId,
          subjectName:
            subjects.find((s) => s.id === schedule.subjectId)?.name || "N/A",
          meetingCount,
        });
      }
    });

    const recapData: TeacherRecapData = {
      combos: combos.sort((a, b) =>
        a.className.localeCompare(b.className)
      ),
      yearName: activeYear.name,
    };

    return <TeacherRecapContent recapData={recapData} />;
  } catch (error) {
    console.error("Gagal memuat Rekap Absensi Guru:", error);
    return (
      <div className="p-4 text-red-500">
        Terjadi kesalahan saat memuat data.
      </div>
    );
  }
}
