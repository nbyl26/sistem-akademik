"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { getAllDocuments, getActiveAcademicYear } from "@/lib/firestore";
import {
  ScheduleData,
  ClassData,
  SubjectData,
  AcademicYear,
} from "@/types/master";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

interface PageProps {
  teacherId: string;
}

export default function TeacherScheduleContent({ teacherId }: PageProps) {
  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("Senin");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const year = await getActiveAcademicYear();
        setActiveYear(year);

        if (year) {
          const [scheduleData, classData, subjectData] = await Promise.all([
            getAllDocuments<ScheduleData>("schedules", [
              ["teacherId", "==", teacherId],
              ["academicYearId", "==", year.id!],
            ]),
            getAllDocuments<ClassData>("classes"),
            getAllDocuments<SubjectData>("subjects"),
          ]);

          setSchedules(scheduleData);
          setClasses(classData);
          setSubjects(subjectData);
        }
      } catch (error) {
        console.error("Error fetching schedule:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [teacherId]);

  const getName = (id: string, list: { id: string; name: string }[]) =>
    list.find((item) => item.id === id)?.name || "N/A";

  const filteredSchedules = schedules
    .filter((s) => s.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  if (isLoading) {
    return <div className="p-4 text-zinc-400">Memuat data...</div>;
  }

  if (!activeYear) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-900/20 rounded-lg border border-red-900/50">
        Sistem Belum Aktif. Hubungi Admin.
      </div>
    );
  }

  return (
    <div className="p-2">
      <h1 className="text-3xl font-bold mb-2 text-zinc-100">
        Jadwal Mengajar Saya
      </h1>
      <p className="text-sm text-zinc-400 mb-6">
        Tahun Ajaran:{" "}
        <span className="font-bold text-orange-500">{activeYear.name}</span>
      </p>

      {/* Tab Hari */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {DAYS.map((day) => {
          const dayScheduleCount = schedules.filter(
            (s) => s.day === day
          ).length;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedDay === day
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-900/30"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 border border-zinc-800"
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="text-sm font-bold">{day}</span>
                <span
                  className={`text-xs mt-1 ${
                    selectedDay === day ? "text-orange-200" : "text-zinc-500"
                  }`}
                >
                  {dayScheduleCount} jadwal
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Konten Jadwal */}
      {filteredSchedules.length === 0 ? (
        <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-xl">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
          <p className="text-zinc-500 font-medium">
            Tidak ada jadwal mengajar pada hari{" "}
            <span className="text-orange-500 font-bold">{selectedDay}</span>
          </p>
          <p className="text-zinc-600 text-sm mt-2">
            Silakan pilih hari lain atau hubungi admin jika ada kesalahan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 hover:border-orange-500/50 transition-all shadow-lg group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center text-orange-500">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="font-bold">
                    {schedule.startTime} - {schedule.endTime}
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-zinc-100 mb-2 group-hover:text-orange-400 transition-colors">
                {getName(schedule.classId, classes)}
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-zinc-400">
                  <span className="w-20 text-zinc-500">Mapel:</span>
                  <span className="font-medium text-zinc-200">
                    {getName(schedule.subjectId, subjects)}
                  </span>
                </div>
                <div className="flex items-center text-zinc-400">
                  <span className="w-20 text-zinc-500">Ruang:</span>
                  <span className="font-medium text-zinc-200">
                    {schedule.room}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
