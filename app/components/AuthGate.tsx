"use client";

import LoginScreen from "./LoginScreen";
import { useUser } from "../context/UserContext";

export default function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();

  if (loading)
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Cargando...
      </div>
    );

  if (!user) return <LoginScreen />;

  return <>{children}</>;
}
