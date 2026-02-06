import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { AdminLayout } from "@/components/layout/admin-layout";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Bookstore Admin",
  description: "Admin dashboard for bookstore",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AdminLayout>{children}</AdminLayout>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
