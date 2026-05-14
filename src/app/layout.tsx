import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";

import { TotemScreensaver } from "@/components/totem/TotemScreensaver";

import "./globals.css";

const font = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quiz Totem",
  description: "Ativação de evento — totem touchscreen",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={font.className}>
        <TotemScreensaver>{children}</TotemScreensaver>
      </body>
    </html>
  );
}
