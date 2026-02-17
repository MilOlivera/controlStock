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

  const [loading, setLoading] =
    useState(false);

  async function handleLogin(
    e?: React.FormEvent
  ) {
    e?.preventDefault();

    if (loading) return;

    setError(null);

    if (!email || !password) {
      setError("Ingresá email y contraseña");
      return;
    }

    try {
      setLoading(true);

      await Promise.all([
        signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        ),
        new Promise((r) => setTimeout(r, 400)),
      ]);
    } catch (e) {
      console.error("Error login", e);
      setError("Credenciales incorrectas");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <form
        onSubmit={handleLogin}
        className="bg-zinc-900 p-6 rounded-lg text-center space-y-4 w-80"
      >
        <h1 className="text-xl font-bold">
          Control de Stock
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          disabled={loading}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          className="w-full bg-zinc-800 p-2 rounded"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          disabled={loading}
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
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-green-600 rounded w-full hover:bg-green-500 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading
            ? "Ingresando..."
            : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
