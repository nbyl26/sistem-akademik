import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { Guru, Siswa, User } from "@/types/user";
import { AttendanceRecord, ClassData, SubjectData } from "@/types/master";
import { getAllDocuments, getActiveAcademicYear } from "@/lib/firestore";
import { notFound } from "next/navigation";
import PrintTrigger from "@/components/PrintTrigger";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface RecapSummary {
  studentId: string;
  name: string;
  nis: string;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  total: number;
}

export default async function TeacherAttendancePrintPage({
  searchParams,
}: {
  searchParams: Promise<{ classId: string; subjectId: string }>; // Ubah ke Promise
}) {
  // Await searchParams terlebih dahulu
  const params = await searchParams;
  const { classId, subjectId } = params;

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

  const activeYear = await getActiveAcademicYear();
  if (!activeYear) return <div>Tahun ajaran tidak aktif</div>;

  const [attendanceRecords, students, classes, subjects] = await Promise.all([
    getAllDocuments<AttendanceRecord>("attendance", [
      ["classId", "==", classId],
      ["subjectId", "==", subjectId],
      ["academicYearId", "==", activeYear.id!],
      ["teacherId", "==", teacherUser.uid],
    ]),
    getAllDocuments<Siswa>("users", [["role", "==", "siswa"]]),
    getAllDocuments<ClassData>("classes"),
    getAllDocuments<SubjectData>("subjects"),
  ]);

  const currentClass = classes.find((c) => c.id === classId);
  const currentSubject = subjects.find((s) => s.id === subjectId);

  const classStudents = students
    .filter((s) => s.kelasId === classId)
    .sort((a, b) => a.nama.localeCompare(b.nama));

  const summary: RecapSummary[] = classStudents.map((student) => {
    let h = 0,
      s = 0,
      i = 0,
      a = 0;

    attendanceRecords.forEach((record) => {
      const studentData = record.records.find(
        (r) => r.studentId === student.uid
      );
      if (studentData) {
        const status = studentData.status;
        if (status === "Hadir") h++;
        if (status === "Sakit") s++;
        if (status === "Izin") i++;
        if (status === "Alpha") a++;
      }
    });

    return {
      studentId: student.uid,
      name: student.nama,
      nis: student.nis,
      hadir: h,
      sakit: s,
      izin: i,
      alpha: a,
      total: h + s + i + a,
    };
  });

  return (
    <div className="bg-white text-black min-h-screen p-8 font-serif relative">
      <PrintTrigger />

      <div className="print:hidden mb-8">
        <Link
          href="/teacher/recap"
          className="inline-flex items-center text-zinc-600 hover:text-black transition"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Dashboard
        </Link>
      </div>

      <div className="border-b-2 border-black pb-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 border-2 border-black flex items-center justify-center font-bold text-2xl">
            S
          </div>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide">
              SMA Simak Cihuy
            </h1>
            <p className="text-sm">Jl. Raya Pendidikan No. 123, Kota Pelajar</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold">REKAPITULASI ABSENSI</h2>
          <p className="text-sm">Tahun Ajaran: {activeYear.name}</p>
        </div>
      </div>

      <div className="mb-6 text-sm">
        <table className="w-full">
          <tbody>
            <tr>
              <td className="w-32 py-1 font-bold">Kelas</td>
              <td>: {currentClass?.name || "N/A"}</td>
            </tr>
            <tr>
              <td className="py-1 font-bold">Mata Pelajaran</td>
              <td>: {currentSubject?.name || "N/A"}</td>
            </tr>
            <tr>
              <td className="py-1 font-bold">Guru Pengajar</td>
              <td>: {teacherUser.nama}</td>
            </tr>
            <tr>
              <td className="py-1 font-bold">NIP</td>
              <td>: {teacherUser.nip}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <table className="w-full border-collapse border border-black mb-8 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 w-10">No</th>
            <th className="border border-black p-2 text-left">Nama Siswa</th>
            <th className="border border-black p-2 w-24">NIS</th>
            <th className="border border-black p-2 w-10 text-center">H</th>
            <th className="border border-black p-2 w-10 text-center">S</th>
            <th className="border border-black p-2 w-10 text-center">I</th>
            <th className="border border-black p-2 w-10 text-center">A</th>
            <th className="border border-black p-2 w-16 text-center">Total</th>
            <th className="border border-black p-2 w-20 text-center">
              % Hadir
            </th>
          </tr>
        </thead>
        <tbody>
          {summary.map((row, index) => (
            <tr key={row.studentId}>
              <td className="border border-black p-2 text-center">
                {index + 1}
              </td>
              <td className="border border-black p-2">{row.name}</td>
              <td className="border border-black p-2 text-center">{row.nis}</td>
              <td className="border border-black p-2 text-center">
                {row.hadir}
              </td>
              <td className="border border-black p-2 text-center">
                {row.sakit}
              </td>
              <td className="border border-black p-2 text-center">
                {row.izin}
              </td>
              <td className="border border-black p-2 text-center">
                {row.alpha}
              </td>
              <td className="border border-black p-2 text-center font-bold">
                {row.total}
              </td>
              <td className="border border-black p-2 text-center">
                {row.total > 0
                  ? `${((row.hadir / row.total) * 100).toFixed(1)}%`
                  : "0%"}
              </td>
            </tr>
          ))}
          {summary.length === 0 && (
            <tr>
              <td
                colSpan={9}
                className="border border-black p-8 text-center italic text-gray-500"
              >
                Belum ada data siswa atau absensi.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex justify-end mt-12 text-center text-sm break-inside-avoid">
        <div>
          <p className="mb-16">
            Kota Pelajar,{" "}
            {new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            <br />
            Guru Mata Pelajaran
          </p>
          <p className="border-t border-black mx-8 pt-1 font-bold underline uppercase">
            {teacherUser.nama}
          </p>
          <p>NIP: {teacherUser.nip}</p>
        </div>
      </div>
    </div>
  );
}
