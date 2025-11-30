"use client";

import React, { useState, useEffect } from "react";
import { getAllDocuments, updateDocument } from "@/lib/firestore";
import { Guru, Siswa, User } from "@/types/user";
import { ClassData, SubjectData } from "@/types/master";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/firebase/config";
import { doc, setDoc, deleteDoc } from "firebase/firestore";

import { Save, Users, UserPlus, Book, Pencil, Trash2, X } from "lucide-react";

const COLLECTION_NAME = "users";

interface GuruForm
  extends Omit<Guru, "uid" | "role" | "academicYearId" | "kelasWaliIds"> {
  email: string;
  password: string;
  academicYearId: string;
  kelasWaliId: string | null;
}

interface SiswaForm extends Omit<Siswa, "uid" | "role" | "academicYearId"> {
  email: string;
  password: string;
  academicYearId: string;
}

export default function UserManagementPage() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [activeYearId, setActiveYearId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "guru" | "siswa">(
    "users"
  );
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editUid, setEditUid] = useState<string | null>(null);

  const initialGuruState = {
    nama: "",
    email: "",
    password: "",
    nip: "",
    academicYearId: "",
    mapelIds: [],
    kelasWaliId: null,
  };
  const [guruFormData, setGuruFormData] = useState<GuruForm>(initialGuruState);

  const initialSiswaState = {
    nama: "",
    email: "",
    password: "",
    nis: "",
    kelasId: "",
    academicYearId: "",
  };
  const [siswaFormData, setSiswaFormData] =
    useState<SiswaForm>(initialSiswaState);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const yearData = await getAllDocuments<{ id: string; isActive: boolean }>(
        "academic_years",
        [["isActive", "==", true]]
      );
      const yearId = yearData.find((y) => y.isActive)?.id || null;
      setActiveYearId(yearId);

      const [userData, classData, subjectData] = await Promise.all([
        getAllDocuments<User>(COLLECTION_NAME),
        getAllDocuments<ClassData>("classes"),
        getAllDocuments<SubjectData>("subjects"),
      ]);

      setAllUsers(userData.filter((u) => u.role !== "admin"));
      setClasses(classData);
      setSubjects(subjectData);

      if (!yearId) {
        setError("Tahun Ajaran Aktif belum diset.");
      } else {
        setGuruFormData((prev) => ({ ...prev, academicYearId: yearId }));
        setSiswaFormData((prev) => ({ ...prev, academicYearId: yearId }));
        setError(null);
      }
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data utama.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getClassName = (classId: string) => {
    const foundClass = classes.find((c) => c.id === classId);
    return foundClass ? foundClass.name : "Kelas Tidak Ditemukan";
  };

  const handleEdit = (user: User) => {
    setIsEditing(true);
    setEditUid(user.uid);
    setActiveTab(user.role as "guru" | "siswa");

    if (user.role === "guru") {
      const g = user as Guru;
      setGuruFormData({
        nama: g.nama,
        email: g.email,
        password: "",
        nip: g.nip,
        academicYearId: g.academicYearId,
        mapelIds: g.mapelIds || [],
        kelasWaliId:
          g.kelasWaliIds && g.kelasWaliIds.length > 0
            ? g.kelasWaliIds[0]
            : null,
      });
    } else if (user.role === "siswa") {
      const s = user as Siswa;
      setSiswaFormData({
        nama: s.nama,
        email: s.email,
        password: "",
        nis: s.nis,
        kelasId: s.kelasId,
        academicYearId: s.academicYearId,
      });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditUid(null);
    setGuruFormData(initialGuruState);
    setSiswaFormData(initialSiswaState);
    setActiveTab("users");
  };

  const handleDelete = async (uid: string, role: string) => {
    if (
      !confirm(
        `Yakin ingin menghapus ${role.toUpperCase()} ini? Akses login mereka akan dicabut.`
      )
    )
      return;

    try {
      await deleteDoc(doc(db, COLLECTION_NAME, uid));
      alert("User berhasil dihapus.");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus user.");
    }
  };

  const handleSubmit = async (e: React.FormEvent, role: "guru" | "siswa") => {
    e.preventDefault();
    const data = role === "guru" ? guruFormData : siswaFormData;

    if (!activeYearId) {
      setError("Tidak ada Tahun Ajaran Aktif!");
      return;
    }

    try {
      let uid = editUid;

      if (!isEditing) {
        try {
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            data.email,
            data.password
          );
          uid = userCredential.user.uid;
        } catch (authErr: any) {
          if (authErr.code === "auth/email-already-in-use") {
            setError("Email ini sudah digunakan. Gunakan email lain.");
            return;
          }
          throw authErr;
        }
      }

      if (!uid) return;

      let firestoreData: any = {
        uid: uid,
        email: data.email,
        nama: data.nama,
        role: role,
        academicYearId: activeYearId,
      };

      if (role === "guru") {
        const guruData = data as GuruForm;
        firestoreData = {
          ...firestoreData,
          nip: guruData.nip,
          mapelIds: guruData.mapelIds,
          kelasWaliIds: guruData.kelasWaliId ? [guruData.kelasWaliId] : [],
        };
      } else if (role === "siswa") {
        const siswaData = data as SiswaForm;
        firestoreData = {
          ...firestoreData,
          nis: siswaData.nis,
          kelasId: siswaData.kelasId,
        };
      }

      if (isEditing) {
        const { password, ...updateData } = firestoreData;
        await updateDocument(COLLECTION_NAME, uid, updateData);
        alert("Data berhasil diperbarui!");
      } else {
        await setDoc(doc(db, "users", uid), firestoreData);
        alert(`${role.toUpperCase()} ${data.nama} berhasil didaftarkan!`);
      }

      handleCancelEdit();
      fetchData();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan.");
    }
  };

  if (isLoading) return <div className="p-4 text-zinc-400">Memuat data...</div>;
  if (error)
    return <div className="p-4 text-red-500 font-semibold">{error}</div>;

  return (
    <div className="p-2">
      <h1 className="text-3xl font-bold mb-6 text-zinc-100">Manajemen Akun</h1>

      <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg">
        <div className="flex border-b border-zinc-800 mb-6">
          <button
            onClick={() => {
              setActiveTab("users");
              handleCancelEdit();
            }}
            className={`pb-3 px-4 transition-all flex items-center font-medium ${
              activeTab === "users"
                ? "border-b-2 border-orange-500 text-orange-500"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Users className="w-4 h-4 mr-2" /> Daftar Akun
          </button>
          <button
            onClick={() => setActiveTab("guru")}
            className={`pb-3 px-4 transition-all flex items-center font-medium ${
              activeTab === "guru"
                ? "border-b-2 border-orange-500 text-orange-500"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {isEditing && activeTab === "guru" ? (
              <>
                <Pencil className="w-4 h-4 mr-2" /> Edit Guru
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" /> Tambah Guru
              </>
            )}
          </button>
          <button
            onClick={() => setActiveTab("siswa")}
            className={`pb-3 px-4 transition-all flex items-center font-medium ${
              activeTab === "siswa"
                ? "border-b-2 border-orange-500 text-orange-500"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {isEditing && activeTab === "siswa" ? (
              <>
                <Pencil className="w-4 h-4 mr-2" /> Edit Siswa
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" /> Tambah Siswa
              </>
            )}
          </button>
        </div>

        {activeTab === "users" && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead className="bg-zinc-950/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Detail
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {allUsers.map((user, index) => (
                  <tr
                    key={user.uid || index}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-zinc-200">
                      {user.nama}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === "guru"
                            ? "bg-indigo-900/50 text-indigo-300 border border-indigo-800"
                            : "bg-orange-900/50 text-orange-300 border border-orange-800"
                        }`}
                      >
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {user.role === "siswa"
                        ? `Kelas: ${getClassName((user as Siswa).kelasId)}`
                        : `NIP: ${(user as Guru).nip}`}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.uid, user.role)}
                        className="text-red-400 hover:text-red-300 transition-colors inline-flex items-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "guru" && (
          <form
            onSubmit={(e) => handleSubmit(e, "guru")}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Nama Lengkap"
                className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg p-3 focus:border-orange-500 outline-none"
                value={guruFormData.nama}
                onChange={(e) =>
                  setGuruFormData({ ...guruFormData, nama: e.target.value })
                }
                required
              />
              <input
                type="email"
                placeholder="Email"
                className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg p-3 focus:border-orange-500 outline-none"
                value={guruFormData.email}
                onChange={(e) =>
                  setGuruFormData({ ...guruFormData, email: e.target.value })
                }
                required
                disabled={isEditing}
              />
              {!isEditing && (
                <input
                  type="password"
                  placeholder="Password"
                  className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg p-3 focus:border-orange-500 outline-none"
                  value={guruFormData.password}
                  onChange={(e) =>
                    setGuruFormData({
                      ...guruFormData,
                      password: e.target.value,
                    })
                  }
                  required
                />
              )}
            </div>

            <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="NIP"
                className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg p-3 focus:border-orange-500 outline-none"
                value={guruFormData.nip}
                onChange={(e) =>
                  setGuruFormData({ ...guruFormData, nip: e.target.value })
                }
                required
              />
              <select
                className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg p-3 focus:border-orange-500 outline-none"
                value={guruFormData.kelasWaliId || ""}
                onChange={(e) =>
                  setGuruFormData({
                    ...guruFormData,
                    kelasWaliId: e.target.value || null,
                  })
                }
              >
                <option value="">-- Wali Kelas (Opsional) --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-3">
              <label className="text-zinc-400 text-sm mb-2 flex items-center">
                <Book className="w-4 h-4 mr-2" /> Pilih Mata Pelajaran
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-zinc-950 p-4 rounded-lg border border-zinc-800 max-h-40 overflow-y-auto">
                {subjects.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center space-x-2 text-sm text-zinc-300 cursor-pointer hover:text-orange-400"
                  >
                    <input
                      type="checkbox"
                      className="accent-orange-500"
                      checked={guruFormData.mapelIds.includes(s.id!)}
                      onChange={(e) => {
                        const currentIds = guruFormData.mapelIds;
                        const newIds = e.target.checked
                          ? [...currentIds, s.id!]
                          : currentIds.filter((id) => id !== s.id);
                        setGuruFormData({ ...guruFormData, mapelIds: newIds });
                      }}
                    />
                    <span>{s.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="col-span-3 flex gap-4">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 bg-zinc-700 text-zinc-300 font-bold p-3 rounded-lg hover:bg-zinc-600 transition-colors flex items-center justify-center"
                >
                  <X className="w-5 h-5 mr-2" /> Batal
                </button>
              )}
              <button
                type="submit"
                className="flex-1 bg-orange-600 text-white font-bold p-3 rounded-lg hover:bg-orange-500 transition-colors flex items-center justify-center shadow-lg shadow-orange-900/20"
              >
                <Save className="w-5 h-5 mr-2" />{" "}
                {isEditing ? "Simpan Perubahan" : "Simpan Guru Baru"}
              </button>
            </div>
          </form>
        )}

        {activeTab === "siswa" && (
          <form
            onSubmit={(e) => handleSubmit(e, "siswa")}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Nama Lengkap"
                className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg p-3 focus:border-orange-500 outline-none"
                name="nama"
                value={siswaFormData.nama}
                onChange={(e) =>
                  setSiswaFormData({ ...siswaFormData, nama: e.target.value })
                }
                required
              />
              <input
                type="email"
                placeholder="Email"
                className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg p-3 focus:border-orange-500 outline-none"
                name="email"
                value={siswaFormData.email}
                onChange={(e) =>
                  setSiswaFormData({ ...siswaFormData, email: e.target.value })
                }
                required
                disabled={isEditing}
              />
              {!isEditing && (
                <input
                  type="password"
                  placeholder="Password"
                  className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg p-3 focus:border-orange-500 outline-none"
                  name="password"
                  value={siswaFormData.password}
                  onChange={(e) =>
                    setSiswaFormData({
                      ...siswaFormData,
                      password: e.target.value,
                    })
                  }
                  required
                />
              )}
            </div>

            <div className="col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="NIS"
                className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg p-3 focus:border-orange-500 outline-none"
                name="nis"
                value={siswaFormData.nis}
                onChange={(e) =>
                  setSiswaFormData({ ...siswaFormData, nis: e.target.value })
                }
                required
              />
              <select
                className="bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-lg p-3 focus:border-orange-500 outline-none"
                name="kelasId"
                value={siswaFormData.kelasId || ""}
                onChange={(e) =>
                  setSiswaFormData({
                    ...siswaFormData,
                    kelasId: e.target.value,
                  })
                }
                required
              >
                <option value="">-- Pilih Kelas --</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-3 flex gap-4">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 bg-zinc-700 text-zinc-300 font-bold p-3 rounded-lg hover:bg-zinc-600 transition-colors flex items-center justify-center"
                >
                  <X className="w-5 h-5 mr-2" /> Batal
                </button>
              )}
              <button
                type="submit"
                className="flex-1 bg-orange-600 text-white font-bold p-3 rounded-lg hover:bg-orange-500 transition-colors flex items-center justify-center shadow-lg shadow-orange-900/20"
              >
                <Save className="w-5 h-5 mr-2" />{" "}
                {isEditing ? "Simpan Perubahan" : "Simpan Siswa Baru"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
