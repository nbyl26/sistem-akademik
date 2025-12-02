"use client";

import React, { useState, useEffect } from "react";
import {
  addDocument,
  getAllDocuments,
  getActiveAcademicYear,
  updateDocument,
  deleteDocument,
} from "@/lib/firestore";
import {
  ScheduleData,
  ClassData,
  SubjectData,
  AcademicYear,
} from "@/types/master";
import { Guru } from "@/types/user";
import { Calendar, Save, PlusCircle, Pencil, Trash2, X } from "lucide-react";

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
  const [selectedDay, setSelectedDay] = useState<string>("Senin");
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

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

  const handleEdit = (schedule: ScheduleData) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setFormData({
      academicYearId: schedule.academicYearId,
      classId: schedule.classId,
      subjectId: schedule.subjectId,
      teacherId: schedule.teacherId,
      day: schedule.day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      room: schedule.room,
    });
    setEditId(schedule.id!);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setIsEditing(false);
    setEditId(null);
    setFormData(initialFormData);
    if (activeYear) {
      setFormData((prev) => ({ ...prev, academicYearId: activeYear.id! }));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus jadwal ini?")) return;

    try {
      await deleteDocument(COLLECTION_NAME, id);
      alert("Jadwal berhasil dihapus!");
      await fetchData();
    } catch (err) {
      alert("Gagal menghapus jadwal.");
    }
  };

  const checkScheduleConflict = (): string | null => {
    const { room, day, startTime, endTime } = formData;

    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    for (const schedule of schedules) {
      if (isEditing && schedule.id === editId) continue;

      if (schedule.room === room && schedule.day === day) {
        const existingStart = timeToMinutes(schedule.startTime);
        const existingEnd = timeToMinutes(schedule.endTime);

        if (newStart < existingEnd && newEnd > existingStart) {
          const existingSubject = getName(schedule.subjectId, subjects);
          const existingTeacher = getTeacherName(schedule.teacherId);
          return `Jadwal bentrok! ${room} sudah memiliki ${existingSubject} dengan ${existingTeacher} pada ${schedule.startTime} - ${schedule.endTime}.`;
        }
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeYear) return;

    const conflictError = checkScheduleConflict();
    if (conflictError) {
      setError(conflictError);
      return;
    }

    try {
      if (isEditing && editId) {
        await updateDocument(COLLECTION_NAME, editId, formData);
        alert("Jadwal berhasil diperbarui!");
      } else {
        await addDocument(COLLECTION_NAME, formData);
        alert("Jadwal berhasil ditambahkan!");
      }
      handleClose();
      setError(null);
      await fetchData();
    } catch (err) {
      setError(
        isEditing ? "Gagal memperbarui jadwal." : "Gagal menambahkan jadwal."
      );
    }
  };

  const getName = (id: string, list: { id: string; name: string }[]) =>
    list.find((item) => item.id === id)?.name || "N/A";

  const getTeacherName = (id: string) =>
    teachers.find((t) => t.uid === id)?.nama || "N/A";

  const filteredSchedules = schedules
    .filter((s) => s.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

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
        onClick={() => (isFormOpen ? handleClose() : setIsFormOpen(true))}
        className={`px-4 py-2.5 rounded-lg flex items-center mb-6 transition font-medium shadow-lg disabled:opacity-50 ${
          isFormOpen
            ? "bg-zinc-700 text-zinc-200 hover:bg-zinc-600"
            : "bg-orange-600 text-white hover:bg-orange-500"
        }`}
        disabled={!activeYear}
      >
        {isFormOpen ? (
          <>
            <X className="w-5 h-5 mr-2" /> Batal
          </>
        ) : (
          <>
            <PlusCircle className="w-5 h-5 mr-2" /> Tambah Jadwal Baru
          </>
        )}
      </button>

      {isFormOpen && activeYear && (
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg mb-8 animate-in fade-in slide-in-from-top-2">
          <h2 className="text-xl font-semibold mb-4 text-zinc-200 border-b border-zinc-800 pb-2 flex items-center">
            {isEditing ? (
              <>
                <Pencil className="w-5 h-5 mr-2 text-orange-500" /> Edit Jadwal
              </>
            ) : (
              "Form Tambah Jadwal"
            )}
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
              className="col-span-2 bg-green-600 text-white p-3 rounded-lg flex items-center justify-center hover:bg-green-500 transition font-medium shadow-lg shadow-green-900/20"
            >
              <Save className="w-5 h-5 mr-2" />{" "}
              {isEditing ? "Update Jadwal" : "Simpan Jadwal"}
            </button>
          </form>
        </div>
      )}

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
            Tidak ada jadwal pada hari{" "}
            <span className="text-orange-500 font-bold">{selectedDay}</span>
          </p>
          <p className="text-zinc-600 text-sm mt-2">
            Klik tombol "Tambah Jadwal Baru" untuk menambahkan jadwal.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg overflow-hidden">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-950/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Waktu
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
                <th className="px-6 py-4 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredSchedules.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-500 font-bold">
                    {s.startTime} - {s.endTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-200 font-medium">
                    {getName(s.classId, classes)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                    {getName(s.subjectId, subjects)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    {getTeacherName(s.teacherId)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                    {s.room}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(s)}
                        className="text-orange-400 hover:text-orange-300 transition-colors px-3 py-1 hover:bg-orange-900/20 rounded flex items-center"
                      >
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s.id!)}
                        className="text-red-400 hover:text-red-300 transition-colors px-3 py-1 hover:bg-red-900/20 rounded flex items-center"
                      >
                        <Trash2 className="w-3 h-3 mr-1" /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
