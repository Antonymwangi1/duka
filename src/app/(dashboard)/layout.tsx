"use client";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Check localStorage for theme preference on mount
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDarkMode ? "light" : "dark");
  };

  const segment = pathname.split("/")[1];
  const activeTab = segment
    ? segment.charAt(0).toUpperCase() + segment.slice(1)
    : "Overview";

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar isOpen={sidebarOpen} activeTab={activeTab} />

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <Topbar
            shopName="Main Branch - Nairobi"
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          />

          <main className="p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
