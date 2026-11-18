"use client";

import { Minus, Plus } from "lucide-react";

export type ItemCardProduct = {
  id: string;
  name: string;
  selling_price?: string | number | null;
  mrp_price?: string | number | null;
  price?: string | number | null;
  product_image_url?: string | null;
  image_url?: string | null;
  unit?: string | null;
  net_quantity?: string | number | null;
};

type ItemCardProps = {
  product: ItemCardProduct;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
};

const rupee = (value: string | number | null | undefined) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "";
  return `₹${amount.toLocaleString("en-IN")}`;
};

export default function ItemCard({
  product,
  quantity,
  onAdd,
  onRemove,
}: ItemCardProps) {
  const image = product.product_image_url || product.image_url || "";
  const selling = product.selling_price ?? product.price;
  const mrp = Number(product.mrp_price);
  const sellingAmount = Number(selling);
  const pack = [product.net_quantity, product.unit].filter(Boolean).join(" ");

  return (
    <article className="flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#f8f8f8]">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-contain p-2"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl">🥬</div>
        )}

        {quantity > 0 ? (
          <div className="absolute bottom-2 right-2 flex items-center rounded-lg border border-[#e83e8c] bg-white text-[#e83e8c] shadow-sm">
            <button
              type="button"
              aria-label={`Remove one ${product.name}`}
              onClick={onRemove}
              className="px-2 py-1.5"
            >
              <Minus size={14} />
            </button>
            <span className="min-w-4 text-center text-sm font-bold">{quantity}</span>
            <button
              type="button"
              aria-label={`Add one ${product.name}`}
              onClick={onAdd}
              className="px-2 py-1.5"
            >
              <Plus size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            className="absolute bottom-2 right-2 rounded-lg border border-[#e83e8c] bg-white px-3.5 py-1.5 text-[13px] font-extrabold tracking-wide text-[#e83e8c] shadow-sm hover:bg-pink-50"
          >
            ADD
          </button>
        )}
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        {selling != null && selling !== "" && (
          <span className="rounded-[15%] bg-[#168a3a] px-2 py-1.5 text-[15px] font-bold leading-none border-2 border-black text-white">
            {rupee(selling)}
          </span>
        )}
        {Number.isFinite(mrp) && mrp > sellingAmount && (
          <span className="text-[15px] leading-none text-gray-400 line-through">
            {rupee(mrp)}
          </span>
        )}
      </div>

      <h3 className="mt-1.5 line-clamp-2 text-sm font-normal leading-5 text-gray-900">
        {product.name}
      </h3>
      {pack && <p className="mt-0.5 text-xs text-gray-500">{pack}</p>}
    </article>
  );
}
