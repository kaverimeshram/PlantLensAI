import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { PlantProvider } from "@/context/PlantContext";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PlantLens AI — Identify Any Plant, Diagnose Its Health",
  description: "Identify any plant, flower, tree, or mushroom from a photo. Understand botanical characteristics, detect health issues, and get verified care & treatment plans.",
  keywords: ["plant identification", "plant doctor", "diagnose plant diseases", "botanical encyclopedia", "tulsi", "money plant", "garden care", "plant AI"],
  authors: [{ name: "PlantLens AI Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#183D32",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakartaSans.variable} ${playfairDisplay.variable} h-full`}>
      <body className="min-h-full font-sans antialiased bg-[#F7F8F3] text-[#1A2420] selection:bg-[#DCE8D9] selection:text-[#183D32]">
        <PlantProvider>
          {children}
        </PlantProvider>
      </body>
    </html>
  );
}
