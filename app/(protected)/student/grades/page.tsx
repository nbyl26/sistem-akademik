import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { Siswa, User } from "@/types/user";
import {
  GradeRecord,
  SubjectData,
  ClassData,
  AssessmentType,
  GradeSettings,
  AttendanceRecord,
} from "@/types/master";
import { getAllDocuments, getActiveAcademicYear } from "@/lib/firestore";
import { notFound } from "next/navigation";
import { Award, BookOpen } from "lucide-react";

interface SubjectScore {
  subjectName: string;
  totalAssignments: number;
  averageScore: number;
  details: Record<AssessmentType, number[]>;
  finalGrade: number;
}

const calculateReportCard = (
  gradeRecords: GradeRecord[],
  studentId: string,
  subjects: SubjectData[],
  gradeSettings: GradeSettings | null,
  attendanceRecords: AttendanceRecord[]
): Record<string, SubjectScore> => {
  const report: Record<string, SubjectScore> = {};
  
  // Use settings from admin or default values
  const tugasWeight = gradeSettings?.tugasPercentage ?? 50;
  const utsWeight = gradeSettings?.utsPercentage ?? 25;
  const uasWeight = gradeSettings?.uasPercentage ?? 25;
  const absenceWeight = gradeSettings?.absencePercentage ?? 0;
  
  gradeRecords.forEach((record) => {
    const subjectId = record.subjectId;
    const subjectName =
      subjects.find((s) => s.id === subjectId)?.name || "Mapel Tidak Ditemukan";
    const score = record.scores[studentId];
    if (score === null || score === undefined) return;

    if (!report[subjectId]) {
      report[subjectId] = {
        subjectName,
        totalAssignments: 0,
        averageScore: 0,
        details: { "Tugas Harian": [], UTS: [], UAS: [], Lainnya: [] },
        finalGrade: 0,
      };
    }
    report[subjectId].details[record.assessmentType as AssessmentType].push(
      score
    );
    report[subjectId].totalAssignments++;
  });

  Object.keys(report).forEach((subjectId) => {
    const entry = report[subjectId];
    const avgTugas =
      entry.details["Tugas Harian"].length > 0
        ? entry.details["Tugas Harian"].reduce((a, b) => a + b) /
          entry.details["Tugas Harian"].length
        : 0;
    const avgUTS =
      entry.details["UTS"].length > 0
        ? entry.details["UTS"].reduce((a, b) => a + b) /
          entry.details["UTS"].length
        : 0;
    const avgUAS =
      entry.details["UAS"].length > 0
        ? entry.details["UAS"].reduce((a, b) => a + b) /
          entry.details["UAS"].length
        : 0;
    
    // Calculate absence score for this subject
    let absenceScore = 100; // Default perfect attendance
    if (absenceWeight > 0) {
      const subjectAttendance = attendanceRecords.filter(
        (a) => a.subjectId === subjectId
      );
      if (subjectAttendance.length > 0) {
        let totalRecords = 0;
        let presentDays = 0;
        subjectAttendance.forEach((record) => {
          const studentRecord = record.records.find((r) => r.studentId === studentId);
          if (studentRecord) {
            totalRecords++;
            if (studentRecord.status === "Hadir") {
              presentDays++;
            }
          }
        });
        if (totalRecords > 0) {
          absenceScore = (presentDays / totalRecords) * 100;
        }
      }
    }
    
    // Calculate using admin settings percentages
    entry.finalGrade = parseFloat(
      (
        avgTugas * (tugasWeight / 100) +
        avgUTS * (utsWeight / 100) +
        avgUAS * (uasWeight / 100) +
        absenceScore * (absenceWeight / 100)
      ).toFixed(2)
    );
  });
  return report;
};

export default async function StudentGradesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return redirect("/login");
  const verifiedUser = await verifyCookie(token);
  if (!verifiedUser) return redirect("/api/auth/logout");
  const user: User | null = await mapUserRole(verifiedUser);
  if (!user || user.role !== "siswa") return notFound();
  const studentUser = user as Siswa;

  try {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear)
      return (
        <div className="p-8 text-center text-red-500">Sistem Belum Aktif.</div>
      );

    const [gradeRecords, subjects, classes, gradeSettingsData, attendanceRecords] = await Promise.all([
      getAllDocuments<GradeRecord>("grades", [
        ["classId", "==", studentUser.kelasId],
        ["academicYearId", "==", activeYear.id!],
      ]),
      getAllDocuments<SubjectData>("subjects"),
      getAllDocuments<ClassData>("classes"),
      getAllDocuments<GradeSettings>("grade_settings", [
        ["academicYearId", "==", activeYear.id!],
      ]),
      getAllDocuments<AttendanceRecord>("attendance", [
        ["classId", "==", studentUser.kelasId],
        ["academicYearId", "==", activeYear.id!],
      ]),
    ]);

    const gradeSettings = gradeSettingsData.length > 0 ? gradeSettingsData[0] : null;
    const studentClassName =
      classes.find((c) => c.id === studentUser.kelasId)?.name || "N/A";
    const studentGradeRecords = gradeRecords.filter(
      (record) => record.scores && record.scores[studentUser.uid] !== undefined
    );
    const reportCard = calculateReportCard(
      studentGradeRecords,
      studentUser.uid,
      subjects,
      gradeSettings,
      attendanceRecords
    );
    const subjectsInReport = Object.values(reportCard);

    return (
      <div className="p-2">
        <h1 className="text-3xl font-bold mb-2 text-zinc-100">
          Kartu Hasil Studi
        </h1>
        <p className="text-sm text-zinc-400 mb-6">
          Siswa:{" "}
          <span className="font-bold text-orange-500">{studentUser.nama}</span>{" "}
          | Kelas: {studentClassName}
        </p>

        {subjectsInReport.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900">
            <Award className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
            <p>Belum ada nilai rapor.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg overflow-hidden">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-950/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    Mata Pelajaran
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-zinc-400 uppercase">
                    Rata-Rata Tugas
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-zinc-400 uppercase">
                    UTS
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-zinc-400 uppercase">
                    UAS
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-orange-500 uppercase">
                    Nilai Akhir
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {subjectsInReport.map((sub) => (
                  <tr
                    key={sub.subjectName}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-200 flex items-center">
                      <BookOpen className="w-4 h-4 mr-2 text-blue-500" />{" "}
                      {sub.subjectName}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-zinc-400">
                      {sub.details["Tugas Harian"].length > 0
                        ? parseFloat(
                            (
                              sub.details["Tugas Harian"].reduce(
                                (a, b) => a + b
                              ) / sub.details["Tugas Harian"].length
                            ).toFixed(2)
                          )
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-zinc-400">
                      {sub.details["UTS"].length > 0
                        ? sub.details["UTS"][0]
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-zinc-400">
                      {sub.details["UAS"].length > 0
                        ? sub.details["UAS"][0]
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-center text-base font-bold text-orange-500">
                      {sub.finalGrade.toFixed(0)}
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
    return <div className="p-4 text-red-500">Error memuat nilai.</div>;
  }
}
