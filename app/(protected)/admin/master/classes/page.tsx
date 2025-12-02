"use client";

import React, { useState, useEffect } from "react";
import {
  addDocument,
  getAllDocuments,
  updateDocument,
  deleteDocument,
} from "@/lib/firestore";
import { ClassData } from "@/types/master";
import { Guru } from "@/types/user";
import { PlusCircle, Save, Zap, Pencil, X, Trash2 } from "lucide-react";

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<Guru[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<ClassData, "id">>({
    name: "",
    level: 10,
    waliKelasId: null,
  });

  const COLLECTION_NAME = "classes";

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [classData, teacherData] = await Promise.all([
        getAllDocuments<ClassData>(COLLECTION_NAME),
        getAllDocuments<Guru>("users", [["role", "==", "guru"]]),
      ]);

      setClasses(classData);
      setTeachers(teacherData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data Kelas/Guru.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "level" ? parseInt(value) : value === "" ? null : value,
    }));
  };

  const handleEdit = (cls: ClassData) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setFormData({
      name: cls.name,
      level: cls.level,
      waliKelasId: cls.waliKelasId,
    });
    setEditId(cls.id);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setIsEditing(false);
    setEditId(null);
    setFormData({ name: "", level: 10, waliKelasId: null });
    setError(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus kelas "${name}"?`)) return;

    try {
      await deleteDocument(COLLECTION_NAME, id);
      alert("Kelas berhasil dihapus!");
      await fetchData();
    } catch (err) {
      alert("Gagal menghapus kelas.");
      console.error(err);
    }
  };

  const checkDuplicateName = (): string | null => {
    const { name } = formData;
    const nameExists = classes.some((cls) => {
      if (isEditing && editId === cls.id) {
        return false;
      }
      return cls.name.toLowerCase() === name.toLowerCase();
    });

    if (nameExists) {
      return `Kelas "${name}" sudah ada. Gunakan nama yang berbeda.`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const duplicateError = checkDuplicateName();
    if (duplicateError) {
      setError(duplicateError);
      return;
    }

    try {
      if (isEditing && editId) {
        await updateDocument(COLLECTION_NAME, editId, formData);
        alert("Kelas berhasil diperbarui!");
      } else {
        await addDocument(COLLECTION_NAME, formData);
        alert("Kelas berhasil ditambahkan!");
      }
      handleClose();
      await fetchData();
    } catch (err) {
      setError("Gagal menyimpan data Kelas.");
    }
  };

  const getWaliKelasName = (waliId: string | null) => {
    if (!waliId) return "Belum Ditunjuk";
    const guru = teachers.find((t) => t.uid === waliId);
    return guru ? guru.nama : "Guru Tidak Ditemukan";
  };

  if (isLoading) return <div className="p-4 text-zinc-400">Memuat data...</div>;

  return (
    <div className="p-2">
      <h1 className="text-3xl font-bold mb-6 text-zinc-100">Manajemen Kelas</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="text-red-400">
            <p className="font-medium">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <button
        onClick={() => (isFormOpen ? handleClose() : setIsFormOpen(true))}
        className={`px-4 py-2.5 rounded-lg flex items-center mb-6 transition font-medium shadow-lg ${
          isFormOpen
            ? "bg-zinc-700 text-zinc-200 hover:bg-zinc-600"
            : "bg-orange-600 text-white hover:bg-orange-500"
        }`}
      >
        {isFormOpen ? (
          <>
            <X className="w-5 h-5 mr-2" /> Batal
          </>
        ) : (
          <>
            <PlusCircle className="w-5 h-5 mr-2" /> Tambah Kelas
          </>
        )}
      </button>

      {isFormOpen && (
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg mb-8 animate-in fade-in slide-in-from-top-2">
          <h2 className="text-xl font-semibold mb-4 text-zinc-200 border-b border-zinc-800 pb-2 flex items-center">
            {isEditing ? (
              <>
                <Pencil className="w-5 h-5 mr-2 text-orange-500" /> Edit Kelas
              </>
            ) : (
              "Form Tambah Kelas"
            )}
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
          >
            <div className="col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Nama Kelas
              </label>
              <input
                type="text"
                name="name"
                placeholder="Contoh: X RPL 1"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Tingkat
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none"
              >
                <option value={10}>Level 10</option>
                <option value={11}>Level 11</option>
                <option value={12}>Level 12</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Wali Kelas
              </label>
              <select
                name="waliKelasId"
                value={formData.waliKelasId || ""}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none"
              >
                <option value="">-- Pilih Wali Kelas --</option>
                {teachers.map((t) => (
                  <option key={t.uid} value={t.uid}>
                    {t.nama}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white p-3 rounded-lg flex items-center justify-center hover:bg-green-500 transition font-medium shadow-lg shadow-green-900/20"
            >
              <Save className="w-5 h-5 mr-2" />{" "}
              {isEditing ? "Update" : "Simpan"}
            </button>
          </form>
        </div>
      )}

      <div className="overflow-x-auto bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-950/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Nama Kelas
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Level
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Wali Kelas
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {classes.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-zinc-200 flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-orange-500" />
                  {c.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                  {c.level}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                  {getWaliKelasName(c.waliKelasId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(c)}
                      className="text-orange-400 hover:text-orange-300 transition-colors px-3 py-1 hover:bg-orange-900/20 rounded flex items-center"
                    >
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c.name)}
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
    </div>
  );
}
