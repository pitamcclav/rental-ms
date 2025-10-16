import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Navigation } from "@/components/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rental Management System",
  description: "Manage your rental properties, units, tenants, and payments",
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
        <div className="min-h-screen bg-background">
          <Navigation />
          <main className="pt-20 lg:pt-8 lg:ml-64 px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">
            {children}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
