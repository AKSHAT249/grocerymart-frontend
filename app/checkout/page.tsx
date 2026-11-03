"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { clearCart, decreaseQuantity, increaseQuantity } from "@/lib/features/cart/cartSlice";

const shippingCharges = 0;
const handlingCharges = 0;

const formatPrice = (price: number) =>
  `₹${price.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const cart = useSelector((state: RootState) => state.cart.items);
  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const grandTotal = subtotal + shippingCharges + handlingCharges;

  const placeOrder = () => {
    dispatch(clearCart());
    setOrderPlaced(true);
  };

  if (orderPlaced) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center text-gray-900">
        <p className="text-5xl">✅</p>
        <h1 className="mt-4 text-2xl font-bold">Order placed</h1>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          Your groceries are confirmed. Shipping and handling stayed at ₹0.00.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800"
        >
          Back to store
        </Link>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center text-gray-900">
        <p className="text-5xl">🛒</p>
        <h1 className="mt-4 text-2xl font-bold">Your basket is empty</h1>
        <p className="mt-2 text-sm text-gray-500">
          Add a few groceries before checking out.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800"
        >
          Back to store
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="text-sm font-semibold text-green-700">
          ← Back to store
        </Link>
        <h1 className="mt-3 text-3xl font-bold">Checkout</h1>
        <p className="mt-2 text-gray-500">Review your groceries and the final bill.</p>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-7 lg:col-span-2">
            <h2 className="mb-6 text-xl font-semibold">Your items ({itemCount})</h2>
            <div className="divide-y divide-gray-100">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-5 first:pt-0 last:pb-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 rounded-xl bg-[#f3f3f3] object-contain"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-green-50 text-3xl">
                      🥬
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatPrice(item.price)} per item
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-700 px-2 py-1.5 text-white">
                      <button
                        type="button"
                        aria-label={`Remove one ${item.name}`}
                        onClick={() => dispatch(decreaseQuantity(item.id))}
                      >
                        <Minus size={15} />
                      </button>
                      <span className="min-w-4 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Add one ${item.name}`}
                        onClick={() => dispatch(increaseQuantity(item.id))}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>
                  <p className="whitespace-nowrap font-semibold">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-6 text-xl font-semibold">Bill details</h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Item total</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Shipping charges</span>
                <span className="font-medium">{formatPrice(shippingCharges)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Handling charges</span>
                <span className="font-medium">{formatPrice(handlingCharges)}</span>
              </div>
              <div className="flex justify-between gap-3 border-t border-dashed border-gray-200 pt-4">
                <span className="font-bold">Grand total</span>
                <span className="text-xl font-bold text-green-700">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>
            <p className="mt-6 rounded-xl bg-green-50 p-3 text-sm text-green-800">
              Shipping and handling are ₹0.00 on this order.
            </p>
            <button
              type="button"
              onClick={placeOrder}
              className="mt-6 w-full rounded-xl bg-green-700 py-3.5 text-sm font-semibold text-white hover:bg-green-800"
            >
              Place order · {formatPrice(grandTotal)}
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
