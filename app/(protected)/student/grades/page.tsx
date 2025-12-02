import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
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
import { Award, BookOpen, AlertCircle, Printer, Info } from "lucide-react";

interface SubjectScore {
  subjectName: string;
  totalAssignments: number;
  details: Record<AssessmentType, number[]>;
  finalGrade: number;
  gradeLetter: string;
  attendancePercentage: number;
}

const getGradeLetter = (score: number): string => {
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "E";
};

const getGradeDescription = (letter: string): string => {
  switch (letter) {
    case "A":
      return "Sangat Baik";
    case "B":
      return "Baik";
    case "C":
      return "Cukup";
    case "D":
      return "Kurang";
    case "E":
      return "Sangat Kurang";
    default:
      return "-";
  }
};

const calculateReportCard = (
  gradeRecords: GradeRecord[],
  studentId: string,
  subjects: SubjectData[],
  settings: GradeSettings | null,
  attendanceRecords: AttendanceRecord[]
): Record<string, SubjectScore> => {
  const report: Record<string, SubjectScore> = {};

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
        details: { "Tugas Harian": [], UTS: [], UAS: [], Lainnya: [] },
        finalGrade: 0,
        gradeLetter: "E",
        attendancePercentage: 0,
      };
    }
    report[subjectId].details[record.assessmentType as AssessmentType].push(
      score
    );
    report[subjectId].totalAssignments++;
  });

  attendanceRecords.forEach((record) => {
    const subjectId = record.subjectId;
    if (!report[subjectId]) return;

    const studentRecord = record.records.find((r) => r.studentId === studentId);
    if (studentRecord) {
      const currentAttendance = report[subjectId].attendancePercentage || 0;
      const isPresent = studentRecord.status === "Hadir" ? 1 : 0;
      report[subjectId].attendancePercentage = currentAttendance + isPresent;
    }
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
    const avgLain =
      entry.details["Lainnya"].length > 0
        ? entry.details["Lainnya"].reduce((a, b) => a + b) /
          entry.details["Lainnya"].length
        : 0;

    const subjectAttendanceRecords = attendanceRecords.filter(
      (r) => r.subjectId === subjectId
    );
    const totalMeetings = subjectAttendanceRecords.length;
    const attendanceScore =
      totalMeetings > 0
        ? (entry.attendancePercentage / totalMeetings) * 100
        : 0;

    let finalScore = 0;

    if (settings) {
      finalScore += avgTugas * (settings.tugasPercentage / 100);
      finalScore += avgUTS * (settings.utsPercentage / 100);
      finalScore += avgUAS * (settings.uasPercentage / 100);
      finalScore += avgLain * ((settings.lainnyaPercentage || 0) / 100);
      finalScore += attendanceScore * ((settings.absencePercentage || 0) / 100);
    } else {
      finalScore = avgTugas * 0.4 + avgUTS * 0.3 + avgUAS * 0.3;
    }

    entry.finalGrade = parseFloat(finalScore.toFixed(1));
    entry.gradeLetter = getGradeLetter(entry.finalGrade);
    entry.attendancePercentage = parseFloat(attendanceScore.toFixed(1));
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
    if (!activeYear) {
      return (
        <div className="p-8 text-center text-red-500 bg-red-900/10 rounded-xl border border-red-900/20">
          Sistem Belum Aktif.
        </div>
      );
    }

    const [
      gradeRecords,
      subjects,
      classes,
      gradeSettingsList,
      attendanceRecords,
    ] = await Promise.all([
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

    const currentGradeSettings =
      gradeSettingsList.length > 0 ? gradeSettingsList[0] : null;
    const studentClassName =
      classes.find((c) => c.id === studentUser.kelasId)?.name || "N/A";

    const studentGradeRecords = gradeRecords.filter(
      (record) => record.scores && record.scores[studentUser.uid] !== undefined
    );

    const reportCard = calculateReportCard(
      studentGradeRecords,
      studentUser.uid,
      subjects,
      currentGradeSettings,
      attendanceRecords
    );
    const subjectsInReport = Object.values(reportCard).sort((a, b) =>
      a.subjectName.localeCompare(b.subjectName)
    );

    const totalSubjects = subjectsInReport.length;
    const averageGrade =
      totalSubjects > 0
        ? subjectsInReport.reduce((sum, sub) => sum + sub.finalGrade, 0) /
          totalSubjects
        : 0;
    const highestGrade =
      totalSubjects > 0
        ? Math.max(...subjectsInReport.map((s) => s.finalGrade))
        : 0;
    const lowestGrade =
      totalSubjects > 0
        ? Math.min(...subjectsInReport.map((s) => s.finalGrade))
        : 0;

    return (
      <div className="p-2">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-zinc-100">
              Kartu Hasil Studi
            </h1>
            <div className="text-sm text-zinc-400 space-y-1">
              <p>
                Siswa:{" "}
                <span className="font-bold text-orange-500">
                  {studentUser.nama}
                </span>{" "}
                | NIS: <span className="text-zinc-300">{studentUser.nis}</span>
              </p>
              <p>
                Kelas:{" "}
                <span className="font-bold text-zinc-200">
                  {studentClassName}
                </span>{" "}
                | Tahun Ajaran:{" "}
                <span className="text-zinc-200">{activeYear.name}</span>
              </p>
            </div>
          </div>

          <Link
            href="/cetak/rapor"
            target="_blank"
            className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center hover:bg-orange-500 transition-all shadow-lg shadow-orange-900/30 active:scale-95 shrink-0"
          >
            <Printer className="w-5 h-5 mr-2" />
            Cetak Rapor
          </Link>
        </div>

        {currentGradeSettings ? (
          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-800/50 rounded-xl flex items-start animate-in fade-in slide-in-from-top-2">
            <Info className="w-5 h-5 mr-3 mt-0.5 text-blue-400 flex-shrink-0" />
            <div className="text-sm text-blue-300">
              <p className="font-semibold mb-2">Komponen Penilaian:</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                <div className="bg-blue-950/30 px-2 py-1 rounded">
                  Tugas:{" "}
                  <span className="font-bold">
                    {currentGradeSettings.tugasPercentage}%
                  </span>
                </div>
                <div className="bg-blue-950/30 px-2 py-1 rounded">
                  UTS:{" "}
                  <span className="font-bold">
                    {currentGradeSettings.utsPercentage}%
                  </span>
                </div>
                <div className="bg-blue-950/30 px-2 py-1 rounded">
                  UAS:{" "}
                  <span className="font-bold">
                    {currentGradeSettings.uasPercentage}%
                  </span>
                </div>
                <div className="bg-blue-950/30 px-2 py-1 rounded">
                  Lainnya:{" "}
                  <span className="font-bold">
                    {currentGradeSettings.lainnyaPercentage || 0}%
                  </span>
                </div>
                <div className="bg-blue-950/30 px-2 py-1 rounded">
                  Absensi:{" "}
                  <span className="font-bold">
                    {currentGradeSettings.absencePercentage || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-xl flex items-center text-yellow-500 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <span>
              Bobot nilai belum diatur oleh Admin. Menggunakan perhitungan
              standar: Tugas 40%, UTS 30%, UAS 30%.
            </span>
          </div>
        )}

        {totalSubjects > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 p-4 rounded-xl border border-blue-800/50">
              <p className="text-xs text-blue-400 mb-1">Total Mata Pelajaran</p>
              <p className="text-2xl font-bold text-blue-200">
                {totalSubjects}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-900/30 to-orange-950/30 p-4 rounded-xl border border-orange-800/50">
              <p className="text-xs text-orange-400 mb-1">Rata-rata Nilai</p>
              <p className="text-2xl font-bold text-orange-200">
                {averageGrade.toFixed(1)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-900/30 to-green-950/30 p-4 rounded-xl border border-green-800/50">
              <p className="text-xs text-green-400 mb-1">Nilai Tertinggi</p>
              <p className="text-2xl font-bold text-green-200">
                {highestGrade.toFixed(1)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-900/30 to-red-950/30 p-4 rounded-xl border border-red-800/50">
              <p className="text-xs text-red-400 mb-1">Nilai Terendah</p>
              <p className="text-2xl font-bold text-red-200">
                {lowestGrade.toFixed(1)}
              </p>
            </div>
          </div>
        )}

        {subjectsInReport.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900">
            <Award className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
            <p className="text-lg font-medium mb-2">Belum Ada Nilai</p>
            <p className="text-sm text-zinc-600">
              Nilai akan muncul setelah guru memasukkan penilaian.
            </p>
          </div>
        ) : (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-800">
                <thead className="bg-zinc-950/50">
                  <tr>
                    <th className="px-4 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider sticky left-0 bg-zinc-950 z-10">
                      No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider sticky left-12 bg-zinc-950 z-10">
                      Mata Pelajaran
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Tugas
                      {currentGradeSettings && (
                        <span className="block text-orange-500 font-bold">
                          {currentGradeSettings.tugasPercentage}%
                        </span>
                      )}
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      UTS
                      {currentGradeSettings && (
                        <span className="block text-orange-500 font-bold">
                          {currentGradeSettings.utsPercentage}%
                        </span>
                      )}
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      UAS
                      {currentGradeSettings && (
                        <span className="block text-orange-500 font-bold">
                          {currentGradeSettings.uasPercentage}%
                        </span>
                      )}
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Lainnya
                      {currentGradeSettings && (
                        <span className="block text-orange-500 font-bold">
                          {currentGradeSettings.lainnyaPercentage || 0}%
                        </span>
                      )}
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Absensi
                      {currentGradeSettings && (
                        <span className="block text-orange-500 font-bold">
                          {currentGradeSettings.absencePercentage || 0}%
                        </span>
                      )}
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-orange-400 uppercase tracking-wider font-bold">
                      Nilai Akhir
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                      Predikat
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {subjectsInReport.map((sub, index) => (
                    <tr
                      key={sub.subjectName}
                      className="hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-4 py-4 text-sm text-zinc-500 font-medium sticky left-0 bg-zinc-900 z-10">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-zinc-200 sticky left-12 bg-zinc-900 z-10 border-r border-zinc-800">
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                          <span className="line-clamp-2">
                            {sub.subjectName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-zinc-300">
                        <div className="font-medium">
                          {sub.details["Tugas Harian"].length > 0
                            ? parseFloat(
                                (
                                  sub.details["Tugas Harian"].reduce(
                                    (a, b) => a + b
                                  ) / sub.details["Tugas Harian"].length
                                ).toFixed(1)
                              )
                            : "-"}
                        </div>
                        <div className="text-xs text-zinc-600">
                          {sub.details["Tugas Harian"].length} tugas
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-sm font-medium text-zinc-300">
                        {sub.details["UTS"].length > 0
                          ? sub.details["UTS"][0]
                          : "-"}
                      </td>
                      <td className="px-4 py-4 text-center text-sm font-medium text-zinc-300">
                        {sub.details["UAS"].length > 0
                          ? sub.details["UAS"][0]
                          : "-"}
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-zinc-300">
                        <div className="font-medium">
                          {sub.details["Lainnya"].length > 0
                            ? parseFloat(
                                (
                                  sub.details["Lainnya"].reduce(
                                    (a, b) => a + b
                                  ) / sub.details["Lainnya"].length
                                ).toFixed(1)
                              )
                            : "-"}
                        </div>
                        <div className="text-xs text-zinc-600">
                          {sub.details["Lainnya"].length} penilaian
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-sm font-medium text-zinc-300">
                        <div className="flex flex-col items-center">
                          <span>{sub.attendancePercentage.toFixed(0)}%</span>
                          <span
                            className={`text-xs ${
                              sub.attendancePercentage >= 75
                                ? "text-green-500"
                                : sub.attendancePercentage >= 50
                                ? "text-yellow-500"
                                : "text-red-500"
                            }`}
                          >
                            {sub.attendancePercentage >= 75
                              ? "Baik"
                              : sub.attendancePercentage >= 50
                              ? "Cukup"
                              : "Kurang"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-xl font-bold text-orange-500">
                          {sub.finalGrade.toFixed(0)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`px-3 py-1 rounded-lg text-sm font-bold border ${
                              sub.gradeLetter === "A"
                                ? "bg-green-900/30 text-green-400 border-green-800"
                                : sub.gradeLetter === "B"
                                ? "bg-blue-900/30 text-blue-400 border-blue-800"
                                : sub.gradeLetter === "C"
                                ? "bg-yellow-900/30 text-yellow-400 border-yellow-800"
                                : sub.gradeLetter === "D"
                                ? "bg-orange-900/30 text-orange-400 border-orange-800"
                                : "bg-red-900/30 text-red-400 border-red-800"
                            }`}
                          >
                            {sub.gradeLetter}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {getGradeDescription(sub.gradeLetter)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {subjectsInReport.length > 0 && (
          <div className="mt-6 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <p className="text-xs font-semibold text-zinc-400 mb-3">
              Keterangan Predikat:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-green-900/30 text-green-400 border border-green-800 rounded font-bold">
                  A
                </span>
                <span className="text-zinc-400">85-100 (Sangat Baik)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-900/30 text-blue-400 border border-blue-800 rounded font-bold">
                  B
                </span>
                <span className="text-zinc-400">75-84 (Baik)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 border border-yellow-800 rounded font-bold">
                  C
                </span>
                <span className="text-zinc-400">60-74 (Cukup)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-orange-900/30 text-orange-400 border border-orange-800 rounded font-bold">
                  D
                </span>
                <span className="text-zinc-400">50-59 (Kurang)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-red-900/30 text-red-400 border border-red-800 rounded font-bold">
                  E
                </span>
                <span className="text-zinc-400">&lt;50 (Sangat Kurang)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Gagal memuat Nilai Siswa:", error);
    return (
      <div className="p-4 text-red-500">
        Terjadi kesalahan saat memproses data nilai.
      </div>
    );
  }
}
