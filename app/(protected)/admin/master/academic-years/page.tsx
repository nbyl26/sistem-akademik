"use client";

import React, { useState, useEffect } from "react";
import {
  addDocument,
  getAllDocuments,
  updateDocument,
  deleteDocument,
} from "@/lib/firestore";
import { AcademicYear } from "@/types/master";
import {
  PlusCircle,
  Save,
  CheckCircle,
  Clock,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<AcademicYear, "id">>({
    name: "",
    startDate: "",
    endDate: "",
    isActive: false,
  });

  const COLLECTION_NAME = "academic_years";

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getAllDocuments<AcademicYear>(COLLECTION_NAME);
      setYears(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data Tahun Ajaran.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEdit = (year: AcademicYear) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setFormData({
      name: year.name,
      startDate: year.startDate,
      endDate: year.endDate,
      isActive: year.isActive,
    });
    setEditId(year.id);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setIsEditing(false);
    setEditId(null);
    setFormData({ name: "", startDate: "", endDate: "", isActive: false });
  };

  const handleDelete = async (id: string, name: string, isActive: boolean) => {
    if (isActive) {
      alert("Tidak dapat menghapus tahun ajaran yang sedang aktif!");
      return;
    }

    if (!confirm(`Yakin ingin menghapus tahun ajaran "${name}"?`)) return;

    try {
      await deleteDocument(COLLECTION_NAME, id);
      alert("Tahun ajaran berhasil dihapus!");
      await fetchData();
    } catch (err) {
      alert("Gagal menghapus tahun ajaran.");
    }
  };

  const checkDuplicateName = (): string | null => {
    const { name } = formData;
    const nameExists = years.some((year) => {
      if (isEditing && editId === year.id) {
        return false;
      }
      return year.name.toLowerCase() === name.toLowerCase();
    });

    if (nameExists) {
      return `Tahun ajaran "${name}" sudah ada. Gunakan nama yang berbeda.`;
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

    if (formData.startDate >= formData.endDate) {
      setError("Tanggal mulai harus lebih awal dari tanggal selesai.");
      return;
    }

    try {
      if (isEditing && editId) {
        if (formData.isActive) {
          const activeYear = years.find((y) => y.isActive && y.id !== editId);
          if (activeYear && activeYear.id) {
            await updateDocument(COLLECTION_NAME, activeYear.id, {
              isActive: false,
            });
          }
        }
        await updateDocument(COLLECTION_NAME, editId, formData);
        alert("Tahun ajaran berhasil diperbarui!");
      } else {
        if (formData.isActive) {
          const activeYear = years.find((y) => y.isActive);
          if (activeYear && activeYear.id) {
            await updateDocument(COLLECTION_NAME, activeYear.id, {
              isActive: false,
            });
          }
        }
        await addDocument(COLLECTION_NAME, formData);
        alert("Tahun ajaran berhasil ditambahkan!");
      }
      handleClose();
      setError(null);
      await fetchData();
    } catch (err) {
      setError(
        isEditing
          ? "Gagal memperbarui tahun ajaran."
          : "Gagal menambahkan tahun ajaran."
      );
    }
  };

  const handleSetActive = async (yearId: string) => {
    if (!confirm("Yakin ingin mengaktifkan tahun ajaran ini?")) return;

    try {
      const activeYear = years.find((y) => y.isActive);
      if (activeYear && activeYear.id) {
        await updateDocument(COLLECTION_NAME, activeYear.id, {
          isActive: false,
        });
      }
      await updateDocument(COLLECTION_NAME, yearId, { isActive: true });
      alert("Tahun ajaran berhasil diaktifkan!");
      await fetchData();
    } catch (err) {
      setError("Gagal mengubah status aktif.");
    }
  };

  if (isLoading) return <div className="p-4 text-zinc-400">Memuat data...</div>;

  return (
    <div className="p-2">
      <h1 className="text-3xl font-bold mb-6 text-zinc-100">
        Manajemen Tahun Ajaran
      </h1>

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
            <PlusCircle className="w-5 h-5 mr-2" /> Tambah Tahun Ajaran
          </>
        )}
      </button>

      {isFormOpen && (
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg mb-8 animate-in fade-in slide-in-from-top-2">
          <h2 className="text-xl font-semibold mb-4 text-zinc-200 border-b border-zinc-800 pb-2 flex items-center">
            {isEditing ? (
              <>
                <Pencil className="w-5 h-5 mr-2 text-orange-500" /> Edit Tahun
                Ajaran
              </>
            ) : (
              "Form Tambah Tahun Ajaran"
            )}
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
          >
            <div className="col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Nama Tahun Ajaran
              </label>
              <input
                type="text"
                name="name"
                placeholder="Contoh: 2025/2026 Ganjil"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Tanggal Selesai
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white p-3 rounded-lg flex items-center justify-center hover:bg-green-500 transition font-medium shadow-lg shadow-green-900/20"
            >
              <Save className="w-5 h-5 mr-2" />{" "}
              {isEditing ? "Update" : "Simpan"}
            </button>
          </form>

          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 text-orange-600 bg-zinc-950 border-zinc-800 rounded focus:ring-orange-500 focus:ring-2"
            />
            <label
              htmlFor="isActive"
              className="ml-2 text-sm font-medium text-zinc-300"
            >
              Set sebagai Tahun Ajaran Aktif
            </label>
          </div>
        </div>
      )}

      <div className="overflow-x-auto bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-950/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Nama Tahun Ajaran
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Periode
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {years.map((year) => (
              <tr
                key={year.id}
                className="hover:bg-zinc-800/30 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap font-medium text-zinc-200">
                  {year.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-2 opacity-50" />
                    {year.startDate} - {year.endDate}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                      year.isActive
                        ? "bg-green-900/30 text-green-400 border-green-800"
                        : "bg-zinc-800 text-zinc-500 border-zinc-700"
                    }`}
                  >
                    {year.isActive ? "AKTIF" : "NON-AKTIF"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    {!year.isActive && (
                      <button
                        onClick={() => year.id && handleSetActive(year.id)}
                        className="text-green-400 hover:text-green-300 transition-colors px-3 py-1 hover:bg-green-900/20 rounded flex items-center"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" /> Aktifkan
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(year)}
                      className="text-orange-400 hover:text-orange-300 transition-colors px-3 py-1 hover:bg-orange-900/20 rounded flex items-center"
                    >
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(year.id, year.name, year.isActive)
                      }
                      className="text-red-400 hover:text-red-300 transition-colors px-3 py-1 hover:bg-red-900/20 rounded flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={year.isActive}
                      title={
                        year.isActive
                          ? "Tidak dapat menghapus tahun ajaran aktif"
                          : "Hapus tahun ajaran"
                      }
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
