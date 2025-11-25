"use client";

import { User } from "@/types/user";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  Home,
  Users,
  Book,
  Clock,
  ClipboardCheck,
  DollarSign,
  Megaphone,
} from "lucide-react";

const navConfig = {
  admin: [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Manajemen Akun", href: "/admin/users", icon: Users },
    { name: "Tahun Ajaran", href: "/admin/master/academic-years", icon: Clock },
    { name: "Data Kelas", href: "/admin/master/classes", icon: Book },
    { name: "Data Mapel", href: "/admin/master/subjects", icon: Book },
    { name: "Jadwal Pelajaran", href: "/admin/schedule", icon: Clock },
    { name: "Rekapitulasi", href: "/admin/recap", icon: ClipboardCheck },
  ],
  guru: [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Jadwal Mengajar", href: "/teacher/schedule", icon: Clock },
    { name: "Input Nilai", href: "/teacher/grades", icon: DollarSign },
    {
      name: "Input Absensi",
      href: "/teacher/attendance",
      icon: ClipboardCheck,
    },
    { name: "Pengumuman", href: "/teacher/announcements", icon: Megaphone },
  ],
  siswa: [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Jadwal Pelajaran", href: "/student/schedule", icon: Clock },
    { name: "Nilai Rapor", href: "/student/grades", icon: DollarSign },
    { name: "Absensiku", href: "/student/attendance", icon: ClipboardCheck },
    { name: "Profil", href: "/student/profile", icon: Users },
  ],
};

export default function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const role = user.role as keyof typeof navConfig;
  const links = navConfig[role] || [];

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  return (
    <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col p-4 h-screen">
      {/* Logo Area */}
      <div className="mb-8 flex items-center space-x-2 px-2">
        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
          <span className="text-black font-bold text-lg">S</span>
        </div>
        <span className="text-xl font-bold text-zinc-100 tracking-tight">
          Simak<span className="text-orange-500">Cihuy</span>
        </span>
      </div>

      {/* User Profile Card */}
      <div className="mb-6 p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-xl">
        <p className="font-semibold text-zinc-100 truncate">{user.nama}</p>
        <p className="text-xs text-orange-400 font-medium uppercase tracking-wider mt-1">
          {user.role}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto space-y-1">
        {links.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center p-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              }`}
            >
              <Icon
                className={`w-5 h-5 mr-3 transition-colors ${
                  isActive
                    ? "text-orange-500"
                    : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center p-3 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-colors mt-4 border border-transparent hover:border-red-500/20"
      >
        <LogOut className="w-5 h-5 mr-3" />
        <span className="font-medium text-sm">Logout</span>
      </button>
    </div>
  );
}
