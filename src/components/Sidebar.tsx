"use client";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  LogOut,
  Store,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import instance from "@/lib/axios";

interface SidebarProps {
  isOpen: boolean;
  activeTab: string;
}

export const Sidebar = ({ isOpen, activeTab }: SidebarProps) => {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const role = useAuthStore((state) => state.role);

  const navItems = [
    { name: "Overview", icon: LayoutDashboard, href: "/" },
    { name: "Inventory", icon: Package, href: "/inventory" },
    { name: "POS", icon: ShoppingCart, href: "/pos" },
    { name: "Reports", icon: BarChart3, href: "/reports" },
    ...(role === "OWNER"
      ? [{ name: "Staff", icon: Users, href: "/staff" }]
      : []),
  ];

  const clearAuth = async () => {
    await instance.post("/auth/logout");
    useAuthStore.getState().clearAuth();
    router.push("/login");
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  return (
    <aside
      className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transition-transform duration-300 ease-in-out flex flex-col
      ${isOpen ? "translate-x-0" : "-translate-x-full"} 
      md:translate-x-0 md:static md:inset-0
    `}
    >
      {/* Brand Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary-accent p-2 rounded-lg">
          <Store className="text-sidebar h-6 w-6" />
        </div>
        <h1 className="text-white font-bold text-xl tracking-tight">
          Duka Manager
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = activeTab === item.name;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${
                  isActive
                    ? "bg-sidebar-active text-white shadow-lg"
                    : "text-sidebar-text hover:bg-primary-dark hover:text-white"
                }
              `}
            >
              <Icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User & Logout Section */}
      <div className="p-4 border-t border-primary-dark">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="h-8 w-8 rounded-full bg-primary-accent flex items-center justify-center text-sidebar font-bold">
            {initials}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-white text-sm font-medium truncate">
              {user?.name ?? "User"}
            </p>
            <p className="text-sidebar-text text-xs truncate">
              {user?.email ?? "user@example.com"}
            </p>
          </div>
        </div>
        <button
          onClick={clearAuth}
          className="flex items-center gap-3 w-full px-4 py-3 text-sidebar-text hover:text-white hover:bg-red-500/10 rounded-xl transition-colors mt-2"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};
