"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import axios from "axios";

type Category = {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
};

type SubCategory = {
  id: string;
  name: string;
  image_url: string | null;
  category_id: string;
};

type Product = {
  id: string;
  name: string;
  selling_price?: string;
  mrp_price?: string;
  price?: string;
  product_image_url?: string | null;
  image_url?: string | null;
  subcategory_id?: string;
};

export default function CategoryDetails() {
  const params = useParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [missing, setMissing] = useState(false);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    const id = params.id;
    if (!id) return;

    let active = true;
    setLoadingSubs(true);
    setMissing(false);
    setSelectedSubCategory(null);
    setProducts([]);

    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${id}`)
      .then((response) => {
        const row = response.data?.data?.[0] ?? response.data?.data;
        if (active && row?.id) setCategory(row);
      })
      .catch(() => {
        if (active) setMissing(true);
      });

    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/api/subcategories/${id}`)
      .then((response) => {
        if (!active) return;
        const rows: SubCategory[] = Array.isArray(response.data)
          ? response.data
          : response.data?.data ?? [];
        setSubCategories(rows);
        setSelectedSubCategory(rows[0] ?? null);
      })
      .catch(() => {
        if (active) setMissing(true);
      })
      .finally(() => {
        if (active) setLoadingSubs(false);
      });

    return () => {
      active = false;
    };
  }, [params.id]);

  useEffect(() => {
    const subcategoryId = selectedSubCategory?.id;
    if (!subcategoryId) return;

    let active = true;
    setLoadingProducts(true);

    axios
      .get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products?subcategory_id=${subcategoryId}`
      )
      .then((response) => {
        if (!active) return;
        const rows: Product[] = Array.isArray(response.data)
          ? response.data
          : response.data?.data ?? [];
        const linked = rows.some((product) => product.subcategory_id);
        setProducts(
          linked
            ? rows.filter((product) => product.subcategory_id === subcategoryId)
            : rows
        );
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoadingProducts(false);
      });

    return () => {
      active = false;
    };
  }, [selectedSubCategory?.id]);

  if (missing) {
    return (
      <main className="mx-auto min-h-screen max-w-7xl px-4 py-10 text-gray-900">
        <Link href="/" className="text-sm font-semibold text-green-700">
          ← Back to store
        </Link>
        <p className="mt-8 text-gray-500">This category could not be found.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Link href="/" className="text-sm font-semibold text-green-700">
          ← Back to store
        </Link>
        <h1 className="mt-4 text-2xl font-bold">
          {category?.name || "Category"}
        </h1>
        {category?.description && (
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {category.description}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start">
          <aside className="md:sticky md:top-4 md:w-60 md:shrink-0">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Subcategories
            </p>
            {loadingSubs ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-12 animate-pulse rounded-xl bg-gray-100" />
                ))}
              </div>
            ) : subCategories.length === 0 ? (
              <p className="text-sm text-gray-500">No subcategories yet.</p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
                {subCategories.map((item) => {
                  const selected = item.id === selectedSubCategory?.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedSubCategory(item)}
                      className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        selected
                          ? "bg-green-700 font-semibold text-white"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg ${
                          selected ? "bg-white/15" : "bg-white"
                        }`}
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt=""
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span className="text-xs font-bold">
                            {item.name.slice(0, 1)}
                          </span>
                        )}
                      </span>
                      <span className="whitespace-nowrap md:whitespace-normal">
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <section className="min-w-0 flex-1">
            <h2 className="mb-4 text-lg font-semibold">
              {selectedSubCategory?.name || "Products"}
            </h2>
            {loadingProducts ? (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-52 animate-pulse rounded-2xl bg-gray-100" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <p className="py-16 text-center text-sm text-gray-500">
                No products in {selectedSubCategory?.name || "this subcategory"}.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {products.map((product) => {
                  const image = product.product_image_url || product.image_url;
                  const price = product.selling_price || product.price;
                  return (
                    <article
                      key={product.id}
                      className="rounded-2xl border border-gray-100 bg-white p-3"
                    >
                      <div className="flex aspect-square items-center justify-center rounded-xl bg-[#f3f3f3]">
                        {image ? (
                          <img
                            src={image}
                            alt={product.name}
                            className="h-4/5 w-4/5 object-contain"
                          />
                        ) : (
                          <span className="text-3xl" aria-hidden>
                            🛒
                          </span>
                        )}
                      </div>
                      <h3 className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold leading-5">
                        {product.name}
                      </h3>
                      {price && (
                        <p className="mt-2 font-bold">₹{Number(price).toFixed(2)}</p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
