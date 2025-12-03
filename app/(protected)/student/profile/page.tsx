import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCookie } from "@/lib/cookies";
import { mapUserRole } from "@/lib/map";
import { Siswa, Guru, User } from "@/types/user";
import { ClassData, AcademicYear } from "@/types/master";
import { getAllDocuments, getActiveAcademicYear } from "@/lib/firestore";
import { notFound } from "next/navigation";
import {
  User as UserIcon,
  Mail,
  Clock,
  Hash,
  Users,
  Award,
  Calendar,
  Shield,
  GraduationCap,
} from "lucide-react";

export default async function StudentProfilePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return redirect("/login");
  const verifiedUser = await verifyCookie(token);
  if (!verifiedUser) {
    return redirect("/api/auth/logout");
  }
  const user: User | null = await mapUserRole(verifiedUser);
  if (!user || user.role !== "siswa") {
    return notFound();
  }
  const studentUser = user as Siswa;

  try {
    const [activeYear, classes, teachers] = await Promise.all([
      getActiveAcademicYear(),
      getAllDocuments<ClassData>("classes"),
      getAllDocuments<Guru>("users", [["role", "==", "guru"]]),
    ]);

    const studentClass = classes.find((c) => c.id === studentUser.kelasId);
    const studentClassName = studentClass?.name || "Belum Ditentukan";

    const waliKelas = studentClass?.waliKelasId
      ? teachers.find((t) => t.uid === studentClass.waliKelasId)
      : null;

    return (
      <div className="p-2">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-zinc-100">
            Profil Siswa
          </h1>
          <p className="text-zinc-400">
            Informasi lengkap tentang data diri dan kelas Anda
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 relative overflow-hidden mb-6">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-orange-600"></div>

            {/* Profile Header */}
            <div className="p-8 border-b border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 ring-4 ring-zinc-800">
                    <UserIcon className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-zinc-900 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-zinc-100 mb-2">
                    {studentUser.nama}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-orange-900/30 text-orange-400 text-xs font-bold uppercase rounded-full border border-orange-800">
                      <Award className="w-3 h-3 inline mr-1" />
                      {studentUser.role}
                    </span>
                    <span className="px-3 py-1.5 bg-blue-900/30 text-blue-400 text-xs font-bold uppercase rounded-full border border-blue-800">
                      <Users className="w-3 h-3 inline mr-1" />
                      {studentClassName}
                    </span>
                    <span className="px-3 py-1.5 bg-green-900/30 text-green-400 text-xs font-bold uppercase rounded-full border border-green-800">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Aktif
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-8">
              <h3 className="text-lg font-bold text-zinc-300 mb-6 flex items-center">
                <UserIcon className="w-5 h-5 mr-2 text-orange-500" />
                Informasi Pribadi
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <div className="flex items-center p-4 bg-zinc-950 rounded-lg border border-zinc-800 hover:border-orange-500/50 transition-all">
                    <div className="w-10 h-10 bg-orange-900/20 rounded-lg flex items-center justify-center mr-4 group-hover:bg-orange-900/30 transition-colors">
                      <Hash className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500 mb-1">
                        Nomor Induk Siswa
                      </p>
                      <p className="text-zinc-200 font-mono font-semibold">
                        {studentUser.nis}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="group">
                  <div className="flex items-center p-4 bg-zinc-950 rounded-lg border border-zinc-800 hover:border-orange-500/50 transition-all">
                    <div className="w-10 h-10 bg-blue-900/20 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-900/30 transition-colors">
                      <Mail className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500 mb-1">Email</p>
                      <p className="text-zinc-200 font-medium break-all">
                        {studentUser.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tahun Ajaran */}
                <div className="group md:col-span-2">
                  <div className="flex items-center p-4 bg-zinc-950 rounded-lg border border-zinc-800 hover:border-orange-500/50 transition-all">
                    <div className="w-10 h-10 bg-green-900/20 rounded-lg flex items-center justify-center mr-4 group-hover:bg-green-900/30 transition-colors">
                      <Clock className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-zinc-500 mb-1">
                        Tahun Ajaran Aktif
                      </p>
                      <p className="text-orange-400 font-bold text-lg">
                        {activeYear?.name || "Belum Diatur"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Class Information Card */}
          <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg mb-6">
            <div className="flex items-center mb-6 pb-4 border-b border-zinc-800">
              <div className="w-10 h-10 bg-blue-900/20 rounded-lg flex items-center justify-center mr-3">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-200">
                  Informasi Kelas
                </h3>
                <p className="text-xs text-zinc-500">
                  Detail kelas dan wali kelas
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-2">Kelas</p>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center mr-3">
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-zinc-100 font-bold text-lg">
                    {studentClassName}
                  </p>
                </div>
                {studentClass && (
                  <p className="text-xs text-zinc-600 mt-2">
                    Level: {studentClass.level}
                  </p>
                )}
              </div>

              {/* Wali Kelas */}
              <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
                <p className="text-xs text-zinc-500 mb-2">Wali Kelas</p>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center mr-3">
                    <UserIcon className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-zinc-100 font-bold">
                      {waliKelas?.nama || "Belum Ditentukan"}
                    </p>
                    {waliKelas && (
                      <p className="text-xs text-zinc-600">
                        NIP: {waliKelas.nip}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-950/30 p-4 rounded-xl border border-blue-800/50">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-xs text-blue-400 mb-1">Kelas</p>
              <p className="text-2xl font-bold text-blue-200">
                {studentClassName}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-900/30 to-orange-950/30 p-4 rounded-xl border border-orange-800/50">
              <div className="flex items-center justify-between mb-2">
                <Hash className="w-8 h-8 text-orange-400" />
              </div>
              <p className="text-xs text-orange-400 mb-1">NIS</p>
              <p className="text-xl font-bold text-orange-200 font-mono">
                {studentUser.nis}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-900/30 to-green-950/30 p-4 rounded-xl border border-green-800/50">
              <div className="flex items-center justify-between mb-2">
                <GraduationCap className="w-8 h-8 text-green-400" />
              </div>
              <p className="text-xs text-green-400 mb-1">Status</p>
              <p className="text-sm font-bold text-green-200">Siswa Aktif</p>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error memuat profil siswa:", error);
    return <div className="p-4 text-red-500">Error memuat data profil.</div>;
  }
}
