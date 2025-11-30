import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { Siswa, User, Guru } from "@/types/user";
import {
  GradeRecord,
  SubjectData,
  ClassData,
  AssessmentType,
  GradeSettings,
} from "@/types/master";
import { getAllDocuments, getActiveAcademicYear } from "@/lib/firestore";
import { notFound } from "next/navigation";
import PrintTrigger from "@/components/PrintTrigger";
import Link from "next/link"; 
import { ArrowLeft } from "lucide-react";

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

export default async function StudentGradePrintPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return redirect("/login");
  const verifiedUser = await verifyCookie(token);
  if (!verifiedUser) return redirect("/api/auth/logout");
  const user: User | null = await mapUserRole(verifiedUser);
  if (!user || user.role !== "siswa") return notFound();
  const studentUser = user as Siswa;

  const activeYear = await getActiveAcademicYear();
  if (!activeYear) return <div>Data tidak tersedia</div>;

  const [gradeRecords, subjects, classes, gradeSettingsList, teachers] =
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
      getAllDocuments<Guru>("users", [["role", "==", "guru"]]),
    ]);

  const currentGradeSettings =
    gradeSettingsList.length > 0 ? gradeSettingsList[0] : null;
  const studentClass = classes.find((c) => c.id === studentUser.kelasId);
  const studentClassName = studentClass?.name || "N/A";
  const waliKelas =
    teachers.find((t) => t.uid === studentClass?.waliKelasId)?.nama ||
    "..........................";
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
    <div className="bg-white text-black min-h-screen p-8 font-serif relative">
      <PrintTrigger />

      <div className="print:hidden mb-8">
        <Link
          href="/student/grades"
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
            <p className="text-sm">
              Telp: (021) 1234567 | Email: info@simakcihuy.sch.id
            </p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold">LAPORAN HASIL BELAJAR</h2>
          <p className="text-sm">
            Semester {activeYear.name.includes("Ganjil") ? "Ganjil" : "Genap"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-6 text-sm">
        <table>
          <tbody>
            <tr>
              <td className="w-32 py-1 font-bold">Nama Siswa</td>
              <td>: {studentUser.nama}</td>
            </tr>
            <tr>
              <td className="py-1 font-bold">NIS / NISN</td>
              <td>: {studentUser.nis}</td>
            </tr>
            <tr>
              <td className="py-1 font-bold">Kelas</td>
              <td>: {studentClassName}</td>
            </tr>
          </tbody>
        </table>
        <table>
          <tbody>
            <tr>
              <td className="w-32 py-1 font-bold">Tahun Ajaran</td>
              <td>: {activeYear.name}</td>
            </tr>
            <tr>
              <td className="py-1 font-bold">Semester</td>
              <td>
                : {activeYear.name.includes("Ganjil") ? "1 (Satu)" : "2 (Dua)"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <table className="w-full border-collapse border border-black mb-8 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black p-2 w-10">No</th>
            <th className="border border-black p-2 text-left">
              Mata Pelajaran
            </th>
            <th className="border border-black p-2 w-24">Nilai Akhir</th>
            <th className="border border-black p-2 w-24">Predikat</th>
            <th className="border border-black p-2">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {subjectsInReport.map((sub, index) => (
            <tr key={sub.subjectName}>
              <td className="border border-black p-2 text-center">
                {index + 1}
              </td>
              <td className="border border-black p-2">{sub.subjectName}</td>
              <td className="border border-black p-2 text-center font-bold">
                {sub.finalGrade}
              </td>
              <td className="border border-black p-2 text-center">
                {sub.gradeLetter}
              </td>
              <td className="border border-black p-2 italic text-gray-600">
                {sub.gradeLetter === "A"
                  ? "Sangat Baik"
                  : sub.gradeLetter === "B"
                  ? "Baik"
                  : sub.gradeLetter === "C"
                  ? "Cukup"
                  : "Perlu Bimbingan"}
              </td>
            </tr>
          ))}
          {subjectsInReport.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="border border-black p-8 text-center italic"
              >
                Belum ada data nilai.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="grid grid-cols-3 gap-4 mt-12 text-center text-sm break-inside-avoid">
        <div>
          <p className="mb-16">
            Mengetahui,
            <br />
            Orang Tua/Wali
          </p>
          <p className="border-t border-black mx-8 pt-1">
            ( .................................... )
          </p>
        </div>
        <div></div>
        <div>
          <p className="mb-16">
            Kota Pelajar,{" "}
            {new Date().toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            <br />
            Wali Kelas
          </p>
          <p className="border-t border-black mx-8 pt-1 font-bold underline">
            {waliKelas}
          </p>
        </div>
      </div>
    </div>
  );
}
