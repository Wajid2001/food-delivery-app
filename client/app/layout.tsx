import type { Metadata } from "next";
import React, { Suspense } from "react";
import { AuthProvider } from "../components/AuthContext";
import Navbar from "../components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuickBite — Premium Food Delivery Platform",
  description: "Order fresh and delicious food from your favorite restaurants and get it delivered in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
        <link href="https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col bg-white text-charcoal font-sans">
        <AuthProvider>
          <Suspense fallback={<header className="sticky top-0 z-50 w-full bg-white border-b border-[#E8E6E1] py-4 h-20" />}>
            <Navbar />
          </Suspense>
          <main className="flex-grow flex flex-col">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
