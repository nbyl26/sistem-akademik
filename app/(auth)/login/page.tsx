"use client";

import { Dispatch, FormEvent, SetStateAction, useState } from "react";
import { auth } from "@/firebase/config";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export default function LoginPage() {
  const [email, setEmail]: [string, React.Dispatch<SetStateAction<string>>] =
    useState("");
  const [password, setPassword]: [string, Dispatch<SetStateAction<string>>] =
    useState("");
  const [error, setError]: [string, Dispatch<SetStateAction<string>>] =
    useState("");

  const router: AppRouterInstance = useRouter();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const {user} = await signInWithEmailAndPassword(auth, email, password);
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({uid: user.uid})
      });
      const {message} = await res.json()
      if(res.ok){
        await signOut(auth);
        router.refresh();
        return router.replace("/dashboard");
      }else{
        setError(message);
      }
    } catch (err) {
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case "auth/invalid-credential":
          case "auth/invalid-email":
          case "auth/wrong-password":
          case "auth/user-not-found":
            setError("Email atau password salah");
            break;

          default:
            break;
        }
      } else {
        console.error(err);
      }
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold">Login</h1>

      <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-4">
        <input
          type="email"
          placeholder="Email"
          className="border p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-600">{error}</p>}

        <button className="bg-green-600 text-white p-2 rounded">Login</button>
      </form>
    </div>
  );
}
