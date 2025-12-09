"use client";

import React, { useState } from "react";
import { TeacherGradeRecapData } from "@/app/(protected)/teacher/grade-recap/page";
import {
  Users,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Award,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

interface TeacherGradeRecapContentProps {
  recapData: TeacherGradeRecapData;
}

export default function TeacherGradeRecapContent({
  recapData,
}: TeacherGradeRecapContentProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isExpanded = (itemId: string) => expandedItems.includes(itemId);

  // Helper function to calculate final grade
  const calculateFinalGrade = (
    studentId: string,
    classId: string,
    subjectId: string
  ): number | null => {
    const studentGrades = recapData.gradeRecords.filter(
      (record) =>
        record.classId === classId &&
        record.subjectId === subjectId &&
        record.scores[studentId] !== undefined &&
        record.scores[studentId] !== null
    );

    if (studentGrades.length === 0) return null;

    let tugasScores: number[] = [];
    let utsScore: number | null = null;
    let uasScore: number | null = null;
    let lainnyaScores: number[] = [];

    studentGrades.forEach((record) => {
      const score = record.scores[studentId];
      if (score !== null && score !== undefined) {
        if (record.assessmentType === "Tugas Harian") {
          tugasScores.push(score);
        } else if (record.assessmentType === "UTS") {
          utsScore = score;
        } else if (record.assessmentType === "UAS") {
          uasScore = score;
        } else if (record.assessmentType === "Lainnya") {
          lainnyaScores.push(score);
        }
      }
    });

    const settings = recapData.gradeSettings;

    if (!settings) {
      // Default calculation: 40% Tugas, 30% UTS, 30% UAS
      const avgTugas =
        tugasScores.length > 0
          ? tugasScores.reduce((a, b) => a + b, 0) / tugasScores.length
          : 0;
      const finalUTS = utsScore ?? 0;
      const finalUAS = uasScore ?? 0;

      return avgTugas * 0.4 + finalUTS * 0.3 + finalUAS * 0.3;
    }

    // Calculation with settings
    const avgTugas =
      tugasScores.length > 0
        ? tugasScores.reduce((a, b) => a + b, 0) / tugasScores.length
        : 0;
    const finalUTS = utsScore ?? 0;
    const finalUAS = uasScore ?? 0;
    const avgLainnya =
      lainnyaScores.length > 0
        ? lainnyaScores.reduce((a, b) => a + b, 0) / lainnyaScores.length
        : 0;

    return (
      (avgTugas * settings.tugasPercentage) / 100 +
      (finalUTS * settings.utsPercentage) / 100 +
      (finalUAS * settings.uasPercentage) / 100 +
      (avgLainnya * (settings.lainnyaPercentage || 0)) / 100
    );
  };

  // Get grade letter
  const getGradeLetter = (score: number): string => {
    if (score >= 85) return "A";
    if (score >= 75) return "B";
    if (score >= 60) return "C";
    if (score >= 50) return "D";
    return "E";
  };

  return (
    <div className="p-2">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-zinc-100">
          Rekap Nilai Mengajar
        </h1>
        <p className="text-sm text-zinc-400">
          Tahun Ajaran:{" "}
          <span className="font-bold text-orange-500">
            {recapData.yearName}
          </span>
        </p>
      </div>

      {!recapData.gradeSettings && (
        <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-xl flex items-start">
          <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 text-yellow-400 flex-shrink-0" />
          <div className="text-sm text-yellow-300">
            <p className="font-semibold mb-1">Peringatan</p>
            <p>
              Pengaturan bobot nilai belum dikonfigurasi oleh Admin. Menggunakan
              perhitungan standar: Tugas 40%, UTS 30%, UAS 30%.
            </p>
          </div>
        </div>
      )}

      {recapData.combos.length === 0 ? (
        <div className="p-12 text-center text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900">
          <Users className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
          <p>Belum ada jadwal mengajar yang tersedia.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recapData.combos.map((combo) => {
            const itemId = `${combo.classId}-${combo.subjectId}`;
            const expanded = isExpanded(itemId);

            // Get students for this class
            const classStudents = recapData.allStudents
              .filter((s) => s.kelasId === combo.classId)
              .sort((a, b) => a.nama.localeCompare(b.nama));

            // Calculate statistics
            const finalGrades = classStudents
              .map((s) =>
                calculateFinalGrade(s.uid, combo.classId, combo.subjectId)
              )
              .filter((g): g is number => g !== null);

            const avgGrade =
              finalGrades.length > 0
                ? finalGrades.reduce((a, b) => a + b, 0) / finalGrades.length
                : 0;

            const highestGrade =
              finalGrades.length > 0 ? Math.max(...finalGrades) : 0;
            const lowestGrade =
              finalGrades.length > 0 ? Math.min(...finalGrades) : 0;

            return (
              <div key={itemId} className="space-y-2">
                <button
                  onClick={() => toggleExpand(itemId)}
                  className="w-full flex items-center gap-4 p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 border-l-4 border-l-orange-500 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {expanded ? (
                      <ChevronDown className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    )}
                    <BookOpen className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-zinc-300 truncate">
                        {combo.className}
                      </h3>
                      <p className="text-sm text-zinc-500 truncate">
                        {combo.subjectName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">Siswa</p>
                      <p className="text-xl font-bold text-blue-500">
                        {combo.studentCount}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">Nilai Input</p>
                      <p className="text-xl font-bold text-green-500">
                        {finalGrades.length}
                      </p>
                    </div>
                  </div>
                </button>

                {expanded && (
                  <div className="ml-6 space-y-4">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                        <div className="flex items-center mb-2">
                          <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                          <p className="text-xs text-zinc-500">
                            Rata-rata Kelas
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-blue-400">
                          {avgGrade.toFixed(1)}
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">
                          Predikat: {getGradeLetter(avgGrade)}
                        </p>
                      </div>

                      <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                        <div className="flex items-center mb-2">
                          <Award className="w-5 h-5 mr-2 text-green-500" />
                          <p className="text-xs text-zinc-500">
                            Nilai Tertinggi
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-green-400">
                          {highestGrade.toFixed(1)}
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">
                          Predikat: {getGradeLetter(highestGrade)}
                        </p>
                      </div>

                      <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
                        <div className="flex items-center mb-2">
                          <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                          <p className="text-xs text-zinc-500">
                            Nilai Terendah
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-red-400">
                          {lowestGrade.toFixed(1)}
                        </p>
                        <p className="text-xs text-zinc-600 mt-1">
                          Predikat: {getGradeLetter(lowestGrade)}
                        </p>
                      </div>
                    </div>

                    {/* Students Table */}
                    <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-zinc-800">
                          <thead className="bg-zinc-950/50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                                No
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                                Nama Siswa
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase">
                                NIS
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase">
                                Nilai Akhir
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-zinc-400 uppercase">
                                Predikat
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800">
                            {classStudents.map((student, index) => {
                              const finalGrade = calculateFinalGrade(
                                student.uid,
                                combo.classId,
                                combo.subjectId
                              );
                              const gradeLetter =
                                finalGrade !== null
                                  ? getGradeLetter(finalGrade)
                                  : "-";

                              return (
                                <tr
                                  key={student.uid}
                                  className="hover:bg-zinc-800/30 transition-colors"
                                >
                                  <td className="px-4 py-3 text-sm text-zinc-500">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 py-3 text-sm font-medium text-zinc-200">
                                    {student.nama}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-zinc-400 font-mono">
                                    {student.nis}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {finalGrade !== null ? (
                                      <span className="text-lg font-bold text-orange-500">
                                        {finalGrade.toFixed(1)}
                                      </span>
                                    ) : (
                                      <span className="text-sm text-zinc-600">
                                        Belum ada nilai
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {finalGrade !== null ? (
                                      <span
                                        className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                                          gradeLetter === "A"
                                            ? "bg-green-900/30 text-green-400 border-green-800"
                                            : gradeLetter === "B"
                                            ? "bg-blue-900/30 text-blue-400 border-blue-800"
                                            : gradeLetter === "C"
                                            ? "bg-yellow-900/30 text-yellow-400 border-yellow-800"
                                            : "bg-red-900/30 text-red-400 border-red-800"
                                        }`}
                                      >
                                        {gradeLetter}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-zinc-600">
                                        -
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
