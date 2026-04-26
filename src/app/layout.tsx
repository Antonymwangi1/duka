import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Duka Manager",
  description: "Inventory and sales tracker for small Kenyan shops",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
