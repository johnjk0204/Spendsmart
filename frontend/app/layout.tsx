import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SpendSmart AI — Daily Expense Analyzer",
  description: "AI-powered personal finance tracker with smart insights, predictions, and recommendations",
  keywords: ["expense tracker", "AI finance", "budget", "spending analysis"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Toaster position="top-right" richColors expand />
        </ThemeProvider>
      </body>
    </html>
  );
}
