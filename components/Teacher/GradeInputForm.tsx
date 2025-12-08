"use client";

import React, { useState, useEffect } from "react";
import { addDocument } from "@/lib/firestore";
import {
  GradeRecord,
  ClassData,
  SubjectData,
  AssessmentType,
  AttendanceRecord,
  AttendanceSettings,
} from "@/types/master";
import { Siswa } from "@/types/user";
import { Save, FileText, AlertTriangle } from "lucide-react";

interface GradeProps {
  teacherId: string;
  schedules: any[];
  classes: ClassData[];
  subjects: SubjectData[];
  allStudents: Siswa[];
  activeYearId: string;
  attendanceRecords: AttendanceRecord[];
  attendanceSettings: AttendanceSettings | null;
}

type NewGradeRecord = Omit<GradeRecord, "id">;
const ASSESSMENT_TYPES: AssessmentType[] = [
  "Tugas Harian",
  "UTS",
  "UAS",
  "Lainnya",
];

export default function GradeInputForm({
  teacherId,
  schedules,
  classes,
  subjects,
  allStudents,
  activeYearId,
  attendanceRecords,
  attendanceSettings,
}: GradeProps) {
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null
  );
  const [currentClassStudents, setCurrentClassStudents] = useState<Siswa[]>([]);
  const [gradeInput, setGradeInput] = useState<Record<string, number | null>>(
    {}
  );
  const [studentAttendance, setStudentAttendance] = useState<Record<string, { present: number; total: number; percentage: number }>>({});
  const [loading, setLoading] = useState(false);
  const [assessmentType, setAssessmentType] =
    useState<AssessmentType>("Tugas Harian");
  const [assessmentName, setAssessmentName] = useState<string>("");
  const [assessmentDate, setAssessmentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const selectedSchedule = schedules.find(
    (s: any) => s.id === selectedScheduleId
  );

  // Calculate student attendance
  const calculateAttendance = (studentId: string, classId: string, subjectId: string) => {
    const relevantRecords = attendanceRecords.filter(
      (record) =>
        record.classId === classId &&
        record.subjectId === subjectId
    );

    let totalMeetings = 0;
    let presentCount = 0;

    relevantRecords.forEach((record) => {
      const studentRecord = record.records.find((r) => r.studentId === studentId);
      if (studentRecord) {
        totalMeetings++;
        if (studentRecord.status === "Hadir") {
          presentCount++;
        }
      }
    });

    const percentage = totalMeetings > 0 ? (presentCount / totalMeetings) * 100 : 0;

    return {
      present: presentCount,
      total: totalMeetings,
      percentage: Math.round(percentage * 10) / 10,
    };
  };

  useEffect(() => {
    if (selectedSchedule) {
      const studentsInClass = allStudents
        .filter((s) => s.kelasId === selectedSchedule.classId)
        .sort((a, b) => a.nama.localeCompare(b.nama));
      setCurrentClassStudents(studentsInClass);
      
      const initialGrades = studentsInClass.reduce((acc, student) => {
        acc[student.uid] = null;
        return acc;
      }, {} as Record<string, number | null>);
      setGradeInput(initialGrades);

      // Calculate attendance for each student
      const attendanceData = studentsInClass.reduce((acc, student) => {
        acc[student.uid] = calculateAttendance(
          student.uid,
          selectedSchedule.classId,
          selectedSchedule.subjectId
        );
        return acc;
      }, {} as Record<string, { present: number; total: number; percentage: number }>);
      setStudentAttendance(attendanceData);
    } else {
      setCurrentClassStudents([]);
      setGradeInput({});
      setStudentAttendance({});
    }
  }, [selectedSchedule, allStudents, attendanceRecords]);

  const handleGradeChange = (studentId: string, value: string) => {
    const score = value === "" ? null : parseInt(value);
    if (score === null || (score >= 0 && score <= 100)) {
      setGradeInput((prev) => ({ ...prev, [studentId]: score }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (
      !selectedSchedule ||
      !assessmentName ||
      currentClassStudents.length === 0
    ) {
      alert("Data belum lengkap.");
      setLoading(false);
      return;
    }

    // Check attendance requirement for UAS
    if (assessmentType === "UAS" && attendanceSettings) {
      const minAttendance = attendanceSettings.minAttendanceForUAS;
      const ineligibleStudents: string[] = [];

      currentClassStudents.forEach((student) => {
        const attendance = studentAttendance[student.uid];
        if (attendance && attendance.percentage < minAttendance) {
          ineligibleStudents.push(`${student.nama} (${attendance.percentage.toFixed(1)}%)`);
        }
      });

      if (ineligibleStudents.length > 0) {
        const message = `Peringatan! Siswa berikut tidak memenuhi syarat kehadiran minimal ${minAttendance}% untuk UAS:\n\n${ineligibleStudents.join("\n")}\n\nApakah Anda yakin ingin melanjutkan?`;
        if (!confirm(message)) {
          setLoading(false);
          return;
        }
      }
    }

    try {
      const incomplete = Object.values(gradeInput).some(
        (score) => score === null
      );
      if (incomplete && !confirm("Ada nilai kosong (NULL). Lanjut simpan?")) {
        setLoading(false);
        return;
      }
      const gradeRecord: NewGradeRecord = {
        academicYearId: activeYearId,
        classId: selectedSchedule.classId,
        subjectId: selectedSchedule.subjectId,
        teacherId: teacherId,
        assessmentType: assessmentType,
        assessmentName: assessmentName,
        date: assessmentDate,
        scores: gradeInput,
      };
      await addDocument("grades", gradeRecord);
      alert("Nilai berhasil disimpan!");
      setAssessmentName("");
      setGradeInput(
        currentClassStudents.reduce((acc, s) => {
          acc[s.uid] = null;
          return acc;
        }, {} as Record<string, number | null>)
      );
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const getClassName = (id: string) =>
    classes.find((c) => c.id === id)?.name || "N/A";
  const getSubjectName = (id: string) =>
    subjects.find((s) => s.id === id)?.name || "N/A";

  return (
    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg">
      <h2 className="text-xl font-bold mb-6 text-zinc-100 flex items-center">
        <FileText className="w-5 h-5 mr-2 text-orange-500" /> Input Nilai
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border border-zinc-800 rounded-xl bg-zinc-950/50">
          <div className="md:col-span-4">
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
              {schedules.map((schedule: any) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.day}, {schedule.startTime} -{" "}
                  {getClassName(schedule.classId)} (
                  {getSubjectName(schedule.subjectId)})
                </option>
              ))}
            </select>
          </div>
          <select
            value={assessmentType}
            onChange={(e) =>
              setAssessmentType(e.target.value as AssessmentType)
            }
            className="mt-1 block w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-2 rounded-lg focus:border-orange-500 outline-none"
          >
            {ASSESSMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Nama Penilaian (e.g. UH 1)"
            value={assessmentName}
            onChange={(e) => setAssessmentName(e.target.value)}
            className="mt-1 block w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-2 rounded-lg focus:border-orange-500 outline-none col-span-2"
            required
          />
          <input
            type="date"
            value={assessmentDate}
            onChange={(e) => setAssessmentDate(e.target.value)}
            className="mt-1 block w-full bg-zinc-900 border border-zinc-800 text-zinc-100 p-2 rounded-lg focus:border-orange-500 outline-none"
            required
          />
        </div>

        {selectedSchedule && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {assessmentType === "UAS" && attendanceSettings && (
              <div className="mb-4 p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-blue-300 mb-1">
                    Syarat Kehadiran UAS
                  </p>
                  <p className="text-sm text-blue-200">
                    Minimal kehadiran untuk UAS: <span className="font-bold text-blue-400">{attendanceSettings.minAttendanceForUAS}%</span>
                    <br />
                    Siswa yang tidak memenuhi syarat akan diberi peringatan saat menyimpan nilai.
                  </p>
                </div>
              </div>
            )}
            
            <h3 className="text-lg font-semibold mb-3 text-zinc-300">
              Input Nilai Kelas{" "}
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
                    {assessmentType === "UAS" && (
                      <th className="px-6 py-3 text-center text-xs font-medium text-zinc-400 uppercase">
                        Kehadiran
                      </th>
                    )}
                    <th className="px-6 py-3 text-center text-xs font-medium text-zinc-400 uppercase">
                      Nilai (0-100)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-zinc-900 divide-y divide-zinc-800">
                  {currentClassStudents.map((student) => {
                    const attendance = studentAttendance[student.uid];
                    const meetsRequirement = !attendanceSettings || 
                      !attendance || 
                      assessmentType !== "UAS" || 
                      attendance.percentage >= attendanceSettings.minAttendanceForUAS;

                    return (
                      <tr
                        key={student.uid}
                        className={`hover:bg-zinc-800/50 transition-colors ${
                          !meetsRequirement ? "bg-red-900/10" : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-200">
                          {student.nama}
                          {!meetsRequirement && (
                            <span className="ml-2 text-xs text-red-400">
                              (Tidak memenuhi syarat)
                            </span>
                          )}
                        </td>
                        {assessmentType === "UAS" && (
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                            {attendance ? (
                              <div className="flex flex-col items-center">
                                <span
                                  className={`font-bold ${
                                    meetsRequirement
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {attendance.percentage.toFixed(1)}%
                                </span>
                                <span className="text-xs text-zinc-500">
                                  {attendance.present}/{attendance.total}
                                </span>
                              </div>
                            ) : (
                              <span className="text-zinc-500 text-xs">
                                Belum ada data
                              </span>
                            )}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={
                              gradeInput[student.uid] === null
                                ? ""
                                : gradeInput[student.uid]!
                            }
                            onChange={(e) =>
                              handleGradeChange(student.uid, e.target.value)
                            }
                            className="w-24 p-2 bg-zinc-950 border border-zinc-700 rounded text-center text-zinc-100 focus:border-orange-500 outline-none"
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-orange-600 text-white font-bold py-3 rounded-lg hover:bg-orange-500 transition shadow-lg shadow-orange-900/20 disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Nilai"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
