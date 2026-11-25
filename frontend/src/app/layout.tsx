import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI PDF Q&A Assistant",
  description: "Upload PDFs and ask questions with accurate page-cited answers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
