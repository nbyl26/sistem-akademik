import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { Guru, Siswa, User } from "@/types/user";
import { ScheduleData, ClassData, SubjectData } from "@/types/master";
import { getAllDocuments, getActiveAcademicYear } from "@/lib/firestore";
import { notFound } from "next/navigation";
import GradeInputForm from "@/components/Teacher/GradeInputForm";

export default async function TeacherGradesPage() {
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
        <div className="p-8 text-center text-lg text-red-700 bg-red-50 rounded-lg">
          Sistem Belum Aktif. Hubungi Admin untuk mengatur Tahun Ajaran Aktif.
        </div>
      );
    }

    const [schedules, classes, subjects, allStudents] = await Promise.all([
      getAllDocuments<ScheduleData>("schedules", [
        ["teacherId", "==", teacherUser.uid],
        ["academicYearId", "==", activeYear.id!],
      ]),
      getAllDocuments<ClassData>("classes"),
      getAllDocuments<SubjectData>("subjects"),
      getAllDocuments<Siswa>("users", [["role", "==", "siswa"]]),
    ]);

    return (
      <GradeInputForm
        teacherId={teacherUser.uid}
        schedules={schedules}
        classes={classes}
        subjects={subjects}
        allStudents={allStudents as Siswa[]}
        activeYearId={activeYear.id!}
      />
    );
  } catch (error) {
    console.error("Gagal memuat Input Nilai Guru:", error);
    return (
      <div className="p-4 text-red-600">
        Terjadi kesalahan saat memuat data. Pastikan semua Master Data terisi.
      </div>
    );
  }
}
