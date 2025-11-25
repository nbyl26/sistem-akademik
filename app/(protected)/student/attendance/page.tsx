import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { Siswa, User } from "@/types/user";
import { AttendanceRecord, ClassData, SubjectData } from "@/types/master";
import { getAllDocuments, getActiveAcademicYear } from "@/lib/firestore";
import { notFound } from "next/navigation";
import { CheckCircle, XCircle, Users, Book } from "lucide-react";

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
        <div className="p-8 text-center text-red-500">Sistem Belum Aktif.</div>
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

    return (
      <div className="p-2">
        <h1 className="text-3xl font-bold mb-2 text-zinc-100">
          Rekap Absensiku
        </h1>
        <p className="text-sm text-zinc-400 mb-6">
          Kelas:{" "}
          <span className="font-bold text-orange-500">{studentClassName}</span>
        </p>

        {summary.totalMeetings === 0 ? (
          <div className="p-8 text-center text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900">
            <Users className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
            <p>Belum ada data absensi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <h2 className="text-xl font-bold mb-4 text-zinc-300">
                Ringkasan Global
              </h2>
              <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg space-y-4">
                <p className="flex justify-between font-bold text-zinc-100 border-b border-zinc-800 pb-2">
                  Total Pertemuan: <span>{summary.totalMeetings}</span>
                </p>
                <p className="flex justify-between text-green-500">
                  <CheckCircle className="w-5 h-5 mr-2" /> Hadir:{" "}
                  <span>{summary.hadir}</span>
                </p>
                <p className="flex justify-between text-yellow-500">
                  Sakit: <span>{summary.sakit}</span>
                </p>
                <p className="flex justify-between text-blue-500">
                  Izin: <span>{summary.izin}</span>
                </p>
                <p className="flex justify-between text-red-500">
                  <XCircle className="w-5 h-5 mr-2" /> Alpha:{" "}
                  <span>{summary.alpha}</span>
                </p>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h2 className="text-xl font-bold mb-4 text-zinc-300">
                Detail Per Mapel
              </h2>
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg overflow-hidden">
                <table className="min-w-full divide-y divide-zinc-800">
                  <thead className="bg-zinc-950/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                        Mapel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                        Hadir
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                        Total
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase">
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {Object.values(summary.bySubject).map((sub) => (
                      <tr
                        key={sub.subjectName}
                        className="hover:bg-zinc-800/30"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-200 flex items-center">
                          <Book className="w-4 h-4 mr-2 text-blue-500" />
                          {sub.subjectName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-500">
                          {sub.hadiri}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                          {sub.total}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-orange-500">
                          {((sub.hadiri / sub.total) * 100).toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    return <div className="p-4 text-red-500">Error.</div>;
  }
}
