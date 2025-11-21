import type { Metadata } from "next";
import { Inter, Roboto } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { BackendWarmup } from "@/components/providers/backend-warmup";
import { BadgeProvider } from "@/contexts/BadgeContext";
import { SessionExpiredDialog } from "@/components/SessionExpiredDialog";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Greenwich Academic Portal - Admin",
  description: "Admin portal for Greenwich University academic management system",
  keywords: ["education", "admin", "academic", "greenwich"],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${roboto.variable} font-body antialiased min-h-screen`}
      >
        <QueryProvider>
          <BadgeProvider>
            <BackendWarmup />
            {children}
            <ToastProvider />
            <SessionExpiredDialog />
          </BadgeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
