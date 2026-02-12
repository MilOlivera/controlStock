"use client";

import { useState } from "react";
import { auth } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
} from "firebase/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [error, setError] =
    useState<string | null>(null);

  async function handleLogin() {
    setError(null);

    if (!email || !password) {
      setError("Ingresá email y contraseña");
      return;
    }

    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
    } catch (e) {
      console.error("Error login", e);
      setError("Credenciales incorrectas");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-zinc-900 p-6 rounded-lg text-center space-y-4 w-80">
        <h1 className="text-xl font-bold">
          Control de Stock
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full bg-zinc-800 p-2 rounded"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full bg-zinc-800 p-2 rounded"
        />

        {error && (
          <div className="text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          className="px-4 py-2 bg-green-600 rounded w-full"
        >
          Ingresar
        </button>
      </div>
    </div>
  );
}
