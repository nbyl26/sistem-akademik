"use client";

import { Dispatch, FormEvent, SetStateAction, useState } from "react";
import { auth } from "@/firebase/config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";

export default function RegisterPage() {
  const [email, setEmail]: [string, Dispatch<SetStateAction<string>>] = useState("");
  const [password, setPassword]: [string, Dispatch<SetStateAction<string>>] = useState("");
  const [error, setError]: [string, Dispatch<SetStateAction<string>>] = useState("");

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert("Register berhasil!");
    } catch (err) {
        if(err instanceof FirebaseError){
            setError(err.message);
        }else{
            console.error(err);
        }
    }
  };

  return (
    <div className="p-6 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold">Register</h1>

      <form onSubmit={handleRegister} className="flex flex-col gap-4 mt-4">
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

        <button className="bg-blue-600 text-white p-2 rounded">Register</button>
      </form>
    </div>
  );
}
