import Link from "next/link";
import { Siswa } from "@/types/user";
import { Calendar, ClipboardCheck, Award, User } from "lucide-react";

export default function SiswaDashboard({ user }: { user: Siswa }) {
  return (
    <div className="p-2">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">
          Halo, {user.nama}!
        </h1>
        <p className="text-zinc-400">
          Selamat datang di Portal Siswa.{" "}
          <span className="text-orange-500 font-semibold">NIS: {user.nis}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/student/schedule" className="group block">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800/50 transition-all duration-300 h-full shadow-lg">
            <div className="bg-blue-500/10 w-14 h-14 rounded-xl flex items-center justify-center text-blue-500 mb-4">
              <Calendar size={28} />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 group-hover:text-blue-400">
              Jadwal
            </h3>
            <p className="text-sm text-zinc-500 mt-2">Cek mata pelajaran</p>
          </div>
        </Link>

        <Link href="/student/attendance" className="group block">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800/50 transition-all duration-300 h-full shadow-lg">
            <div className="bg-green-500/10 w-14 h-14 rounded-xl flex items-center justify-center text-green-500 mb-4">
              <ClipboardCheck size={28} />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 group-hover:text-green-400">
              Absensi
            </h3>
            <p className="text-sm text-zinc-500 mt-2">Riwayat kehadiran</p>
          </div>
        </Link>

        <Link href="/student/grades" className="group block">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800/50 transition-all duration-300 h-full shadow-lg">
            <div className="bg-yellow-500/10 w-14 h-14 rounded-xl flex items-center justify-center text-yellow-500 mb-4">
              <Award size={28} />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 group-hover:text-yellow-400">
              Nilai Rapor
            </h3>
            <p className="text-sm text-zinc-500 mt-2">Hasil belajar Anda</p>
          </div>
        </Link>

        <Link href="/student/profile" className="group block">
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800/50 transition-all duration-300 h-full shadow-lg">
            <div className="bg-purple-500/10 w-14 h-14 rounded-xl flex items-center justify-center text-purple-500 mb-4">
              <User size={28} />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 group-hover:text-purple-400">
              Profil
            </h3>
            <p className="text-sm text-zinc-500 mt-2">Data diri siswa</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
