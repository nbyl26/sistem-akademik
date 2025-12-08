import Link from "next/link";
import {
  Users,
  Book,
  Calendar,
  FileText,
  PencilLine,
  Megaphone,
  ClipboardCheck,
} from "lucide-react";

export default function AdminDashboard() {
  const cards = [
    { label: "Manajemen Akun", href: "/admin/users", icon: Users },
    { label: "Master Data", href: "/admin/master/academic-years", icon: Book },
    { label: "Jadwal Pelajaran", href: "/admin/schedule", icon: Calendar },
    { label: "Rekapitulasi", href: "/admin/recap", icon: FileText },
    {
      label: "Manajemen Nilai",
      href: "/admin/master/grading-settings",
      icon: PencilLine,
    },
    {
      label: "Pengaturan Kehadiran",
      href: "/admin/master/attendence-settings",
      icon: ClipboardCheck,
    },
    { label: "Pengumuman", href: "/admin/announcements", icon: Megaphone },
  ];

  return (
    <div className="p-2">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">
          Dashboard Admin
        </h1>
        <p className="text-zinc-400">
          Selamat datang kembali, Administrator. Sistem siap digunakan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="block group">
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-800/50 transition-all duration-300 shadow-lg shadow-black/50">
              <div className="bg-orange-500/10 w-14 h-14 rounded-xl flex items-center justify-center text-orange-500 mb-4 group-hover:scale-110 transition-transform duration-300">
                <card.icon size={28} />
              </div>
              <h3 className="text-lg font-bold text-zinc-100 group-hover:text-orange-500 transition-colors">
                {card.label}
              </h3>
              <p className="text-sm text-zinc-500 mt-2">Kelola data sistem</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
