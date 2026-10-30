"use client"

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";



export default function AdminLayout({ children }) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("grocery_admin_token");

        if (!token) {
            router.replace("/admin/login");
        } else {
            setIsAuthenticated(true);
        }

        setIsChecking(false);
    }, [router]);

    const blocked = isChecking || !isAuthenticated;

    return (
        <>
            {blocked && (
                <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm text-gray-500">
                    <LoaderCircle className="animate-spin text-green-600" size={28} />
                    Checking authentication...
                </div>
            )}
            <div className={blocked ? "hidden" : "min-h-screen overflow-x-hidden"}>
                <div className="flex min-h-screen">
                    <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
                    <div className="flex min-w-0 flex-1 flex-col">
                        <AdminHeader onMenu={() => setMenuOpen(true)} />
                        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
                    </div>
                </div>
            </div>
        </>
    );
}