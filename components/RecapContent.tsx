"use client";

import React, { useState } from "react";
import { AcademicYear, GradeSettings, SubjectData } from "@/types/master";
import { AcademicYearRecap } from "@/app/(protected)/admin/recap/page";
import {
  Users,
  Award,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface RecapContentProps {
  activeYear: AcademicYear;
  academicYearRecap: AcademicYearRecap;
  subjects: SubjectData[];
  currentGradeSettings: GradeSettings | null;
}

export default function RecapContent({
  activeYear,
  academicYearRecap,
  subjects,
  currentGradeSettings,
}: RecapContentProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isExpanded = (sectionId: string) => expandedSections.includes(sectionId);

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

      {/* Attendance Section */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center text-zinc-300">
          <Users className="w-5 h-5 mr-2 text-orange-500" /> 1. Rekap Absensi
        </h2>

        {academicYearRecap.classes.map((classRecap) => {
          const classId = `attendance-${classRecap.classId}`;
          const expanded = isExpanded(classId);

          return (
            <div key={classRecap.classId} className="mb-4">
              <button
                onClick={() => toggleSection(classId)}
                className="w-full flex items-center gap-3 p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 border-l-4 border-l-orange-500 transition-colors text-left"
              >
                {expanded ? (
                  <ChevronDown className="w-5 h-5 text-orange-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-orange-500" />
                )}
                <h3 className="text-lg font-semibold text-zinc-300 flex-1">
                  {classRecap.className}
                </h3>
                <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded">
                  {classRecap.students.length} siswa
                </span>
              </button>

              {expanded && (
                <div className="mt-4 bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg overflow-x-auto animate-in fade-in slide-in-from-top-2">
                  <table className="min-w-full divide-y divide-zinc-800">
                    <thead className="bg-zinc-950/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase sticky left-0 bg-zinc-950 z-10">
                          Siswa
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
                      {classRecap.students.map((rec) => (
                        <tr
                          key={rec.uid}
                          className="hover:bg-zinc-800/30 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-zinc-200 sticky left-0 bg-zinc-900 z-10 border-r border-zinc-800">
                            {rec.name} <br />{" "}
                            <span className="text-xs text-zinc-500">
                              ({rec.nis})
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
              )}
            </div>
          );
        })}
      </div>

      {/* Grades Section */}
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

        {academicYearRecap.classes.map((classRecap) => {
          const classId = `grades-${classRecap.classId}`;
          const expanded = isExpanded(classId);

          return (
            <div key={classRecap.classId} className="mb-4">
              <button
                onClick={() => toggleSection(classId)}
                className="w-full flex items-center gap-3 p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 border-l-4 border-l-orange-500 transition-colors text-left"
              >
                {expanded ? (
                  <ChevronDown className="w-5 h-5 text-orange-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-orange-500" />
                )}
                <h3 className="text-lg font-semibold text-zinc-300 flex-1">
                  {classRecap.className}
                </h3>
                <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded">
                  {classRecap.students.length} siswa
                </span>
              </button>

              {expanded && (
                <div className="mt-4 bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg overflow-x-auto animate-in fade-in slide-in-from-top-2">
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
                      {classRecap.students.map((rec) => (
                        <tr
                          key={rec.uid}
                          className="hover:bg-zinc-800/30 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-zinc-200 sticky left-0 bg-zinc-900 z-10 border-r border-zinc-800">
                            {rec.name} <br />{" "}
                            <span className="text-xs text-zinc-500">
                              ({rec.nis})
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
