"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("grocery_admin_token");
    if (token) {
      router.replace("/admin");
    }
  }, [router]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/admin-login`,
        { email, password }
      );
      localStorage.setItem("grocery_admin_token", response.data.token);

      router.replace("/admin");
      router.refresh();

    } catch (err: any) {
      console.log("error.........",err);
      setError(
        err.response?.data?.message || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">

      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-sm border w-full max-w-md"
      >
        <h1 className="text-2xl font-bold text-gray-800">
          Admin Login
        </h1>

        <p className="text-gray-500 text-sm mt-2 mb-7">
          Sign in to manage your grocery store.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full mt-2 p-3 border text-black rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full mt-2 p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-600 text-sm mt-4">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg font-semibold disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}