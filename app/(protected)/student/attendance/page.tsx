import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { Siswa, User } from "@/types/user";
import { AttendanceRecord, ClassData, SubjectData } from "@/types/master";
import { getAllDocuments, getActiveAcademicYear } from "@/lib/firestore";
import { notFound } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Users,
  Book,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Award,
} from "lucide-react";

interface AttendanceSummary {
  totalMeetings: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpha: number;
  bySubject: Record<
    string,
    { subjectName: string; hadiri: number; total: number }
  >;
}

export default async function StudentAttendancePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return redirect("/login");
  const verifiedUser = await verifyCookie(token);
  if (!verifiedUser) {
    return redirect("/api/auth/logout");
  }
  const user: User | null = await mapUserRole(verifiedUser);
  if (!user || user.role !== "siswa") {
    return notFound();
  }
  const studentUser = user as Siswa;

  try {
    const activeYear = await getActiveAcademicYear();
    if (!activeYear)
      return (
        <div className="p-8 text-center text-red-500 bg-red-900/10 rounded-xl border border-red-900/20">
          Sistem Belum Aktif.
        </div>
      );

    const [attendanceRecords, subjects, classes] = await Promise.all([
      getAllDocuments<AttendanceRecord>("attendance", [
        ["classId", "==", studentUser.kelasId],
        ["academicYearId", "==", activeYear.id!],
      ]),
      getAllDocuments<SubjectData>("subjects"),
      getAllDocuments<ClassData>("classes"),
    ]);

    const studentClassName =
      classes.find((c) => c.id === studentUser.kelasId)?.name || "N/A";
    const initialSummary: AttendanceSummary = {
      totalMeetings: 0,
      hadir: 0,
      sakit: 0,
      izin: 0,
      alpha: 0,
      bySubject: {},
    };

    const summary = attendanceRecords.reduce((acc, record) => {
      const studentRecord = record.records.find(
        (r) => r.studentId === studentUser.uid
      );
      if (studentRecord) {
        const status = studentRecord.status;
        const subjectId = record.subjectId;
        const subjectName =
          subjects.find((s) => s.id === subjectId)?.name || "Unknown";
        acc.totalMeetings++;
        acc[status.toLowerCase() as keyof AttendanceSummary]++;
        if (!acc.bySubject[subjectId])
          acc.bySubject[subjectId] = { subjectName, hadiri: 0, total: 0 };
        acc.bySubject[subjectId].total++;
        if (status === "Hadir") acc.bySubject[subjectId].hadiri++;
      }
      return acc;
    }, initialSummary);

    // Calculate statistics
    const attendancePercentage =
      summary.totalMeetings > 0
        ? (summary.hadir / summary.totalMeetings) * 100
        : 0;
    const excusedAbsence = summary.sakit + summary.izin;
    const unexcusedAbsence = summary.alpha;

    // Get attendance status
    const getAttendanceStatus = (percentage: number) => {
      if (percentage >= 90)
        return {
          label: "Sangat Baik",
          color: "text-green-500",
          bg: "bg-green-900/30",
          border: "border-green-800",
        };
      if (percentage >= 75)
        return {
          label: "Baik",
          color: "text-blue-500",
          bg: "bg-blue-900/30",
          border: "border-blue-800",
        };
      if (percentage >= 60)
        return {
          label: "Cukup",
          color: "text-yellow-500",
          bg: "bg-yellow-900/30",
          border: "border-yellow-800",
        };
      return {
        label: "Kurang",
        color: "text-red-500",
        bg: "bg-red-900/30",
        border: "border-red-800",
      };
    };

    const attendanceStatus = getAttendanceStatus(attendancePercentage);

    return (
      <div className="p-2">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-zinc-100">
            Rekap Kehadiran
          </h1>
          <div className="text-sm text-zinc-400">
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

        {summary.totalMeetings === 0 ? (
          <div className="p-12 text-center text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
            <p className="text-lg font-medium mb-2">Belum Ada Data Absensi</p>
            <p className="text-sm text-zinc-600">
              Data kehadiran akan muncul setelah guru mencatat absensi.
            </p>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 p-5 rounded-xl border border-blue-800/50 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-8 h-8 text-blue-400" />
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-xs text-blue-400 mb-1">Total Pertemuan</p>
                <p className="text-3xl font-bold text-blue-200">
                  {summary.totalMeetings}
                </p>
                <p className="text-xs text-blue-500 mt-1">Kali</p>
              </div>

              <div className="bg-gradient-to-br from-green-900/30 to-green-950/30 p-5 rounded-xl border border-green-800/50 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                  <Award className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-xs text-green-400 mb-1">Persentase Hadir</p>
                <p className="text-3xl font-bold text-green-200">
                  {attendancePercentage.toFixed(1)}%
                </p>
                <p
                  className={`text-xs mt-1 font-semibold ${attendanceStatus.color}`}
                >
                  {attendanceStatus.label}
                </p>
              </div>

              <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-950/30 p-5 rounded-xl border border-yellow-800/50 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-yellow-400" />
                </div>
                <p className="text-xs text-yellow-400 mb-1">Izin Resmi</p>
                <p className="text-3xl font-bold text-yellow-200">
                  {excusedAbsence}
                </p>
                <p className="text-xs text-yellow-500 mt-1">
                  Sakit: {summary.sakit} | Izin: {summary.izin}
                </p>
              </div>

              <div className="bg-gradient-to-br from-red-900/30 to-red-950/30 p-5 rounded-xl border border-red-800/50 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <XCircle className="w-8 h-8 text-red-400" />
                  {unexcusedAbsence > 0 && (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <p className="text-xs text-red-400 mb-1">Tanpa Keterangan</p>
                <p className="text-3xl font-bold text-red-200">
                  {summary.alpha}
                </p>
                <p className="text-xs text-red-500 mt-1">Alpa</p>
              </div>
            </div>

            {/* Warning for low attendance */}
            {attendancePercentage < 75 && (
              <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-xl flex items-start animate-in fade-in slide-in-from-top-2">
                <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 text-yellow-400 flex-shrink-0" />
                <div className="text-sm text-yellow-300">
                  <p className="font-semibold mb-1">Peringatan Kehadiran</p>
                  <p>
                    Persentase kehadiran Anda{" "}
                    <span className="font-bold">
                      {attendancePercentage.toFixed(1)}%
                    </span>
                    .
                    {attendancePercentage < 60
                      ? " Tingkatkan kehadiran Anda segera untuk memenuhi persyaratan minimal."
                      : " Usahakan untuk meningkatkan kehadiran agar mencapai minimal 75%."}
                  </p>
                </div>
              </div>
            )}

            {/* Perfect attendance badge */}
            {attendancePercentage === 100 && summary.totalMeetings >= 5 && (
              <div className="mb-6 p-4 bg-green-900/20 border border-green-700/50 rounded-xl flex items-center animate-in fade-in slide-in-from-top-2">
                <Award className="w-6 h-6 mr-3 text-green-400" />
                <div className="text-sm text-green-300">
                  <p className="font-semibold">🎉 Perfect Attendance!</p>
                  <p>
                    Luar biasa! Anda memiliki kehadiran sempurna dengan{" "}
                    <span className="font-bold">{summary.hadir}</span> dari{" "}
                    <span className="font-bold">{summary.totalMeetings}</span>{" "}
                    pertemuan.
                  </p>
                </div>
              </div>
            )}

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Overall Summary Card */}
              <div className="lg:col-span-1">
                <h2 className="text-xl font-bold mb-4 text-zinc-300 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-orange-500" />
                  Ringkasan Kehadiran
                </h2>
                <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg space-y-4">
                  <div
                    className={`p-4 rounded-lg ${attendanceStatus.bg} border ${attendanceStatus.border}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-zinc-400">
                        Status Kehadiran
                      </span>
                      <Award className={`w-5 h-5 ${attendanceStatus.color}`} />
                    </div>
                    <p
                      className={`text-2xl font-bold ${attendanceStatus.color}`}
                    >
                      {attendanceStatus.label}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {attendancePercentage.toFixed(1)}% dari total pertemuan
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center pb-3 border-b border-zinc-800">
                      <span className="text-sm text-zinc-400">
                        Total Pertemuan
                      </span>
                      <span className="font-bold text-zinc-100">
                        {summary.totalMeetings} Kali
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-green-500">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span className="text-sm">Hadir</span>
                      </div>
                      <span className="font-bold text-green-400">
                        {summary.hadir}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-yellow-500">
                        <span className="text-sm">Sakit</span>
                      </div>
                      <span className="font-bold text-yellow-400">
                        {summary.sakit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-blue-500">
                        <span className="text-sm">Izin</span>
                      </div>
                      <span className="font-bold text-blue-400">
                        {summary.izin}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
                      <div className="flex items-center text-red-500">
                        <XCircle className="w-4 h-4 mr-2" />
                        <span className="text-sm font-semibold">
                          Alpha (Alpa)
                        </span>
                      </div>
                      <span className="font-bold text-red-400">
                        {summary.alpha}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Per Subject Detail */}
              <div className="lg:col-span-2">
                <h2 className="text-xl font-bold mb-4 text-zinc-300 flex items-center">
                  <Book className="w-5 h-5 mr-2 text-orange-500" />
                  Detail Per Mata Pelajaran
                </h2>
                <div className="overflow-x-auto bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-zinc-800">
                    <thead className="bg-zinc-950/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                          Mata Pelajaran
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                          Hadir
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                          Persentase
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {Object.values(summary.bySubject)
                        .sort((a, b) =>
                          a.subjectName.localeCompare(b.subjectName)
                        )
                        .map((sub) => {
                          const subjectPercentage =
                            (sub.hadiri / sub.total) * 100;
                          const subjectStatus =
                            getAttendanceStatus(subjectPercentage);
                          return (
                            <tr
                              key={sub.subjectName}
                              className="hover:bg-zinc-800/30 transition-colors"
                            >
                              <td className="px-6 py-4 text-sm font-medium text-zinc-200">
                                <div className="flex items-center">
                                  <Book className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
                                  <span className="line-clamp-2">
                                    {sub.subjectName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center text-sm font-bold text-green-500">
                                {sub.hadiri}
                              </td>
                              <td className="px-6 py-4 text-center text-sm text-zinc-400">
                                {sub.total}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex flex-col items-center">
                                  <span className="text-lg font-bold text-orange-500">
                                    {subjectPercentage.toFixed(0)}%
                                  </span>
                                  <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-1 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        subjectPercentage >= 90
                                          ? "bg-green-500"
                                          : subjectPercentage >= 75
                                          ? "bg-blue-500"
                                          : subjectPercentage >= 60
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                      }`}
                                      style={{ width: `${subjectPercentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span
                                  className={`px-3 py-1 rounded-lg text-xs font-bold border ${subjectStatus.bg} ${subjectStatus.color} ${subjectStatus.border}`}
                                >
                                  {subjectStatus.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <div className="mt-6 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
              <p className="text-xs font-semibold text-zinc-400 mb-3">
                Keterangan Status Kehadiran:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-green-900/30 text-green-400 border border-green-800 rounded font-bold">
                    Sangat Baik
                  </span>
                  <span className="text-zinc-400">≥ 90%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-900/30 text-blue-400 border border-blue-800 rounded font-bold">
                    Baik
                  </span>
                  <span className="text-zinc-400">75-89%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 border border-yellow-800 rounded font-bold">
                    Cukup
                  </span>
                  <span className="text-zinc-400">60-74%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-red-900/30 text-red-400 border border-red-800 rounded font-bold">
                    Kurang
                  </span>
                  <span className="text-zinc-400">&lt; 60%</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error memuat data absensi:", error);
    return (
      <div className="p-4 text-red-500">
        Terjadi kesalahan saat memproses data absensi.
      </div>
    );
  }
}
