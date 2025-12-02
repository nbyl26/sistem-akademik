"use client";

import React, { useState } from "react";
import { TeacherRecapData } from "@/app/(protected)/teacher/recap/page";
import { Printer, Users, ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import Link from "next/link";

interface TeacherRecapContentProps {
  recapData: TeacherRecapData;
}

export default function TeacherRecapContent({
  recapData,
}: TeacherRecapContentProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isExpanded = (itemId: string) => expandedItems.includes(itemId);

  return (
    <div className="p-2">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-zinc-100">
          Rekap Absensi Mengajar
        </h1>
        <p className="text-sm text-zinc-400">
          Tahun Ajaran:{" "}
          <span className="font-bold text-orange-500">{recapData.yearName}</span>
        </p>
      </div>

      {recapData.combos.length === 0 ? (
        <div className="p-8 text-center text-zinc-500 border border-zinc-800 rounded-xl bg-zinc-900">
          <Users className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
          <p>Belum ada jadwal mengajar yang tersedia.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recapData.combos.map((combo) => {
            const itemId = `${combo.classId}-${combo.subjectId}`;
            const expanded = isExpanded(itemId);

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
                      <p className="text-xs text-zinc-500">Pertemuan</p>
                      <p className="text-xl font-bold text-orange-500">
                        {combo.meetingCount}
                      </p>
                    </div>
                  </div>
                </button>

                {expanded && (
                  <div className="ml-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800 border-l-4 border-l-green-500 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-zinc-950 rounded border border-zinc-700">
                          <p className="text-xs text-zinc-500 mb-1">Kelas</p>
                          <p className="text-sm font-bold text-zinc-200">
                            {combo.className}
                          </p>
                        </div>
                        <div className="p-3 bg-zinc-950 rounded border border-zinc-700">
                          <p className="text-xs text-zinc-500 mb-1">Mapel</p>
                          <p className="text-sm font-bold text-zinc-200">
                            {combo.subjectName}
                          </p>
                        </div>
                        <div className="p-3 bg-zinc-950 rounded border border-zinc-700">
                          <p className="text-xs text-zinc-500 mb-1">
                            Total Pertemuan
                          </p>
                          <p className="text-sm font-bold text-orange-500">
                            {combo.meetingCount}x
                          </p>
                        </div>
                        <div className="p-3 bg-zinc-950 rounded border border-zinc-700">
                          <p className="text-xs text-zinc-500 mb-1">Status</p>
                          <p className="text-sm font-bold text-green-500">
                            {combo.meetingCount > 0 ? "Aktif" : "Belum"}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/cetak/absensi?classId=${combo.classId}&subjectId=${combo.subjectId}`}
                        target="_blank"
                        className="w-2/5 bg-orange-600 hover:bg-orange-500 text-white px-4 py-3 rounded-lg font-bold flex self-end items-center justify-center transition-all shadow-lg shadow-orange-900/20 active:scale-95"
                      >
                        <Printer className="w-4 h-4 mr-2" />
                        Cetak Rekap Absensi
                      </Link>
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
