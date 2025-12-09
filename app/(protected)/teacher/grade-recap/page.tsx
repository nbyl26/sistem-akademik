import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { Guru, Siswa, User } from "@/types/user";
import {
  GradeRecord,
  ClassData,
  SubjectData,
  ScheduleData,
  GradeSettings,
} from "@/types/master";
import { getAllDocuments, getActiveAcademicYear } from "@/lib/firestore";
import { notFound } from "next/navigation";
import TeacherGradeRecapContent from "@/components/TeacherGradeRecapContent";

interface ClassSubjectCombo {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  studentCount: number;
}

export interface TeacherGradeRecapData {
  combos: ClassSubjectCombo[];
  yearName: string;
  gradeRecords: GradeRecord[];
  allStudents: Siswa[];
  gradeSettings: GradeSettings | null;
}

export default async function TeacherGradeRecapPage() {
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

    const [
      schedules,
      classes,
      subjects,
      allStudents,
      gradeRecords,
      gradeSettingsList,
    ] = await Promise.all([
      getAllDocuments<ScheduleData>("schedules", [
        ["teacherId", "==", teacherUser.uid],
        ["academicYearId", "==", activeYear.id!],
      ]),
      getAllDocuments<ClassData>("classes"),
      getAllDocuments<SubjectData>("subjects"),
      getAllDocuments<Siswa>("users", [["role", "==", "siswa"]]),
      getAllDocuments<GradeRecord>("grades", [
        ["teacherId", "==", teacherUser.uid],
        ["academicYearId", "==", activeYear.id!],
      ]),
      getAllDocuments<GradeSettings>("grade_settings", [
        ["academicYearId", "==", activeYear.id!],
      ]),
    ]);

    const gradeSettings =
      gradeSettingsList.length > 0 ? gradeSettingsList[0] : null;

    const combos: ClassSubjectCombo[] = [];
    const seen = new Set<string>();

    schedules.forEach((schedule) => {
      const key = `${schedule.classId}-${schedule.subjectId}`;
      if (!seen.has(key)) {
        seen.add(key);
        const studentCount = allStudents.filter(
          (s) => s.kelasId === schedule.classId
        ).length;

        combos.push({
          classId: schedule.classId,
          className:
            classes.find((c) => c.id === schedule.classId)?.name || "N/A",
          subjectId: schedule.subjectId,
          subjectName:
            subjects.find((s) => s.id === schedule.subjectId)?.name || "N/A",
          studentCount,
        });
      }
    });

    const recapData: TeacherGradeRecapData = {
      combos: combos.sort((a, b) => a.className.localeCompare(b.className)),
      yearName: activeYear.name,
      gradeRecords,
      allStudents,
      gradeSettings,
    };

    return <TeacherGradeRecapContent recapData={recapData} />;
  } catch (error) {
    console.error("Gagal memuat Rekap Nilai Guru:", error);
    return (
      <div className="p-4 text-red-500">
        Terjadi kesalahan saat memuat data.
      </div>
    );
  }
}
