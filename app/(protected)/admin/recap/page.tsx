import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { Siswa, User } from "@/types/user";
import {
  AttendanceRecord,
  AttendanceStatus,
  ClassData,
  AcademicYear,
  GradeRecord,
  SubjectData,
} from "@/types/master";
import { getAllDocuments, getActiveAcademicYear } from "@/lib/firestore";
import { notFound } from "next/navigation";
import { Users, Award, XCircle, CheckCircle } from "lucide-react";

interface StudentRecap {
  uid: string;
  name: string;
  nis: string;
  className: string;
  total: number;
  Hadir: number;
  Sakit: number;
  Izin: number;
  Alpha: number;
  grades: Record<string, { subjectName: string; finalGrade: number }>;
}

const INITIAL_STATUS = { Hadir: 0, Sakit: 0, Izin: 0, Alpha: 0 };

const processGrades = (
  gradeRecords: GradeRecord[],
  subjects: SubjectData[]
): Record<
  string,
  Record<string, { finalGrade: number; subjectName: string }>
> => {
  const studentGrades: Record<string, Record<string, number[]>> = {};

  gradeRecords.forEach((record) => {
    const subjectId = record.subjectId;
    Object.keys(record.scores).forEach((studentId) => {
      const score = record.scores[studentId];
      if (score === null || score === undefined) return;
      if (!studentGrades[studentId]) studentGrades[studentId] = {};
      if (!studentGrades[studentId][subjectId])
        studentGrades[studentId][subjectId] = [];
      studentGrades[studentId][subjectId].push(score);
    });
  });

  const finalReport: Record<
    string,
    Record<string, { finalGrade: number; subjectName: string }>
  > = {};
  const subjectMap = subjects.reduce(
    (map, s) => ({ ...map, [s.id]: s.name }),
    {} as Record<string, string>
  );

  Object.keys(studentGrades).forEach((studentId) => {
    finalReport[studentId] = {};
    Object.keys(studentGrades[studentId]).forEach((subjectId) => {
      const scores = studentGrades[studentId][subjectId];
      const total = scores.reduce((sum, score) => sum + score, 0);
      const average = total / scores.length;
      finalReport[studentId][subjectId] = {
        subjectName: subjectMap[subjectId] || "Mapel Unknown",
        finalGrade: parseFloat(average.toFixed(0)),
      };
    });
  });
  return finalReport;
};

export default async function AdminRecapPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return redirect("/login");
  const user: User | null = await verifyCookie(token).then(mapUserRole);
  if (!user || user.role !== "admin") return notFound();

  try {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear)
      return (
        <div className="p-8 text-center text-red-500">
          Sistem Akademik belum aktif.
        </div>
      );

    const [
      allStudents,
      classes,
      allAttendanceRecords,
      allGradeRecords,
      subjects,
    ] = await Promise.all([
      getAllDocuments<Siswa>("users", [["role", "==", "siswa"]]),
      getAllDocuments<ClassData>("classes"),
      getAllDocuments<AttendanceRecord>("attendance", [
        ["academicYearId", "==", activeYear.id!],
      ]),
      getAllDocuments<GradeRecord>("grades", [
        ["academicYearId", "==", activeYear.id!],
      ]),
      getAllDocuments<SubjectData>("subjects"),
    ]);

    const classMap = classes.reduce(
      (map, c) => ({ ...map, [c.id]: c.name }),
      {} as Record<string, string>
    );
    const finalGradesByStudent = processGrades(allGradeRecords, subjects);

    const recapMap = allStudents.reduce((map, student) => {
      map[student.uid] = {
        uid: student.uid,
        name: student.nama,
        nis: student.nis,
        className: classMap[student.kelasId] || "Kelas Unknown",
        total: 0,
        ...INITIAL_STATUS,
        grades: finalGradesByStudent[student.uid] || {},
      };
      return map;
    }, {} as Record<string, StudentRecap>);

    allAttendanceRecords.forEach((record) => {
      record.records.forEach((studentRecord) => {
        const studentRecap = recapMap[studentRecord.studentId];
        if (studentRecap) {
          const status = studentRecord.status;
          studentRecap[status as keyof typeof INITIAL_STATUS]++;
          studentRecap.total++;
        }
      });
    });

    const finalRecapList = Object.values(recapMap).sort(
      (a, b) =>
        a.className.localeCompare(b.className) || a.name.localeCompare(b.name)
    );

    return (
      <div className="p-2">
        <h1 className="text-3xl font-bold mb-6 text-zinc-100">
          Rekapitulasi Global
        </h1>

        {/* --- Tab Absensi --- */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center text-zinc-300">
            <Users className="w-5 h-5 mr-2 text-orange-500" /> 1. Rekap Absensi
          </h2>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-950/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    Siswa / Kelas
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-zinc-400 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-green-500 uppercase">
                    Hadir
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-red-500 uppercase font-extrabold">
                    Alpha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {finalRecapList.map((rec) => (
                  <tr key={rec.uid} className="hover:bg-zinc-800/30">
                    <td className="px-6 py-4 text-sm font-medium text-zinc-200">
                      {rec.name} <br />{" "}
                      <span className="text-xs text-zinc-500">
                        {rec.className}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-zinc-400 font-semibold">
                      {rec.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-green-500">
                      {rec.Hadir}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-extrabold text-red-500">
                      {rec.Alpha}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Tab Nilai --- */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center text-zinc-300">
            <Award className="w-5 h-5 mr-2 text-orange-500" /> 2. Rekap Nilai
            Akhir
          </h2>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-950/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase sticky left-0 bg-zinc-900 z-10">
                    Siswa
                  </th>
                  {subjects.map((s) => (
                    <th
                      key={s.id}
                      className="px-6 py-4 text-center text-xs font-medium text-zinc-400 uppercase"
                    >
                      {s.code}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {finalRecapList.map((rec) => (
                  <tr key={rec.uid} className="hover:bg-zinc-800/30">
                    <td className="px-6 py-4 text-sm font-medium text-zinc-200 sticky left-0 bg-zinc-900 z-10 border-r border-zinc-800">
                      {rec.name}
                    </td>
                    {subjects.map((s) => {
                      const grade = rec.grades[s.id];
                      return (
                        <td
                          key={s.id}
                          className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-zinc-300"
                        >
                          {grade ? grade.finalGrade : "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return <div className="p-4 text-red-500">Error memuat data.</div>;
  }
}
