import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { WebSocketProvider } from "@/providers/websocket-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ClassPilot AI - Your AI Classroom Copilot",
  description: "Real-time AI assistant for lectures with live transcription, question detection, and intelligent note-taking",
  keywords: ["AI", "classroom", "transcription", "notes", "lecture", "education"],
  authors: [{ name: "ClassPilot AI" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="antialiased font-sans">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <WebSocketProvider>
            {children}
          </WebSocketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
