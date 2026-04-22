import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { NotificationProvider } from "@/contexts/NotificationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import QueryProvider from "@/providers/QueryProvider";
import { Toaster } from "react-hot-toast";
import ClientToaster from "@/components/ClientToaster";
import GestureLock from "@/components/GestureLock";

export const metadata = {
  title: "HostelHub - Advanced Hostel Management",
  description: "Next-generation hostel management system for modern campuses.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head />
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <NotificationProvider>
                  <GestureLock />
                  {children}
                  <ClientToaster />
                </NotificationProvider>
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
