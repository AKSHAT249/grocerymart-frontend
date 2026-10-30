"use client";

import { Bell, Menu, Search } from "lucide-react";

export default function AdminHeader({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="flex h-16 items-center justify-between gap-3 border-b bg-white px-4 sm:h-20 sm:px-6">

      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          aria-label="Open menu"
          onClick={onMenu}
          className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 lg:hidden"
        >
          <Menu size={22} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-gray-800 sm:text-xl">
            Admin Panel
          </h1>
          <p className="hidden text-sm text-gray-500 sm:block">
            Manage your grocery store
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 sm:gap-5">

        <div className="hidden items-center rounded-lg border bg-gray-50 px-3 py-2 sm:flex">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-28 bg-transparent px-2 text-sm outline-none md:w-40"
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