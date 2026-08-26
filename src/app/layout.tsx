import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cleaner Manager",
  description: "Residential cleaning service management",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang='en' className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className='bg-gray-50 text-gray-900 antialiased min-h-screen flex flex-col'>
        <Navbar />
        <main className='flex-1'>{children}</main>
      </body>
    </html>
  );
}
