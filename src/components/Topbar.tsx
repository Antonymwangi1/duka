"use client";
import { Menu, Moon, Sun, Calendar } from "lucide-react";

interface TopbarProps {
  toggleSidebar: () => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  shopName: string;
}

export const Topbar = ({
  toggleSidebar,
  isDarkMode,
  toggleDarkMode,
  shopName,
}: TopbarProps) => {
  const currentDate = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-background px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 transition-colors">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg md:hidden hover:bg-primary-light text-foreground"
        >
          <Menu size={24} />
        </button>

        <h2 className="text-lg font-semibold text-foreground md:text-xl">
          {shopName}
        </h2>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        {/* Date Display (Hidden on very small screens) */}
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-primary-light/30 px-3 py-1.5 rounded-full">
          <Calendar size={16} />
          <span className="font-medium">{currentDate}</span>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2.5 rounded-full bg-primary-light text-primary-dark hover:scale-110 transition-transform dark:bg-primary dark:text-white"
          aria-label="Toggle Dark Mode"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
};
