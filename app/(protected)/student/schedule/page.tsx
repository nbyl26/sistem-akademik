import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { Siswa, Guru, User } from "@/types/user";
import {
  ScheduleData,
  ClassData,
  SubjectData,
  AcademicYear,
} from "@/types/master";
import { getAllDocuments, getActiveAcademicYear } from "@/lib/firestore";
import { notFound } from "next/navigation";
import {
  Calendar,
  Clock,
  BookOpen,
  User as UserIcon,
  MapPin,
} from "lucide-react";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

export default async function StudentSchedulePage() {
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
        <div className="p-8 text-center text-red-500 bg-red-900/10 rounded-xl border border-red-900/20">
          Sistem Belum Aktif.
        </div>
      );

    const [schedules, classes, subjects, teachers] = await Promise.all([
      getAllDocuments<ScheduleData>("schedules", [
        ["classId", "==", studentUser.kelasId],
        ["academicYearId", "==", activeYear.id!],
      ]),
      getAllDocuments<ClassData>("classes"),
      getAllDocuments<SubjectData>("subjects"),
      getAllDocuments<Guru>("users", [["role", "==", "guru"]]),
    ]);

    const getName = (id: string, list: { id: string; name: string }[]) =>
      list.find((item) => item.id === id)?.name || "N/A";
    const getTeacherName = (id: string) =>
      teachers.find((t) => t.uid === id)?.nama || "N/A";
    const studentClassName = getName(studentUser.kelasId, classes);

    // Group schedules by day
    const schedulesByDay = DAYS.reduce((acc, day) => {
      acc[day] = schedules
        .filter((s) => s.day === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      return acc;
    }, {} as Record<string, ScheduleData[]>);

    const totalSchedules = schedules.length;

    return (
      <div className="p-2">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-zinc-100">
            Jadwal Pelajaran
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

        {/* Statistics */}
        {totalSchedules > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 p-4 rounded-xl border border-blue-800/50">
              <p className="text-xs text-blue-400 mb-1">Total Mata Pelajaran</p>
              <p className="text-2xl font-bold text-blue-200">
                {new Set(schedules.map((s) => s.subjectId)).size}
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-900/30 to-orange-950/30 p-4 rounded-xl border border-orange-800/50">
              <p className="text-xs text-orange-400 mb-1">
                Total Pertemuan/Minggu
              </p>
              <p className="text-2xl font-bold text-orange-200">
                {totalSchedules}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-900/30 to-green-950/30 p-4 rounded-xl border border-green-800/50">
              <p className="text-xs text-green-400 mb-1">Hari Belajar</p>
              <p className="text-2xl font-bold text-green-200">
                {
                  Object.values(schedulesByDay).filter((s) => s.length > 0)
                    .length
                }{" "}
                Hari
              </p>
            </div>
          </div>
        )}

        {totalSchedules === 0 ? (
          <div className="p-12 text-center text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-zinc-700" />
            <p className="text-lg font-medium mb-2">Jadwal Belum Tersedia</p>
            <p className="text-sm text-zinc-600">
              Jadwal pelajaran akan muncul setelah admin mengatur jadwal untuk
              kelas Anda.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {DAYS.map((day) => {
              const daySchedules = schedulesByDay[day];
              if (daySchedules.length === 0) return null;

              return (
                <div
                  key={day}
                  className="animate-in fade-in slide-in-from-bottom-2"
                >
                  <div className="flex items-center mb-4">
                    <h2 className="text-xl font-bold text-zinc-200">{day}</h2>
                    <span className="ml-3 px-3 py-1 bg-orange-900/30 text-orange-400 border border-orange-800 rounded-full text-xs font-bold">
                      {daySchedules.length} Jadwal
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {daySchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="bg-zinc-900 p-5 rounded-xl border border-zinc-800 hover:border-orange-500/50 transition-all shadow-lg group"
                      >
                        {/* Time Badge */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center text-orange-500">
                            <Clock className="w-4 h-4 mr-2" />
                            <span className="text-sm font-bold">
                              {schedule.startTime} - {schedule.endTime}
                            </span>
                          </div>
                          <span className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded">
                            {(() => {
                              const [startHour, startMin] = schedule.startTime
                                .split(":")
                                .map(Number);
                              const [endHour, endMin] = schedule.endTime
                                .split(":")
                                .map(Number);
                              const duration =
                                endHour * 60 +
                                endMin -
                                (startHour * 60 + startMin);
                              return `${duration} menit`;
                            })()}
                          </span>
                        </div>

                        {/* Subject Name */}
                        <h3 className="text-lg font-bold text-zinc-100 mb-3 group-hover:text-orange-400 transition-colors flex items-start">
                          <BookOpen className="w-5 h-5 mr-2 mt-0.5 text-blue-500 flex-shrink-0" />
                          <span className="line-clamp-2">
                            {getName(schedule.subjectId, subjects)}
                          </span>
                        </h3>

                        {/* Details */}
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-zinc-400">
                            <UserIcon className="w-4 h-4 mr-2 text-zinc-500" />
                            <span className="text-zinc-500">Guru:</span>
                            <span className="ml-2 font-medium text-zinc-200">
                              {getTeacherName(schedule.teacherId)}
                            </span>
                          </div>
                          <div className="flex items-center text-zinc-400">
                            <MapPin className="w-4 h-4 mr-2 text-zinc-500" />
                            <span className="text-zinc-500">Ruang:</span>
                            <span className="ml-2 font-medium text-zinc-200">
                              {schedule.room}
                            </span>
                          </div>
                        </div>

                        {/* Footer Accent */}
                        <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                          <span className="text-xs text-zinc-600">
                            Kelas {studentClassName}
                          </span>
                          <div className="w-2 h-2 rounded-full bg-orange-500 group-hover:animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Info */}
        {totalSchedules > 0 && (
          <div className="mt-8 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <p className="text-xs font-semibold text-zinc-400 mb-3">
              Informasi Jadwal:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-500">
              <div className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>
                  Pastikan Anda hadir tepat waktu sesuai jadwal yang tertera
                </span>
              </div>
              <div className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>Perhatikan perubahan ruangan jika ada pengumuman</span>
              </div>
              <div className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>
                  Hubungi wali kelas jika ada pertanyaan terkait jadwal
                </span>
              </div>
              <div className="flex items-start">
                <span className="text-orange-500 mr-2">•</span>
                <span>
                  Jadwal dapat berubah sewaktu-waktu sesuai kebijakan sekolah
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Error memuat jadwal:", error);
    return (
      <div className="p-4 text-red-500">
        Terjadi kesalahan saat memuat jadwal pelajaran.
      </div>
    );
  }
}
