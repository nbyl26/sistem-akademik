import Link from "next/link";
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* --- Navbar Sederhana --- */}
      <header className="border-b border-zinc-800 py-6">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight">
              Simak<span className="text-orange-500">Cihuy</span>
            </span>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Login Area
          </Link>
        </div>
      </header>

      {/* --- Hero Section --- */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="inline-flex items-center px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="flex h-2 w-2 rounded-full bg-orange-500 mr-2"></span>
          Sistem Akademik Terintegrasi Versi 1.0
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent max-w-4xl">
          Kelola Akademik Sekolah <br /> Tanpa Batas.
        </h1>

        <p className="text-lg text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          Platform manajemen sekolah modern untuk Admin, Guru, dan Siswa.
          Memantau absensi, nilai, dan jadwal pelajaran kini lebih mudah, cepat,
          dan transparan.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="bg-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center hover:bg-orange-500 transition-all shadow-lg shadow-orange-900/20 active:scale-95"
          >
            <GraduationCap className="w-6 h-6 mr-2" />
            Masuk ke Portal
          </Link>
          <a
            href="#features"
            className="bg-zinc-900 text-zinc-300 border border-zinc-800 px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center hover:bg-zinc-800 transition-all active:scale-95"
          >
            Pelajari Fitur
          </a>
        </div>
      </main>

      {/* --- Features Grid --- */}
      <section
        id="features"
        className="py-20 bg-zinc-900/50 border-t border-zinc-800"
      >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-orange-500/30 transition-colors">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Data Aman & Terpusat</h3>
            <p className="text-zinc-400">
              Semua data siswa dan guru tersimpan aman di cloud dengan enkripsi
              tingkat tinggi.
            </p>
          </div>
          {/* Feature 2 */}
          <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-orange-500/30 transition-colors">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Real-time Update</h3>
            <p className="text-zinc-400">
              Input nilai dan absensi langsung tersinkronisasi. Siswa dapat
              melihat hasil detik itu juga.
            </p>
          </div>
          {/* Feature 3 */}
          <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-orange-500/30 transition-colors">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold mb-2">Multi-Role Access</h3>
            <p className="text-zinc-400">
              Dashboard khusus yang disesuaikan untuk kebutuhan Admin, Guru, dan
              Siswa.
            </p>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="py-8 border-t border-zinc-800 text-center text-zinc-600 text-sm">
        <p>
          &copy; {new Date().getFullYear()} Simak Cihuy Academic System. Built
          with Next.js & Firebase.
        </p>
      </footer>
    </div>
  );
}
