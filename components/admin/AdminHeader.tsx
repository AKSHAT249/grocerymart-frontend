"use client";

import { Bell, Search } from "lucide-react";

export default function AdminHeader() {
  return (
    <header className="h-20 bg-white border-b px-6 flex items-center justify-between">

      <div>
        <h1 className="text-xl font-bold text-gray-800">
          Admin Panel
        </h1>
        <p className="text-sm text-gray-500">
          Manage your grocery store
        </p>
      </div>

      <div className="flex items-center gap-5">

        <div className="flex items-center bg-gray-50 border rounded-lg px-3 py-2">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none px-2 text-sm w-40"
          />
        </div>

        <button className="relative text-gray-600">
          <Bell size={21} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

      </div>
    </header>
  );
}