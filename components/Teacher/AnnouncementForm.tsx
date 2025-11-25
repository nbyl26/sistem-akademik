"use client";
import React, { useState } from "react";
import { addDocument } from "@/lib/firestore";
import { AnnouncementData } from "@/types/master";
import { Send, Megaphone } from "lucide-react";

interface AnnouncementFormProps {
  authorId: string;
  authorName: string;
}
type NewAnnouncement = Omit<AnnouncementData, "id">;

export default function AnnouncementForm({
  authorId,
  authorName,
}: AnnouncementFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newPost: NewAnnouncement = {
        title,
        content,
        authorId,
        authorName,
        date: new Date().toISOString(),
        targetRole: "all",
      };
      await addDocument("announcements", newPost);
      alert("Pengumuman berhasil diposting!");
      setTitle("");
      setContent("");
      window.location.reload();
    } catch (error) {
      alert("Gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg">
      <h2 className="text-lg font-semibold mb-4 flex items-center text-orange-500">
        <Megaphone className="w-5 h-5 mr-2" /> Buat Pengumuman Baru
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Judul Pengumuman"
          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none placeholder:text-zinc-600"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Isi pengumuman..."
          rows={3}
          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none placeholder:text-zinc-600"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg flex items-center hover:bg-orange-500 transition disabled:opacity-50 font-medium"
          >
            <Send className="w-4 h-4 mr-2" />{" "}
            {loading ? "Mengirim..." : "Posting"}
          </button>
        </div>
      </form>
    </div>
  );
}
