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
            <div className={blocked ? "hidden" : "min-h-screen"}>
                <div className="flex min-h-screen">
                    <AdminSidebar />
                    <div className="flex-1 min-w-0">
                        <AdminHeader />
                        <main className="p-6">{children}</main>
                    </div>
                </div>
            </div>
        </>
    );
}