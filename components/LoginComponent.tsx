"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

type LoginComponentProps = {
  open: boolean;
  onClose: () => void;
  onContinue: (mobile: string) => void;
};

export default function LoginComponent({
  open,
  onClose,
  onContinue,
}: LoginComponentProps) {
  const [mobile, setMobile] = useState("");
  const canContinue = mobile.length === 10;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canContinue) return;
    onContinue(mobile);
    setMobile("");
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close login"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        className="relative w-full max-w-md rounded-2xl bg-white px-6 pb-8 pt-5 text-gray-900 shadow-2xl sm:px-10"
      >
        <button
          type="button"
          aria-label="Back"
          onClick={onClose}
          className="rounded-full p-2 text-gray-700 hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="mx-auto mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-600 text-sm font-black tracking-tight text-white">
          db
        </div>

        <h2 id="login-title" className="mt-5 text-center text-2xl font-bold">
          Daily essentials, made simple.
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">Log in or Sign up</p>

        <form onSubmit={handleSubmit} className="mt-6">
          <label className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-3 focus-within:border-green-600">
            <span className="text-sm font-medium text-gray-500">+91</span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              value={mobile}
              onChange={(event) =>
                setMobile(event.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="Enter mobile number"
              className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
          </label>

          <button
            type="submit"
            disabled={!canContinue}
            className={`mt-4 w-full rounded-xl py-3.5 text-sm font-semibold text-white ${
              canContinue ? "bg-green-700 hover:bg-green-800" : "bg-gray-300"
            }`}
          >
            Continue
          </button>
        </form>

        <p className="mt-8 text-center text-xs leading-5 text-gray-400">
          By continuing, you agree to our Terms of service & Privacy policy
        </p>
      </div>
    </div>
  );
}
