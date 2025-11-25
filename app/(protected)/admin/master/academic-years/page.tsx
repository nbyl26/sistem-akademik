"use client";

import React, { useState, useEffect } from "react";
import { addDocument, getAllDocuments, updateDocument } from "@/lib/firestore";
import { AcademicYear } from "@/types/master";
import { PlusCircle, Save, CheckCircle, Clock } from "lucide-react";

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDocument(COLLECTION_NAME, formData);
      setFormData({ name: "", startDate: "", endDate: "", isActive: false });
      setIsFormOpen(false);
      await fetchData();
    } catch (err) {
      setError("Gagal menambahkan Tahun Ajaran.");
    }
  };

  const handleSetActive = async (yearId: string) => {
    try {
      const activeYear = years.find((y) => y.isActive);
      if (activeYear && activeYear.id) {
        await updateDocument(COLLECTION_NAME, activeYear.id, {
          isActive: false,
        });
      }
      await updateDocument(COLLECTION_NAME, yearId, { isActive: true });
      await fetchData();
    } catch (err) {
      setError("Gagal mengubah status aktif.");
    }
  };

  if (isLoading) return <div className="p-4 text-zinc-400">Memuat data...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-2">
      <h1 className="text-3xl font-bold mb-6 text-zinc-100">
        Manajemen Tahun Ajaran
      </h1>

      <button
        onClick={() => setIsFormOpen(!isFormOpen)}
        className="bg-orange-600 text-white px-4 py-2.5 rounded-lg flex items-center mb-6 hover:bg-orange-500 transition shadow-lg shadow-orange-900/20 font-medium"
      >
        <PlusCircle className="w-5 h-5 mr-2" />
        {isFormOpen ? "Tutup Form" : "Tambah Baru"}
      </button>

      {isFormOpen && (
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4 text-zinc-200 border-b border-zinc-800 pb-2">
            Form Tambah Tahun Ajaran
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
                Mulai
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
                Selesai
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
              className="bg-green-600 text-white p-3 rounded-lg flex items-center justify-center hover:bg-green-500 transition font-medium"
            >
              <Save className="w-5 h-5 mr-2" /> Simpan
            </button>
          </form>
        </div>
      )}

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg overflow-hidden">
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
                  {!year.isActive && (
                    <button
                      onClick={() => year.id && handleSetActive(year.id)}
                      className="text-indigo-400 hover:text-indigo-300 flex items-center float-right transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Set Aktif
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
