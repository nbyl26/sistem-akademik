"use client";

import { FormEvent, useState } from "react";
import { auth } from "@/firebase/config";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      });

      const { message } = await res.json();

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError(message);
        await signOut(auth);
      }
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError("Email atau password salah.");
      } else {
        setError("Terjadi kesalahan sistem.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black selection:bg-orange-500 selection:text-white p-4">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl shadow-orange-900/20">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
              <span className="text-black font-bold text-xl">S</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Selamat Datang Kembali
            </h1>
            <p className="text-zinc-400 text-sm mt-2">
              Masuk ke Sistem Akademik Simak Cihuy
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all placeholder:text-zinc-600"
                placeholder="nama@sekolah.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all placeholder:text-zinc-600"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-black font-bold p-3 rounded-xl hover:bg-orange-400 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20"
            >
              {loading ? "Memproses..." : "Masuk Dashboard"}
            </button>
          </form>
        </div>

        <p className="text-center text-zinc-500 text-xs mt-8">
          &copy; 2025 Simak Cihuy. All rights reserved.
        </p>
      </div>
    </div>
  );
}
