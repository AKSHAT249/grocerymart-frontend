"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Minus, Plus, Search, ShoppingBasket, UserRound, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { RootState } from "@/lib/store";
import { decreaseQuantity, increaseQuantity } from "@/lib/features/cart/cartSlice";

const formatPrice = (price: number) =>
  `₹${price.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

type HeaderProps = {
  search?: string;
  onSearch?: (value: string) => void;
};

const Header = ({ search, onSearch }: HeaderProps) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(search ?? "");
  const userEditedSearch = useRef(false);
  const cart = useSelector((state: RootState) => state.cart.items);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  useEffect(() => {
    if (search !== undefined) setLocalSearch(search);
  }, [search]);

  useEffect(() => {
    if (onSearch || !userEditedSearch.current) return;
    const trimmed = localSearch.trim();
    if (!trimmed) return;
    const timer = window.setTimeout(() => {
      router.push(`/?search=${encodeURIComponent(trimmed)}`);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [localSearch, onSearch, router]);

  useEffect(() => {
    if (!isCartOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsCartOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isCartOpen]);

  return (
    <>
      <header className="sticky top-0 z-20 w-full border-b border-gray-100 bg-white text-gray-900">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:gap-6 sm:px-6">
          <div className="flex shrink-0 items-center gap-3">
            <a href="/" className="text-xl font-black tracking-tight text-green-700">
              dailybasket
            </a>
            <div className="hidden min-w-0 sm:block">
              <p className="text-sm font-semibold text-green-700">Everyday essentials</p>
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={13} className="shrink-0" />
                <span className="truncate">14th Avenue, Gaur City 2</span>
              </p>
            </div>
          </div>

          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 focus-within:border-green-600">
            <Search size={18} className="shrink-0 text-gray-400" />
            <input
              value={onSearch ? search ?? "" : localSearch}
              onChange={(event) => {
                const value = event.target.value;
                if (onSearch) onSearch(value);
                else {
                  userEditedSearch.current = true;
                  setLocalSearch(value);
                }
              }}
              placeholder="Search milk, snacks, household items..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>

          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <Suspense>
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="flex flex-col items-center gap-0.5 px-2 text-[11px] font-medium text-gray-800 hover:text-green-700"
                  >
                    <UserRound size={20} />
                    Login
                  </button>
                </SignInButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </Suspense>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex flex-col items-center gap-0.5 px-2 text-[11px] font-medium text-gray-800 hover:text-green-700"
            >
              <ShoppingBasket size={20} />
              Cart
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-700 px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          isCartOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsCartOpen(false)}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white text-gray-900 shadow-2xl transition-transform duration-300 ${
          isCartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold">Your basket</h2>
            <p className="text-sm text-gray-500">{cartCount} items</p>
          </div>
          <button
            type="button"
            aria-label="Close basket"
            onClick={() => setIsCartOpen(false)}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <ShoppingBasket size={36} className="text-green-700" />
              <p className="mt-3 font-semibold">Your basket is empty</p>
              <p className="mt-1 text-sm text-gray-500">
                Add groceries and they will show up here.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {cart.map((item) => (
                <li key={item.id} className="flex gap-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      className="h-16 w-16 rounded-xl bg-[#f3f3f3] object-contain"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-green-50 text-2xl">
                      🥬
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="mt-1 text-sm text-gray-500">{formatPrice(item.price)}</p>
                    <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-green-700 px-2 py-1 text-white">
                      <button
                        type="button"
                        aria-label={`Remove one ${item.name}`}
                        onClick={() => dispatch(decreaseQuantity(item.id))}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="min-w-4 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Add one ${item.name}`}
                        onClick={() => dispatch(increaseQuantity(item.id))}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-gray-100 px-5 py-4">
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="text-gray-500">Item total</span>
            <span className="font-semibold">{formatPrice(subtotal)}</span>
          </div>
          <Link
            href="/checkout"
            onClick={() => setIsCartOpen(false)}
            className={`block rounded-xl py-3.5 text-center text-sm font-semibold text-white ${
              cart.length === 0
                ? "pointer-events-none bg-gray-300"
                : "bg-green-700 hover:bg-green-800"
            }`}
          >
            Checkout · {formatPrice(subtotal)}
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Header;
