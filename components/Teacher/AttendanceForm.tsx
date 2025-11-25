"use client";

import React, { useState, useEffect } from "react";
import { addDocument } from "@/lib/firestore";
import {
  ScheduleData,
  ClassData,
  SubjectData,
  AttendanceStatus,
  AttendanceRecord,
} from "@/types/master";
import { Siswa } from "@/types/user";
import { UserPlus, XCircle, Save, Calendar } from "lucide-react";

interface AttendanceProps {
  teacherId: string;
  schedules: ScheduleData[];
  classes: ClassData[];
  subjects: SubjectData[];
  allStudents: Siswa[];
  activeYearId: string;
}

type NewAttendanceRecord = Omit<AttendanceRecord, "id">;
const ATTENDANCE_OPTIONS: AttendanceStatus[] = [
  "Hadir",
  "Sakit",
  "Izin",
  "Alpha",
];

export default function AttendanceForm({
  teacherId,
  schedules = [],
  classes,
  subjects,
  allStudents,
  activeYearId,
}: AttendanceProps) {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null
  );
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [currentClassStudents, setCurrentClassStudents] = useState<Siswa[]>([]);
  const [attendanceData, setAttendanceData] = useState<
    Record<string, AttendanceStatus>
  >({});
  const [loading, setLoading] = useState(false);

  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  const selectedSchedule = safeSchedules.find(
    (s) => s.id === selectedScheduleId
  );

  useEffect(() => {
    if (selectedSchedule) {
      const studentsInClass = allStudents.filter(
        (s) => s.kelasId === selectedSchedule.classId
      );
      setCurrentClassStudents(studentsInClass);
      const initialAttendance = studentsInClass.reduce((acc, student) => {
        acc[student.uid] = "Hadir";
        return acc;
      }, {} as Record<string, AttendanceStatus>);
      setAttendanceData(initialAttendance);
    } else {
      setCurrentClassStudents([]);
      setAttendanceData({});
    }
  }, [selectedSchedule, allStudents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (
      !selectedSchedule ||
      !attendanceDate ||
      currentClassStudents.length === 0
    ) {
      alert("Harap pilih jadwal dan pastikan ada siswa.");
      setLoading(false);
      return;
    }

    try {
      const records = currentClassStudents.map((student) => {
        const status = attendanceData[student.uid] || "Alpha";

        const recordData: any = {
          studentId: student.uid,
          status: status,
        };

        if (status !== "Hadir") {
          recordData.notes = `Input by ${teacherId}`;
        }

        return recordData;
      });

      const attendanceRecord: NewAttendanceRecord = {
        academicYearId: activeYearId,
        classId: selectedSchedule.classId,
        subjectId: selectedSchedule.subjectId,
        teacherId: teacherId,
        date: attendanceDate,
        records: records,
      };

      await addDocument("attendance", attendanceRecord);
      alert("Absensi berhasil disimpan!");
      setLoading(false);
    } catch (error: any) {
      console.error("Error saving attendance:", error);
      alert(`Gagal menyimpan: ${error.message || "Terjadi kesalahan sistem"}`);
      setLoading(false);
    }
  };

  const getSubjectName = (id: string) =>
    subjects.find((s) => s.id === id)?.name || "N/A";
  const getClassName = (id: string) =>
    classes.find((c) => c.id === id)?.name || "N/A";

  return (
    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg">
      <h2 className="text-xl font-bold mb-6 text-zinc-100 flex items-center">
        <UserPlus className="w-5 h-5 mr-2 text-orange-500" /> Input Kehadiran
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border border-zinc-800 rounded-xl bg-zinc-950/50">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-2 rounded-lg focus:border-orange-500 outline-none"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Jadwal Mengajar
            </label>
            <select
              value={selectedScheduleId || ""}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-2 rounded-lg focus:border-orange-500 outline-none"
              required
            >
              <option value="" disabled>
                -- Pilih Jadwal --
              </option>
              {safeSchedules.length === 0 ? (
                <option disabled>Tidak ada jadwal aktif.</option>
              ) : (
                safeSchedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.day}, {schedule.startTime} -{" "}
                    {getClassName(schedule.classId)} (
                    {getSubjectName(schedule.subjectId)})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {selectedSchedule && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-semibold mb-3 text-zinc-300">
              Siswa Kelas{" "}
              <span className="text-orange-500">
                {getClassName(selectedSchedule.classId)}
              </span>
            </h3>

            <div className="overflow-x-auto rounded-lg border border-zinc-800">
              <table className="min-w-full divide-y divide-zinc-800">
                <thead className="bg-zinc-950">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                      Nama Siswa
                    </th>
                    {ATTENDANCE_OPTIONS.map((status) => (
                      <th
                        key={status}
                        className="px-6 py-3 text-center text-xs font-medium text-zinc-400 uppercase"
                      >
                        {status}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                  {currentClassStudents.map((student) => (
                    <tr
                      key={student.uid}
                      className="hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-200">
                        {student.nama}{" "}
                        <span className="text-zinc-500 text-xs ml-1">
                          ({student.nis})
                        </span>
                      </td>
                      {ATTENDANCE_OPTIONS.map((status) => (
                        <td key={status} className="px-6 py-4 text-center">
                          <input
                            type="radio"
                            name={`attendance-${student.uid}`}
                            checked={attendanceData[student.uid] === status}
                            onChange={() =>
                              setAttendanceData((prev) => ({
                                ...prev,
                                [student.uid]: status,
                              }))
                            }
                            className="w-4 h-4 text-orange-600 bg-zinc-800 border-zinc-600 focus:ring-orange-500 accent-orange-500 cursor-pointer"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="submit"
              disabled={loading || currentClassStudents.length === 0}
              className="mt-6 w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-500 transition shadow-lg shadow-orange-900/20 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Absensi"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
