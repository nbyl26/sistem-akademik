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
import RecapContent from "@/components/RecapContent";

interface StudentRecap {
  uid: string;
  name: string;
  nis: string;
  className: string;
  classId: string;
  total: number;
  Hadir: number;
  Sakit: number;
  Izin: number;
  Alpha: number;
  grades: Record<string, { subjectName: string; finalGrade: number }>;
}

interface ClassRecap {
  classId: string;
  className: string;
  students: StudentRecap[];
}

export interface AcademicYearRecap {
  yearId: string;
  yearName: string;
  classes: ClassRecap[];
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
        classId: student.kelasId,
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

    // Organize data hierarchically: Academic Year → ClassId → Students
    const classesGrouped = new Map<string, StudentRecap[]>();
    Object.values(recapMap).forEach((student) => {
      if (!classesGrouped.has(student.classId)) {
        classesGrouped.set(student.classId, []);
      }
      classesGrouped.get(student.classId)!.push(student);
    });

    // Sort students within each class
    classesGrouped.forEach((students) => {
      students.sort((a, b) => a.name.localeCompare(b.name));
    });

    // Build hierarchical structure
    const academicYearRecap: AcademicYearRecap = {
      yearId: activeYear.id!,
      yearName: activeYear.name,
      classes: Array.from(classesGrouped.entries())
        .map(([classId, students]) => ({
          classId,
          className: classMap[classId] || "Kelas Unknown",
          students,
        }))
        .sort((a, b) => a.className.localeCompare(b.className)),
    };

    const finalRecapList = Object.values(recapMap).sort(
      (a, b) =>
        a.className.localeCompare(b.className) || a.name.localeCompare(b.name)
    );

    return (
      <RecapContent
        activeYear={activeYear}
        academicYearRecap={academicYearRecap}
        subjects={subjects}
        currentGradeSettings={currentGradeSettings}
      />
    );
  } catch (error) {
    console.error(error);
    return <div className="p-4 text-red-500">Error memuat data rekap.</div>;
  }
}
