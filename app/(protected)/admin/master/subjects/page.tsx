"use client";

import React, { useState, useEffect } from "react";
import { addDocument, getAllDocuments, updateDocument } from "@/lib/firestore";
import { SubjectData } from "@/types/master";
import { PlusCircle, Save, BookOpen, Pencil, X } from "lucide-react";

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Omit<SubjectData, "id">>({
    name: "",
    code: "",
  });

  const COLLECTION_NAME = "subjects";

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getAllDocuments<SubjectData>(COLLECTION_NAME);
      setSubjects(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (subject: SubjectData) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setFormData({ name: subject.name, code: subject.code });
    setEditId(subject.id); 
    setIsEditing(true);
    setIsFormOpen(true); 
  };

  const handleClose = () => {
    setIsFormOpen(false);
    setIsEditing(false);
    setEditId(null);
    setFormData({ name: "", code: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && editId) {
        await updateDocument(COLLECTION_NAME, editId, formData);
      } else {
        await addDocument(COLLECTION_NAME, formData);
      }
      handleClose();
      await fetchData();
    } catch (err) {
      setError("Gagal menyimpan data.");
    }
  };

  if (isLoading) return <div className="p-4 text-zinc-400">Memuat data...</div>;

  return (
    <div className="p-2">
      <h1 className="text-3xl font-bold mb-6 text-zinc-100">
        Manajemen Mata Pelajaran
      </h1>

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
            <PlusCircle className="w-5 h-5 mr-2" /> Tambah Mapel
          </>
        )}
      </button>

      {isFormOpen && (
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg mb-8 animate-in fade-in slide-in-from-top-2">
          <h2 className="text-xl font-semibold mb-4 text-zinc-200 border-b border-zinc-800 pb-2 flex items-center">
            {isEditing ? (
              <>
                <Pencil className="w-5 h-5 mr-2 text-orange-500" /> Edit Mata
                Pelajaran
              </>
            ) : (
              "Tambah Mata Pelajaran Baru"
            )}
          </h2>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            <div className="col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Nama Mapel
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Kode
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
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
        </div>
      )}

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 shadow-lg overflow-hidden">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-950/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                Nama Mata Pelajaran
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase">
                Kode
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-zinc-400 uppercase">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {subjects.map((subject) => (
              <tr
                key={subject.id}
                className="hover:bg-zinc-800/30 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap font-medium text-zinc-200 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-blue-500" />
                  {subject.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                  <span className="bg-zinc-950 border border-zinc-700 px-2 py-1 rounded text-xs font-mono text-zinc-300">
                    {subject.code}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(subject)}
                    className="text-orange-400 hover:text-orange-300 transition-colors flex items-center float-right px-3 py-1 hover:bg-orange-900/20 rounded"
                  >
                    <Pencil className="w-3 h-3 mr-2" /> Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
