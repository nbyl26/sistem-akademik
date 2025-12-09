"use client";

import {
  Calendar,
  ClipboardCheck,
  DollarSign,
  Megaphone,
  FileText,
  Award,
  User,
} from "lucide-react";
import Link from "next/link";

export default function GuruDashboard() {
  return (
    <div className="p-2">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">
          Dashboard Guru
        </h1>
        <p className="text-zinc-400">
          Selamat mengajar! Akses menu cepat untuk kegiatan akademik Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Menu 1: Jadwal */}
        <Link href="/teacher/schedule" className="group block">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800/50 transition-all duration-300 h-full shadow-lg">
            <div className="bg-orange-500/10 w-14 h-14 rounded-xl flex items-center justify-center text-orange-500 mb-4">
              <Calendar size={28} />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 group-hover:text-orange-400">
              Jadwal Mengajar
            </h3>
            <p className="text-sm text-zinc-500 mt-2">Cek kelas hari ini</p>
          </div>
        </Link>

        {/* Menu 2: Absensi */}
        <Link href="/teacher/attendance" className="group block">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800/50 transition-all duration-300 h-full shadow-lg">
            <div className="bg-orange-500/10 w-14 h-14 rounded-xl flex items-center justify-center text-orange-500 mb-4">
              <ClipboardCheck size={28} />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 group-hover:text-orange-400">
              Input Absensi
            </h3>
            <p className="text-sm text-zinc-500 mt-2">Catat kehadiran siswa</p>
          </div>
        </Link>

        {/* Menu 3: Input Nilai */}
        <Link href="/teacher/grades" className="group block">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800/50 transition-all duration-300 h-full shadow-lg">
            <div className="bg-orange-500/10 w-14 h-14 rounded-xl flex items-center justify-center text-orange-500 mb-4">
              <DollarSign size={28} />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 group-hover:text-orange-400">
              Input Nilai
            </h3>
            <p className="text-sm text-zinc-500 mt-2">Masukan nilai ujian</p>
          </div>
        </Link>

        {/* Menu 4: Rekap Nilai (BARU) */}
        <Link href="/teacher/grade-recap" className="group block">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800/50 transition-all duration-300 h-full shadow-lg">
            <div className="bg-orange-500/10 w-14 h-14 rounded-xl flex items-center justify-center text-orange-500 mb-4">
              <Award size={28} />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 group-hover:text-orange-400">
              Rekap Nilai
            </h3>
            <p className="text-sm text-zinc-500 mt-2">Lihat nilai siswa</p>
          </div>
        </Link>

        {/* Menu 5: Pengumuman */}
        <Link href="/teacher/announcements" className="group block">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800/50 transition-all duration-300 h-full shadow-lg">
            <div className="bg-orange-500/10 w-14 h-14 rounded-xl flex items-center justify-center text-orange-500 mb-4">
              <Megaphone size={28} />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 group-hover:text-orange-400">
              Pengumuman
            </h3>
            <p className="text-sm text-zinc-500 mt-2">Info untuk siswa</p>
          </div>
        </Link>

        {/* Menu 6: Rekap Absensi */}
        <Link href="/teacher/recap" className="group block">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800/50 transition-all duration-300 h-full shadow-lg">
            <div className="bg-orange-500/10 w-14 h-14 rounded-xl flex items-center justify-center text-orange-500 mb-4">
              <FileText size={28} />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 group-hover:text-orange-400">
              Rekap Absensi
            </h3>
            <p className="text-sm text-zinc-500 mt-2">Cetak laporan absensi</p>
          </div>
        </Link>

        {/* Menu 7: Profil */}
        <Link href="/teacher/profile" className="group block">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800/50 transition-all duration-300 h-full shadow-lg">
            <div className="bg-orange-500/10 w-14 h-14 rounded-xl flex items-center justify-center text-orange-500 mb-4">
              <User size={28} />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 group-hover:text-orange-400">
              Profil
            </h3>
            <p className="text-sm text-zinc-500 mt-2">Data diri guru</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
