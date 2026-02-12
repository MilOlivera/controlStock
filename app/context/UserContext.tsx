"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { auth } from "../lib/firebase";
import {
  onAuthStateChanged,
  User,
} from "firebase/auth";

/* ---------- TIPOS ---------- */

type Role = "ADMIN" | "LOCAL";

type UserData = {
  email: string;
  role: Role;
  location: string | null;
};

type UserContextType = {
  user: UserData | null;
  loading: boolean;
};

const UserContext =
  createContext<UserContextType | null>(
    null
  );

/* ---------- MAPEO DE USUARIOS ---------- */
/* TEMPORAL: luego irá en Firestore */

const userLocations: Record<
  string,
  { role: Role; location: string | null }
> = {
  "admin@admin": {
    role: "ADMIN",
    location: null,
  },

  "lomas@marpla.com": {
    role: "LOCAL",
    location: "marpla-lomas",
  },

  "local@evolvere.com": {
    role: "LOCAL",
    location: "evolvere",
  },
};


/* ---------- PROVIDER ---------- */

export function UserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [firebaseUser, setFirebaseUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        setFirebaseUser(user);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  let user: UserData | null = null;

  if (firebaseUser?.email) {
  const email = firebaseUser.email;

  const mapping =
    userLocations[email];


    if (mapping) {
      user = {
        email: firebaseUser.email,
        role: mapping.role,
        location: mapping.location,
      };
    } else {
      // fallback admin
      user = {
        email: firebaseUser.email,
        role: "ADMIN",
        location: null,
      };
    }
  }

  return (
    <UserContext.Provider
      value={{ user, loading }}
    >
      {children}
    </UserContext.Provider>
  );
}

/* ---------- HOOK ---------- */

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx)
    throw new Error("UserContext missing");
  return ctx;
}
