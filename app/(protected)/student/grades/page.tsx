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
} from "@/types/master";
import { getAllDocuments, getActiveAcademicYear } from "@/lib/firestore";
import { notFound } from "next/navigation";
import { Award, BookOpen, AlertCircle, Printer } from "lucide-react";

interface SubjectScore {
  subjectName: string;
  totalAssignments: number;
  averageScore: number;
  details: Record<AssessmentType, number[]>;
  finalGrade: number;
  gradeLetter: string;
}

const getGradeLetter = (score: number): string => {
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "E";
};

const calculateReportCard = (
  gradeRecords: GradeRecord[],
  studentId: string,
  subjects: SubjectData[],
  settings: GradeSettings | null
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
        averageScore: 0,
        details: { "Tugas Harian": [], UTS: [], UAS: [], Lainnya: [] },
        finalGrade: 0,
        gradeLetter: "E",
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
    const avgLain =
      entry.details["Lainnya"].length > 0
        ? entry.details["Lainnya"].reduce((a, b) => a + b) /
          entry.details["Lainnya"].length
        : 0;

    let finalScore = 0;

    if (settings) {
      finalScore += avgTugas * (settings.tugasPercentage / 100);
      finalScore += avgUTS * (settings.utsPercentage / 100);
      finalScore += avgUAS * (settings.uasPercentage / 100);
      finalScore += avgLain * ((settings.lainnyaPercentage || 0) / 100);
    } else {
      finalScore = avgTugas * 0.5 + avgUTS * 0.25 + avgUAS * 0.25;
    }

    entry.finalGrade = parseFloat(finalScore.toFixed(1));
    entry.gradeLetter = getGradeLetter(entry.finalGrade);
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

    const [gradeRecords, subjects, classes, gradeSettingsList] =
      await Promise.all([
        getAllDocuments<GradeRecord>("grades", [
          ["classId", "==", studentUser.kelasId],
          ["academicYearId", "==", activeYear.id!],
        ]),
        getAllDocuments<SubjectData>("subjects"),
        getAllDocuments<ClassData>("classes"),
        getAllDocuments<GradeSettings>("grade_settings", [
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
      currentGradeSettings
    );
    const subjectsInReport = Object.values(reportCard);

    return (
      <div className="p-2">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-4">
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
                | Kelas: {studentClassName}
              </p>
              <p>
                Tahun Ajaran:{" "}
                <span className="text-zinc-200">{activeYear.name}</span>
              </p>
            </div>
          </div>

          <Link
            href="/cetak/rapor" 
            target="_blank"
            className="bg-zinc-100 text-zinc-900 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center hover:bg-white transition-all shadow-lg shadow-white/5 active:scale-95 shrink-0"
          >
            <Printer className="w-5 h-5 mr-2" />
            Cetak / PDF
          </Link>
        </div>

        {!currentGradeSettings && (
          <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg flex items-center text-yellow-500 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <span>
              Bobot nilai belum diatur oleh Admin. Menggunakan perhitungan
              standar (50/25/25).
            </span>
          </div>
        )}

        {subjectsInReport.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900">
            <Award className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
            <p>Belum ada nilai yang masuk.</p>
          </div>
        ) : (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-950/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                    No.
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase sticky left-0 bg-zinc-950 z-10">
                    Mata Pelajaran
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-zinc-400 uppercase">
                    Tugas{" "}
                    {currentGradeSettings
                      ? `(${currentGradeSettings.tugasPercentage}%)`
                      : ""}
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-zinc-400 uppercase">
                    UTS{" "}
                    {currentGradeSettings
                      ? `(${currentGradeSettings.utsPercentage}%)`
                      : ""}
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-zinc-400 uppercase">
                    UAS{" "}
                    {currentGradeSettings
                      ? `(${currentGradeSettings.uasPercentage}%)`
                      : ""}
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-orange-500 uppercase font-bold">
                    Nilai Akhir
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-zinc-400 uppercase">
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
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-200 flex items-center sticky left-0 bg-zinc-900 z-10 border-r border-zinc-800">
                      <BookOpen className="w-4 h-4 mr-2 text-blue-500" />
                      {sub.subjectName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-zinc-400">
                      {sub.details["Tugas Harian"].length > 0
                        ? parseFloat(
                            (
                              sub.details["Tugas Harian"].reduce(
                                (a, b) => a + b
                              ) / sub.details["Tugas Harian"].length
                            ).toFixed(1)
                          )
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-zinc-400">
                      {sub.details["UTS"].length > 0
                        ? sub.details["UTS"][0]
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-zinc-400">
                      {sub.details["UAS"].length > 0
                        ? sub.details["UAS"][0]
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-base font-bold text-orange-500">
                      {sub.finalGrade.toFixed(0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          sub.gradeLetter === "A"
                            ? "bg-green-900/30 text-green-400 border border-green-800"
                            : sub.gradeLetter === "B"
                            ? "bg-blue-900/30 text-blue-400 border border-blue-800"
                            : sub.gradeLetter === "C"
                            ? "bg-yellow-900/30 text-yellow-400 border border-yellow-800"
                            : "bg-red-900/30 text-red-400 border border-red-800"
                        }`}
                      >
                        {sub.gradeLetter}
                      </span>
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
    console.error("Gagal memuat Nilai Siswa:", error);
    return (
      <div className="p-4 text-red-500">
        Terjadi kesalahan saat memproses data nilai.
      </div>
    );
  }
}
