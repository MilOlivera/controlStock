"use client";

import { useState } from "react";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError(null);

    if (!email || !password) {
      setError("Ingresá email y contraseña");
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
    } catch (e: any) {
      console.error("Error login", e);

      // Mensajes más claros
      if (e.code === "auth/user-not-found") {
        setError("Usuario no encontrado");
      } else if (e.code === "auth/wrong-password") {
        setError("Contraseña incorrecta");
      } else if (e.code === "auth/invalid-email") {
        setError("Email inválido");
      } else {
        setError("No se pudo iniciar sesión");
      }
    } finally {
      setLoading(false);
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
          className="w-full bg-zinc-800 p-2 rounded outline-none focus:ring-2 focus:ring-green-600"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full bg-zinc-800 p-2 rounded outline-none focus:ring-2 focus:ring-green-600"
        />

        {error && (
          <div className="text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className={`px-4 py-2 rounded w-full transition
            ${
              loading
                ? "bg-zinc-700 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-500 cursor-pointer"
            }`}
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </div>
    </div>
  );
}
