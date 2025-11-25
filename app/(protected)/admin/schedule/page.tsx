"use client";

import React, { useState, useEffect } from "react";
import {
  addDocument,
  getAllDocuments,
  getActiveAcademicYear,
} from "@/lib/firestore";
import {
  ScheduleData,
  ClassData,
  SubjectData,
  AcademicYear,
} from "@/types/master";
import { Guru } from "@/types/user";
import { Calendar, Save, PlusCircle } from "lucide-react";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const ROOMS = ["Kelas Utama", "Lab Komp 1", "Lab Komp 2", "Audo/Aula"];

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [teachers, setTeachers] = useState<Guru[]>([]);
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const COLLECTION_NAME = "schedules";

  const initialFormData: Omit<ScheduleData, "id"> = {
    academicYearId: "",
    classId: "",
    subjectId: "",
    teacherId: "",
    day: DAYS[0],
    startTime: "07:30",
    endTime: "09:00",
    room: ROOMS[0],
  };
  const [formData, setFormData] =
    useState<Omit<ScheduleData, "id">>(initialFormData);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const currentYear = await getActiveAcademicYear();
      setActiveYear(currentYear);

      const [classData, subjectData, teacherData] = await Promise.all([
        getAllDocuments<ClassData>("classes"),
        getAllDocuments<SubjectData>("subjects"),
        getAllDocuments<Guru>("users", [["role", "==", "guru"]]),
      ]);

      setClasses(classData);
      setSubjects(subjectData);
      setTeachers(teacherData);

      if (currentYear && currentYear.id) {
        setFormData((prev) => ({ ...prev, academicYearId: currentYear.id! }));
        const scheduleData = await getAllDocuments<ScheduleData>(
          COLLECTION_NAME,
          [["academicYearId", "==", currentYear.id]]
        );
        setSchedules(scheduleData);
        setError(null);
      } else {
        setError("Tahun Ajaran Aktif belum diset.");
      }
    } catch (err: any) {
      console.error("Full Error:", err);
      setError("Gagal memuat data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeYear) return;
    try {
      await addDocument(COLLECTION_NAME, formData);
      setFormData(initialFormData);
      setFormData((prev) => ({ ...prev, academicYearId: activeYear.id }));
      setIsFormOpen(false);
      await fetchData();
    } catch (err) {
      setError("Gagal menambahkan Jadwal.");
    }
  };

  const getName = (id: string, list: { id: string; name: string }[]) =>
    list.find((item) => item.id === id)?.name || "N/A";

  const getTeacherName = (id: string) =>
    teachers.find((t) => t.uid === id)?.nama || "N/A";

  if (isLoading) return <div className="p-4 text-zinc-400">Memuat data...</div>;

  return (
    <div className="p-2">
      <h1 className="text-3xl font-bold mb-2 text-zinc-100">
        Manajemen Jadwal Pelajaran
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 text-red-400 rounded border border-red-900/50">
          {error}
        </div>
      )}

      <p className="text-sm text-zinc-400 mb-6">
        Tahun Ajaran Aktif:{" "}
        <span className="font-bold text-orange-500">
          {activeYear?.name || "TIDAK ADA"}
        </span>
      </p>

      <button
        onClick={() => setIsFormOpen(!isFormOpen)}
        className="bg-orange-600 text-white px-4 py-2.5 rounded-lg flex items-center mb-6 hover:bg-orange-500 transition shadow-lg shadow-orange-900/20 font-medium disabled:opacity-50"
        disabled={!activeYear}
      >
        <PlusCircle className="w-5 h-5 mr-2" />
        {isFormOpen ? "Tutup Form" : "Tambah Jadwal Baru"}
      </button>

      {isFormOpen && activeYear && (
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4 text-zinc-200 border-b border-zinc-800 pb-2">
            Form Jadwal
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end"
          >
            <div className="col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Kelas
              </label>
              <select
                name="classId"
                value={formData.classId}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none"
                required
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Mapel
              </label>
              <select
                name="subjectId"
                value={formData.subjectId}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none"
                required
              >
                <option value="">-- Pilih Mapel --</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Guru
              </label>
              <select
                name="teacherId"
                value={formData.teacherId}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none"
                required
              >
                <option value="">-- Pilih Guru --</option>
                {teachers.map((t) => (
                  <option key={t.uid} value={t.uid}>
                    {t.nama}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Hari
              </label>
              <select
                name="day"
                value={formData.day}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none"
                required
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Mulai
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Selesai
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Ruang
              </label>
              <select
                name="room"
                value={formData.room}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none"
              >
                {ROOMS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="col-span-2 bg-green-600 text-white p-3 rounded-lg flex items-center justify-center hover:bg-green-500 transition font-medium"
            >
              <Save className="w-5 h-5 mr-2" /> Simpan Jadwal
            </button>
          </form>
        </div>
      )}

      <div className="overflow-x-auto bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg overflow-hidden">
        {schedules.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 italic">
            Belum ada jadwal untuk tahun ajaran ini.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-950/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Hari/Waktu
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Kelas
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Mata Pelajaran
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Guru
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Ruang
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {schedules
                .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day))
                .map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-200">
                      <span className="font-bold text-orange-500">{s.day}</span>
                      <br />
                      <span className="text-xs text-zinc-500">
                        {s.startTime} - {s.endTime}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {getName(s.classId, classes)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300 font-medium">
                      {getName(s.subjectId, subjects)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {getTeacherName(s.teacherId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 bg-zinc-950/30 text-center">
                      {s.room}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
