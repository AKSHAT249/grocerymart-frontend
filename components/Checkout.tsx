
"use client";

import { useMemo } from "react";
import { Minus, Plus } from "lucide-react";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type CheckoutProps = {
  cartItems: CartItem[];
  onPlaceOrder: () => void;
  onBack: () => void;
  onChangeQuantity: (id: string, amount: number) => void;
};

export default function Checkout({
  cartItems,
  onPlaceOrder,
  onBack,
  onChangeQuantity, 
}: CheckoutProps) {
  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + Number(item.price) * item.quantity,
        0
      ),
    [cartItems]
  );

  const shippingCharges = 0;
  const handlingCharges = 0;
  const grandTotal = subtotal + shippingCharges + handlingCharges;

  const formatPrice = (price: number) =>
    `₹${price.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="text-5xl mb-4">🛒</div>
        <h1 className="text-2xl font-bold text-gray-800">
          Your cart is empty
        </h1>
        <p className="text-gray-500 mt-2">
          Add some products before proceeding to checkout.
        </p>
        <button
          onClick={onBack}
          className="mt-6 rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800"
        >
          Back to store
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="mb-4 text-sm font-semibold text-green-700 hover:text-green-800"
        >
          ← Back to store
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          Checkout
        </h1>
        <p className="text-gray-500 mt-2 mb-8">
          Review your groceries and order summary.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart products */}
          <section className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5 sm:p-7">
            <h2 className="text-xl font-semibold mb-6">
              Your Items ({cartItems.reduce(
                (total, item) => total + item.quantity,
                0
              )})
            </h2>

            <div className="divide-y divide-gray-100">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 py-5 first:pt-0 last:pb-0"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-xl object-cover bg-gray-100"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-green-50 flex items-center justify-center text-3xl">
                      🥬
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatPrice(Number(item.price))} per item
                    </p>
                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-700 px-2 py-1.5 text-white">
                      <button
                        type="button"
                        aria-label={`Remove one ${item.name}`}
                        onClick={() => onChangeQuantity(item.id, -1)}
                      >
                        <Minus size={15} />
                      </button>
                      <span className="min-w-4 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Add one ${item.name}`}
                        onClick={() => onChangeQuantity(item.id, 1)}
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                  </div>

                  <p className="font-semibold text-gray-900 whitespace-nowrap">
                    {formatPrice(
                      Number(item.price) * item.quantity
                    )}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Bill summary */}
          <aside className="bg-white rounded-2xl border border-gray-200 p-6 h-fit">
            <h2 className="text-xl font-semibold mb-6">
              Bill Details
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">
                  Item total
                </span>
                <span className="font-medium">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">
                  Shipping charges
                </span>
                <span className="font-medium text-green-600">
                  FREE
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-gray-500">
                  Handling charges
                </span>
                <span className="font-medium">
                  {formatPrice(handlingCharges)}
                </span>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between gap-3">
                <span className="font-bold text-gray-900">
                  Grand Total
                </span>
                <span className="text-xl font-bold text-green-700">
                  {formatPrice(grandTotal)}
                </span>
              </div>
            </div>

            <div className="bg-green-50 text-green-800 rounded-xl p-3 mt-6 text-sm">
              🎉 Congratulations! Your delivery is free.
            </div>

            <button
              onClick={onPlaceOrder}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl py-3.5 mt-6 transition-colors"
            >
              Place an Order · {formatPrice(grandTotal)}
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              Your order total will be confirmed before payment.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}
