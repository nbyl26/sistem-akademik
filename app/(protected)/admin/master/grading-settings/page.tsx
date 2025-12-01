"use client";

import React, { useState, useEffect } from "react";
import {
  addDocument,
  getAllDocuments,
  updateDocument,
  getActiveAcademicYear,
} from "@/lib/firestore";
import { GradeSettings, AcademicYear } from "@/types/master";
import { Save, AlertCircle } from "lucide-react";

export default function GradingSettingsPage() {
  const [settings, setSettings] = useState<GradeSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeYear, setActiveYear] = useState<AcademicYear | null>(null);
  const [formData, setFormData] = useState({
    tugasPercentage: 20,
    utsPercentage: 30,
    uasPercentage: 40,
    lainnyaPercentage: 10,
    absencePercentage: 0,
  });
  const [inputValues, setInputValues] = useState({
    tugasPercentage: "20",
    utsPercentage: "30",
    uasPercentage: "40",
    lainnyaPercentage: "10",
    absencePercentage: "0",
  });

  const COLLECTION_NAME = "grade_settings";

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const year = await getActiveAcademicYear();
      setActiveYear(year);

      if (year) {
        const settingsData = await getAllDocuments<GradeSettings>(
          COLLECTION_NAME,
          [["academicYearId", "==", year.id]]
        );

        if (settingsData.length > 0) {
          setSettings(settingsData[0]);
          const newFormData = {
            tugasPercentage: settingsData[0].tugasPercentage,
            utsPercentage: settingsData[0].utsPercentage,
            uasPercentage: settingsData[0].uasPercentage,
            lainnyaPercentage: settingsData[0].lainnyaPercentage || 10,
            absencePercentage: settingsData[0].absencePercentage || 0,
          };
          setFormData(newFormData);
          setInputValues({
            tugasPercentage: newFormData.tugasPercentage.toString(),
            utsPercentage: newFormData.utsPercentage.toString(),
            uasPercentage: newFormData.uasPercentage.toString(),
            lainnyaPercentage: newFormData.lainnyaPercentage.toString(),
            absencePercentage: newFormData.absencePercentage.toString(),
          });
        }
      }
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data pengaturan nilai.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputValues((prev) => ({
      ...prev,
      [name]: value,
    }));
    const parsedValue = value === "" ? 0 : parseFloat(value);
    const finalValue = isNaN(parsedValue) ? 0 : parsedValue;
    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const validatePercentages = () => {
    if (formData.tugasPercentage <= 0) {
      setError("Tugas Harian harus lebih dari 0%");
      return false;
    }
    if (formData.utsPercentage <= 0) {
      setError("UTS harus lebih dari 0%");
      return false;
    }
    if (formData.uasPercentage <= 0) {
      setError("UAS harus lebih dari 0%");
      return false;
    }

    const total =
      formData.tugasPercentage +
      formData.utsPercentage +
      formData.uasPercentage +
      formData.lainnyaPercentage +
      formData.absencePercentage;

    if (Math.abs(total - 100) > 0.01) {
      setError(
        `Total persentase harus 100%, saat ini: ${total.toFixed(1)}%`
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validatePercentages()) {
      return;
    }

    if (!activeYear) {
      setError("Tidak ada tahun ajaran aktif.");
      return;
    }

    try {
      const dataToSave = {
        academicYearId: activeYear.id,
        tugasPercentage: formData.tugasPercentage,
        utsPercentage: formData.utsPercentage,
        uasPercentage: formData.uasPercentage,
        lainnyaPercentage: formData.lainnyaPercentage,
        absencePercentage: formData.absencePercentage,
        updatedAt: new Date().toISOString(),
      };

      if (settings) {
        await updateDocument(COLLECTION_NAME, settings.id, dataToSave);
        setSuccess("Pengaturan nilai berhasil diperbarui!");
      } else {
        await addDocument(COLLECTION_NAME, dataToSave);
        setSuccess("Pengaturan nilai berhasil dibuat!");
      }

      await fetchData();
    } catch (err) {
      setError("Gagal menyimpan pengaturan nilai.");
      console.error(err);
    }
  };

  const currentTotal =
    formData.tugasPercentage +
    formData.utsPercentage +
    formData.uasPercentage +
    formData.lainnyaPercentage +
    formData.absencePercentage;

  if (isLoading)
    return <div className="p-4 text-zinc-400">Memuat data...</div>;

  if (!activeYear) {
    return (
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-6 text-zinc-100">
          Pengaturan Persentase Penilaian
        </h1>
        <div className="p-4 rounded-lg bg-yellow-900/20 border border-yellow-800 text-yellow-400 flex items-start">
          <AlertCircle className="w-5 h-5 mr-3 mt-0.5 shrink-0" />
          <span>
            Tidak ada tahun ajaran aktif. Silakan atur tahun ajaran aktif terlebih dahulu di menu Tahun Ajaran.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2">
      <h1 className="text-3xl font-bold mb-6 text-zinc-100">
        Pengaturan Persentase Penilaian
      </h1>

      <div className="mb-4 p-4 rounded-lg bg-zinc-800 border border-zinc-700">
        <p className="text-zinc-300">
          <span className="font-semibold text-zinc-200">Tahun Ajaran Aktif:</span>{" "}
          {activeYear.name}
        </p>
      </div>

      {success && (
        <div className="mb-4 p-4 rounded-lg bg-green-900/20 border border-green-800 text-green-400 flex items-start">
          <AlertCircle className="w-5 h-5 mr-3 mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-lg">
        <h2 className="text-xl font-semibold mb-6 text-zinc-200 border-b border-zinc-800 pb-3">
          {settings ? "Ubah Pengaturan Penilaian" : "Buat Pengaturan Penilaian"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-zinc-950 p-6 rounded-lg border border-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-200 mb-6">
              Persentase Komponen Penilaian
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Tugas Harian (%) *
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="tugasPercentage"
                    value={inputValues.tugasPercentage}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none"
                    required
                  />
                  <span className="ml-2 text-zinc-400 font-medium">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  UTS (%) *
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="utsPercentage"
                    value={inputValues.utsPercentage}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none"
                    required
                  />
                  <span className="ml-2 text-zinc-400 font-medium">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  UAS (%) *
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="uasPercentage"
                    value={inputValues.uasPercentage}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none"
                    required
                  />
                  <span className="ml-2 text-zinc-400 font-medium">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Lainnya (%)
                  <span className="text-zinc-500 font-normal text-xs ml-1">(Opsional)</span>
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="lainnyaPercentage"
                    value={inputValues.lainnyaPercentage}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none"
                  />
                  <span className="ml-2 text-zinc-400 font-medium">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Absensi (%)
                  <span className="text-zinc-500 font-normal text-xs ml-1">(Opsional)</span>
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    name="absencePercentage"
                    value={inputValues.absencePercentage}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className="flex-1 bg-zinc-900 border border-zinc-700 text-zinc-100 p-3 rounded-lg focus:border-orange-500 outline-none"
                  />
                  <span className="ml-2 text-zinc-400 font-medium">%</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-zinc-900 border border-zinc-700">
              <div className="flex justify-between items-center">
                <span className="font-medium text-zinc-300">Total:</span>
                <span
                  className={`font-bold text-lg ${
                    Math.abs(currentTotal - 100) < 0.01
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {currentTotal.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-900/20 border border-red-800 text-red-400 flex items-start">
              <AlertCircle className="w-5 h-5 mr-3 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-green-600 text-white p-3 rounded-lg flex items-center justify-center hover:bg-green-500 transition font-medium"
            >
              <Save className="w-5 h-5 mr-2" />
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>

      {settings && (
        <div className="mt-6 p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-sm">
          <p className="text-zinc-400">
            Terakhir diperbarui:{" "}
            <span className="text-zinc-300">
              {new Date(settings.updatedAt).toLocaleString("id-ID")}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
