"use client";

import React, { useState, useEffect } from "react";
import {
  addDocument,
  getAllDocuments,
  updateDocument,
  getActiveAcademicYear,
} from "@/lib/firestore";
import { AttendanceSettings, AcademicYear } from "@/types/master";
import { Save, AlertCircle, CheckCircle2, Users } from "lucide-react";

export default function AttendanceSettingsPage() {
  const [settings, setSettings] = useState<AttendanceSettings | null>(null);
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    minAttendanceForUAS: 75,
  });

  const COLLECTION_NAME = "attendance_settings";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const currentYear = await getActiveAcademicYear();
      setActiveYear(currentYear);

      if (currentYear && currentYear.id) {
        const settingsList = await getAllDocuments<AttendanceSettings>(
          COLLECTION_NAME,
          [["academicYearId", "==", currentYear.id]]
        );

        if (settingsList.length > 0) {
          setSettings(settingsList[0]);
          setFormData({
            minAttendanceForUAS: settingsList[0].minAttendanceForUAS,
          });
        } else {
          setSettings(null);
        }
        setError(null);
      } else {
        setError("Tahun Ajaran Aktif belum diset.");
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError("Gagal memuat data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === "" ? 0 : parseFloat(value);

    setFormData({
      minAttendanceForUAS: isNaN(numValue) ? 0 : numValue,
    });
  };

  const validateSettings = (): string | null => {
    const { minAttendanceForUAS } = formData;

    if (minAttendanceForUAS < 0 || minAttendanceForUAS > 100) {
      return "Minimal kehadiran harus antara 0% - 100%";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    if (!activeYear) {
      setError("Tahun ajaran aktif tidak ditemukan.");
      setIsSaving(false);
      return;
    }

    const validationError = validateSettings();
    if (validationError) {
      setError(validationError);
      setIsSaving(false);
      return;
    }

    try {
      const settingsData = {
        academicYearId: activeYear.id!,
        minAttendanceForUAS: formData.minAttendanceForUAS,
        updatedAt: new Date().toISOString(),
      };

      if (settings && settings.id) {
        await updateDocument(COLLECTION_NAME, settings.id, settingsData);
        setSuccess("Pengaturan kehadiran berhasil diperbarui!");
      } else {
        await addDocument(COLLECTION_NAME, settingsData);
        setSuccess("Pengaturan kehadiran berhasil disimpan!");
      }

      await fetchData();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setError("Gagal menyimpan pengaturan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return <div className="p-4 text-zinc-400">Memuat data...</div>;

  return (
    <div className="p-2 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2 text-zinc-100">
        Pengaturan Kehadiran
      </h1>
      <p className="text-sm text-zinc-400 mb-6">
        Tahun Ajaran Aktif:{" "}
        <span className="font-bold text-orange-500">
          {activeYear?.name || "TIDAK ADA"}
        </span>
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-900/20 border border-green-900/50 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-green-400">{success}</p>
        </div>
      )}

      <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
          <Users className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-semibold text-zinc-200">
            Syarat Kehadiran untuk UAS
          </h2>
        </div>

        <div className="mb-6 p-4 bg-blue-900/10 border border-blue-800/30 rounded-lg">
          <p className="text-sm text-blue-300">
            <strong>Info:</strong> Tetapkan persentase kehadiran minimal yang
            diperlukan siswa untuk dapat mengikuti Ujian Akhir Semester (UAS).
            Siswa yang tidak memenuhi syarat kehadiran minimal tidak akan dapat
            mengikuti UAS.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Minimal Kehadiran untuk UAS (%)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  name="minAttendanceForUAS"
                  value={formData.minAttendanceForUAS}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="1"
                  className="w-32 bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none text-center text-2xl font-bold"
                  required
                />
                <span className="text-3xl font-bold text-orange-500">%</span>
                <div className="flex-1 ml-4">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.minAttendanceForUAS}
                    onChange={handleChange}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Siswa harus memiliki kehadiran minimal{" "}
                <span className="text-orange-400 font-bold">
                  {formData.minAttendanceForUAS}%
                </span>{" "}
                untuk dapat mengikuti UAS
              </p>
            </div>

            {/* Preview section */}
            <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                Contoh Perhitungan:
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">
                    Total Pertemuan (Contoh):
                  </span>
                  <span className="text-zinc-200 font-medium">16 kali</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Minimal Hadir:</span>
                  <span className="text-orange-400 font-bold">
                    {Math.ceil((formData.minAttendanceForUAS / 100) * 16)} kali
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500">
                    Dengan pengaturan {formData.minAttendanceForUAS}%, siswa
                    harus hadir minimal{" "}
                    {Math.ceil((formData.minAttendanceForUAS / 100) * 16)} kali
                    dari 16 pertemuan untuk dapat mengikuti UAS.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving || !activeYear}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-lg transition shadow-lg shadow-orange-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {isSaving
                ? "Menyimpan..."
                : settings
                ? "Perbarui Pengaturan"
                : "Simpan Pengaturan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
