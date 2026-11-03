"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useState } from "react";
import { MapPin, Minus, Plus, ShoppingBasket, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { decreaseQuantity, increaseQuantity } from "@/lib/features/cart/cartSlice";

const formatPrice = (price: number) =>
  `₹${price.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const Header = () => {
  const dispatch = useDispatch();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cart = useSelector((state: RootState) => state.cart.items);
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

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
      <header className="sticky top-0 z-20 w-full border-b border-gray-100 bg-white text-gray-900 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href="/" className="shrink-0 text-xl font-black tracking-tight text-gray-900">
            daily<span className="text-green-600">basket.</span>
          </a>

          <div className="hidden min-w-0 items-center gap-2 text-sm text-gray-500 sm:flex">
            <MapPin size={17} className="shrink-0 text-green-600" />
            <span className="truncate">Everyday essentials, near you</span>
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100"
          >
            <ShoppingBasket size={18} className="text-green-700" />
            <span>{cartCount} items</span>
          </button>
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
