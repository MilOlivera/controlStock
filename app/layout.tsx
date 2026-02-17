import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { OrdersProvider } from "./context/OrdersContext";
import { InventoryProvider } from "./context/InventoryContext";
import { UserProvider } from "./context/UserContext";
import { MovementsProvider } from "./context/MovementsContext";

import LoginScreen from "./components/LoginScreen";
import { useUser } from "./context/UserContext";
import AuthGate from "./components/AuthGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Control Stock",
  description: "Control de stock e inventarios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <UserProvider>
          <MovementsProvider>
          <InventoryProvider>
            <OrdersProvider>
                <AuthGate>
                  {children}
                </AuthGate>
            </OrdersProvider>
          </InventoryProvider>
          </MovementsProvider>
        </UserProvider>
      </body>
    </html>
  );
}
