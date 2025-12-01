import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { Siswa, User } from "@/types/user";
import {
  AttendanceRecord,
  ClassData,
  AcademicYear,
  GradeRecord,
  SubjectData,
  GradeSettings, 
} from "@/types/master";
import { getAllDocuments, getActiveAcademicYear } from "@/lib/firestore";
import { notFound } from "next/navigation";
import {
  Users,
  Award,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

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

const calculateFinalScore = (
  scores: { type: string; value: number }[],
  settings: GradeSettings | null
): number => {
  if (!settings) {
    const total = scores.reduce((a, b) => a + b.value, 0);
    return scores.length > 0 ? total / scores.length : 0;
  }

  let totalScore = 0;

  const tugasScores = scores
    .filter((s) => s.type === "Tugas Harian")
    .map((s) => s.value);
  const utsScores = scores.filter((s) => s.type === "UTS").map((s) => s.value);
  const uasScores = scores.filter((s) => s.type === "UAS").map((s) => s.value);
  const lainScores = scores
    .filter((s) => s.type === "Lainnya")
    .map((s) => s.value);

  const avgTugas =
    tugasScores.length > 0
      ? tugasScores.reduce((a, b) => a + b, 0) / tugasScores.length
      : 0;
  const avgUTS =
    utsScores.length > 0
      ? utsScores.reduce((a, b) => a + b, 0) / utsScores.length
      : 0;
  const avgUAS =
    uasScores.length > 0
      ? uasScores.reduce((a, b) => a + b, 0) / uasScores.length
      : 0;
  const avgLain =
    lainScores.length > 0
      ? lainScores.reduce((a, b) => a + b, 0) / lainScores.length
      : 0;

  totalScore += avgTugas * (settings.tugasPercentage / 100);
  totalScore += avgUTS * (settings.utsPercentage / 100);
  totalScore += avgUAS * (settings.uasPercentage / 100);
  totalScore += avgLain * ((settings.lainnyaPercentage || 0) / 100);

  return parseFloat(totalScore.toFixed(1));
};

const processGrades = (
  gradeRecords: GradeRecord[],
  subjects: SubjectData[],
  settings: GradeSettings | null
): Record<
  string,
  Record<string, { finalGrade: number; subjectName: string }>
> => {
  const rawScores: Record<
    string,
    Record<string, { type: string; value: number }[]>
  > = {};

  gradeRecords.forEach((record) => {
    const subjectId = record.subjectId;
    const type = record.assessmentType;

    Object.keys(record.scores).forEach((studentId) => {
      const score = record.scores[studentId];
      if (score === null || score === undefined) return;

      if (!rawScores[studentId]) rawScores[studentId] = {};
      if (!rawScores[studentId][subjectId])
        rawScores[studentId][subjectId] = [];

      rawScores[studentId][subjectId].push({ type, value: score });
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

  Object.keys(rawScores).forEach((studentId) => {
    finalReport[studentId] = {};
    Object.keys(rawScores[studentId]).forEach((subjectId) => {
      const scores = rawScores[studentId][subjectId];
      const finalGrade = calculateFinalScore(scores, settings);

      finalReport[studentId][subjectId] = {
        subjectName: subjectMap[subjectId] || "Mapel Unknown",
        finalGrade,
      };
    });
  });

  return finalReport;
};

export default async function AdminRecapPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return redirect("/login");

  const verifiedUser = await verifyCookie(token);
  if (!verifiedUser) return redirect("/api/auth/logout");

  const user: User | null = await mapUserRole(verifiedUser);
  if (!user || user.role !== "admin") return notFound();

  try {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear) {
      return (
        <div className="p-8 text-center text-red-500 bg-red-900/10 rounded-xl border border-red-900/20">
          Sistem Akademik belum aktif.
        </div>
      );
    }

    const [
      allStudents,
      classes,
      allAttendanceRecords,
      allGradeRecords,
      subjects,
      gradeSettingsList,
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
      getAllDocuments<GradeSettings>("grade_settings", [
        ["academicYearId", "==", activeYear.id!],
      ]),
    ]);

    const currentGradeSettings =
      gradeSettingsList.length > 0 ? gradeSettingsList[0] : null;

    const classMap = classes.reduce(
      (map, c) => ({ ...map, [c.id]: c.name }),
      {} as Record<string, string>
    );

    const finalGradesByStudent = processGrades(
      allGradeRecords,
      subjects,
      currentGradeSettings
    );

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
      <div className="p-2 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">
            Rekapitulasi Global
          </h1>
          <p className="text-zinc-400 mt-1">
            Tahun Ajaran:{" "}
            <span className="text-orange-500 font-semibold">
              {activeYear.name}
            </span>
          </p>

          {!currentGradeSettings && (
            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg flex items-center text-yellow-500 text-sm">
              <AlertTriangle className="w-5 h-5 mr-3" />
              Warning: Pengaturan Persentase Nilai belum dibuat untuk tahun
              ajaran ini. Nilai dihitung menggunakan rata-rata standar.
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center text-zinc-300">
            <Users className="w-5 h-5 mr-2 text-orange-500" /> 1. Rekap Absensi
          </h2>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-950/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase sticky left-0 bg-zinc-950 z-10">
                    Siswa / Kelas
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-zinc-400 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-green-500 uppercase">
                    Hadir
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-yellow-500 uppercase">
                    Sakit
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-blue-500 uppercase">
                    Izin
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-red-500 uppercase font-extrabold">
                    Alpha
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {finalRecapList.map((rec) => (
                  <tr
                    key={rec.uid}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-zinc-200 sticky left-0 bg-zinc-900 z-10 border-r border-zinc-800">
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
                    <td className="px-6 py-4 whitespace-nowrap text-center text-yellow-500">
                      {rec.Sakit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-blue-500">
                      {rec.Izin}
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

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center text-zinc-300">
              <Award className="w-5 h-5 mr-2 text-orange-500" /> 2. Rekap Nilai
              Akhir
            </h2>
            {currentGradeSettings && (
              <span className="text-xs text-zinc-500 bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">
                Bobot: Tugas {currentGradeSettings.tugasPercentage}% | UTS{" "}
                {currentGradeSettings.utsPercentage}% | UAS{" "}
                {currentGradeSettings.uasPercentage}%
              </span>
            )}
          </div>

          <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-950/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase sticky left-0 bg-zinc-950 z-10">
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
                  <tr
                    key={rec.uid}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-zinc-200 sticky left-0 bg-zinc-900 z-10 border-r border-zinc-800">
                      {rec.name} <br />{" "}
                      <span className="text-xs text-zinc-500">
                        {rec.className}
                      </span>
                    </td>
                    {subjects.map((s) => {
                      const grade = rec.grades[s.id];
                      return (
                        <td
                          key={s.id}
                          className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-zinc-300"
                        >
                          {grade ? (
                            <span
                              className={
                                grade.finalGrade < 75
                                  ? "text-red-400"
                                  : "text-green-400"
                              }
                            >
                              {grade.finalGrade}
                            </span>
                          ) : (
                            "-"
                          )}
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
    console.error(error);
    return <div className="p-4 text-red-500">Error memuat data rekap.</div>;
  }
}
