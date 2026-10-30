"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tags,
  Clock,
  Settings,
  LogOut,
  Store,
} from "lucide-react";
import axios from "axios";

const menuItems = [
  { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
  { name: "Orders", path: "/admin/orders", icon: ShoppingBag },
  { name: "Inventory", path: "/admin/inventory", icon: Package },
  { name: "Categories", path: "/admin/categories", icon: Tags },
  { name: "Expiry Management", path: "/admin/expiry", icon: Clock },
  { name: "Settings", path: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/logout`,
        {},
        { withCredentials: true }
      );
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  };

  return (
    <aside className="w-64 min-h-screen bg-white border-r flex flex-col">

      {/* Logo */}
      <div className="h-20 flex items-center gap-3 px-6 border-b">
        <div className="bg-green-600 text-white p-2 rounded-lg">
          <Store size={22} />
        </div>
        <div>
          <h2 className="font-bold text-lg">GroceryMart</h2>
          <p className="text-xs text-gray-500">Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-400 px-3 mb-4">
          MAIN MENU
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.path ||
            (item.path !== "/admin" &&
              pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition ${
                active
                  ? "bg-green-50 text-green-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={19} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Admin profile */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700">
            A
          </div>
          <div>
            <p className="text-sm font-semibold">Store Admin</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-sm text-red-600 hover:bg-red-50 w-full p-3 rounded-lg"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}