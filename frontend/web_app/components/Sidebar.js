"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";

export default function Sidebar() {
  const pathname = usePathname();
  
  const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "Members", href: "/dashboard/members", icon: UsersIcon },
  { name: "Events", href: "/dashboard/events", icon: CalendarIcon },
  { name: "Contributions", href: "/dashboard/contributions", icon: CurrencyDollarIcon },
  { name: "Reports", href: "/dashboard/reports", icon: ChartBarIcon },
  { name: "Admins", href: "/dashboard/admins", icon: ShieldCheckIcon },
  // { name: "Settings", href: "/dashboard/settings", icon: Cog6ToothIcon }, // À enlever si non créé
];

  return (
    <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
          FaithConnect
        </h1>
        <p className="text-gray-400 text-sm mt-1">Community Management</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-teal-400 flex items-center justify-center">
              <span className="font-bold text-white">A</span>
            </div>
            <div>
              <p className="font-semibold">Admin Name</p>
              <p className="text-sm text-gray-400">Administrator</p>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <ArrowRightOnRectangleIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>
    </aside>
  );
}