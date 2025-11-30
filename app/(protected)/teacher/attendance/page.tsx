import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { Guru, Siswa, User } from "@/types/user";
import { ScheduleData, ClassData, SubjectData } from "@/types/master";
import { getAllDocuments, getActiveAcademicYear } from "@/lib/firestore";
import { notFound } from "next/navigation";
import AttendanceForm from "@/components/Teacher/AttendanceForm"; 

export default async function TeacherAttendancePage() {
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
  const day = new Date().toLocaleDateString("id-ID", { weekday: "long" });

  try {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) {
      return (
        <div className="p-8 text-center text-red-500 bg-red-900/20 rounded-lg border border-red-900/50">
          Sistem Belum Aktif. Hubungi Admin.
        </div>
      );
    }


    const [schedules, classes, subjects, allStudents] = await Promise.all([
      getAllDocuments<ScheduleData>("schedules", [
        ["teacherId", "==", teacherUser.uid],
        ["day", "==", day],
        ["academicYearId", "==", activeYear.id!],
      ]),
      getAllDocuments<ClassData>("classes"),
      getAllDocuments<SubjectData>("subjects"),
      getAllDocuments<Siswa>("users", [["role", "==", "siswa"]]),
    ]);

    return (
      <AttendanceForm
        teacherId={teacherUser.uid}
        schedules={schedules || []}
        classes={classes || []}
        subjects={subjects || []}
        allStudents={allStudents || []}
        activeYearId={activeYear.id!}
      />
    );
  } catch (error) {
    console.error("Gagal memuat Absensi Guru:", error);
    return (
      <div className="p-4 text-red-500">
        Terjadi kesalahan saat memuat data. Pastikan koneksi internet lancar.
      </div>
    );
  }
}
