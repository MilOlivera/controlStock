"use client";

import { useEffect, useRef, useState } from "react";
import { logout } from "../lib/firebase";
import { useUser } from "../context/UserContext";

export default function UserMenu() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  if (!user) return null;

  const name = user.email.split("@")[0];

  /* ---------- CERRAR AL HACER CLICK AFUERA ---------- */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          e.target as Node
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  /* ---------- LOGOUT ---------- */
  async function handleLogout() {
    setOpen(false);
    await logout();
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
      >
        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-semibold">
          {name[0].toUpperCase()}
        </div>

        <span className="hidden sm:block">
          {name}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded shadow-lg p-3 animate-fadeIn">
          <div className="text-sm font-semibold">
            {name}
          </div>

          <div className="text-xs text-zinc-400 mb-3">
            {user.email}
          </div>

          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded hover:bg-zinc-800 text-red-400 cursor-pointer transition"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
