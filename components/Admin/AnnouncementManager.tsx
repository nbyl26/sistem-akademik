"use client";

import React, { useState } from "react";
import { addDocument, deleteDocument } from "@/lib/firestore";
import { AnnouncementData } from "@/types/master";
import {
  Send,
  Megaphone,
  Clock,
  User as UserIcon,
  Trash2,
  PlusCircle,
  X,
} from "lucide-react";

interface Props {
  initialAnnouncements: AnnouncementData[];
  adminName: string;
  adminId: string;
}

type NewAnnouncement = Omit<AnnouncementData, "id">;

export default function AdminAnnouncementManager({
  initialAnnouncements,
  adminName,
  adminId,
}: Props) {
  const [announcements, setAnnouncements] =
    useState<AnnouncementData[]>(initialAnnouncements);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newPost: NewAnnouncement = {
        title,
        content,
        authorId: adminId,
        authorName: adminName,
        date: new Date().toISOString(),
        targetRole: "all",
      };
      const docId = await addDocument("announcements", newPost);

      const newAnnouncement: AnnouncementData = {
        id: docId,
        ...newPost,
      };
      setAnnouncements([newAnnouncement, ...announcements]);

      alert("Pengumuman berhasil diposting!");
      setTitle("");
      setContent("");
      setIsFormOpen(false);
    } catch (error) {
      alert("Gagal memposting pengumuman.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Yakin ingin menghapus pengumuman "${title}"?`)) return;

    try {
      await deleteDocument("announcements", id);
      setAnnouncements(announcements.filter((a) => a.id !== id));
      alert("Pengumuman berhasil dihapus!");
    } catch (error) {
      alert("Gagal menghapus pengumuman.");
      console.error(error);
    }
  };

  return (
    <div className="p-2 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-zinc-100">
        Manajemen Pengumuman
      </h1>

      <button
        onClick={() => setIsFormOpen(!isFormOpen)}
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
            <PlusCircle className="w-5 h-5 mr-2" /> Buat Pengumuman Baru
          </>
        )}
      </button>

      {isFormOpen && (
        <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg mb-8 animate-in fade-in slide-in-from-top-2">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-orange-500 border-b border-zinc-800 pb-2">
            <Megaphone className="w-5 h-5 mr-2" /> Form Pengumuman Baru
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Judul Pengumuman
              </label>
              <input
                type="text"
                placeholder="Contoh: Libur Semester Ganjil 2025"
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none placeholder:text-zinc-600"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">
                Isi Pengumuman
              </label>
              <textarea
                placeholder="Tuliskan isi pengumuman di sini..."
                rows={5}
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none placeholder:text-zinc-600 resize-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2.5 rounded-lg flex items-center hover:bg-green-500 transition disabled:opacity-50 font-medium shadow-lg shadow-green-900/20"
              >
                <Send className="w-4 h-4 mr-2" />
                {loading ? "Mengirim..." : "Posting Pengumuman"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4 mt-8">
        <h3 className="text-xl font-bold text-zinc-300 mb-4 flex items-center">
          <Megaphone className="w-5 h-5 mr-2 text-orange-500" />
          Daftar Pengumuman ({announcements.length})
        </h3>
        {announcements.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900 border border-zinc-800 rounded-xl">
            <Megaphone className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
            <p className="text-zinc-500 font-medium">Belum ada pengumuman.</p>
            <p className="text-zinc-600 text-sm mt-2">
              Klik tombol "Buat Pengumuman Baru" untuk menambahkan.
            </p>
          </div>
        ) : (
          announcements.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg hover:border-orange-500/30 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-bold text-zinc-100">
                  {item.title}
                </h4>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 flex items-center bg-zinc-950 px-2 py-1 rounded">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(item.date).toLocaleDateString("id-ID")}
                  </span>
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="text-red-400 hover:text-red-300 transition-colors p-2 hover:bg-red-900/20 rounded"
                    title="Hapus pengumuman"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-zinc-400 whitespace-pre-wrap mb-4 leading-relaxed">
                {item.content}
              </p>
              <div className="border-t border-zinc-800 pt-3 flex items-center text-xs text-orange-500 font-medium">
                <UserIcon className="w-3 h-3 mr-1" /> Posted by:{" "}
                {item.authorName}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
