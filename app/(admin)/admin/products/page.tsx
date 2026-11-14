"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { ImageOff, LoaderCircle, Pencil, Search } from "lucide-react";
import api from "@/utils/axios";

type Category = {
  id: string;
  name: string;
};

type Subcategory = {
  id: string;
  category_id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  description: string;
  category_id: string;
  subcategory_id: string;
  mrp_price: string;
  selling_price: string;
  product_image_url: string;
  is_available: boolean;
  unit: string;
  net_quantity: string;
};

type ProductForm = {
  name: string;
  description: string;
  category_id: string;
  subcategory_id: string;
  mrp_price: string;
  selling_price: string;
  is_available: boolean;
  unit: string;
  net_quantity: string;
  image_preview: string;
};

type Tab = "list" | "create" | "edit";

const apiBase = process.env.NEXT_PUBLIC_API_URL;
const units = ["pc", "pack", "gm", "kg", "ml", "L", "dozen"];

const emptyForm: ProductForm = {
  name: "",
  description: "",
  category_id: "",
  subcategory_id: "",
  mrp_price: "",
  selling_price: "",
  is_available: true,
  unit: "pc",
  net_quantity: "",
  image_preview: "",
};

function asRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    const record = payload as { data?: unknown; rows?: unknown };
    if (Array.isArray(record.data)) return record.data as Record<string, unknown>[];
    if (Array.isArray(record.rows)) return record.rows as Record<string, unknown>[];
  }
  return [];
}

function normalizeProduct(row: Record<string, unknown>): Product {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    description: String(row.description ?? ""),
    category_id: String(row.category_id ?? ""),
    subcategory_id: String(row.subcategory_id ?? ""),
    mrp_price: String(row.mrp_price ?? ""),
    selling_price: String(row.selling_price ?? ""),
    product_image_url: typeof row.product_image_url === "string" ? row.product_image_url : "",
    is_available: row.is_available !== false,
    unit: String(row.unit ?? ""),
    net_quantity: String(row.net_quantity ?? ""),
  };
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.error || error.response?.data?.message;
    if (typeof message === "string" && message) return message;
    if (error.message === "Network Error") {
      return "Could not reach the server. Check that the API is running.";
    }
  }
  return fallback;
}

function money(value: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ProductsPage() {
  const [tab, setTab] = useState<Tab>("list");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [availability, setAvailability] = useState<"all" | "available" | "hidden">("all");
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  async function fetchProducts() {
    const response = await api.get(`/api/products`);
    setProducts(asRows(response.data).map(normalizeProduct).filter((product) => product.id));
  }

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      const categoryResponse = await api.get(`/api/categories/`);
      const categoryRows = asRows(categoryResponse.data)
        .map((row) => ({ id: String(row.id ?? ""), name: String(row.name ?? "") }))
        .filter((category) => category.id);

      const subcategoryLists = await Promise.all(
        categoryRows.map(async (category) => {
          try {
            const response = await api.get(`/api/subcategories/${category.id}`);
            return asRows(response.data).map((row) => ({
              id: String(row.id ?? ""),
              category_id: String(row.category_id ?? category.id),
              name: String(row.name ?? ""),
            }));
          } catch {
            return [] as Subcategory[];
          }
        })
      );

      if (!active) return;
      setCategories(categoryRows);
      setSubcategories(subcategoryLists.flat().filter((item) => item.id));
      await fetchProducts();
    }

    loadCatalog()
      .catch((loadError) => {
        if (active) setError(errorMessage(loadError, "Could not load products."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filterSubcategories = useMemo(
    () =>
      subcategories.filter((item) => !categoryFilter || item.category_id === categoryFilter),
    [subcategories, categoryFilter]
  );

  const formSubcategories = useMemo(
    () => subcategories.filter((item) => item.category_id === form.category_id),
    [subcategories, form.category_id]
  );

  const visibleProducts = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery = !term || `${product.name} ${product.description}`.toLowerCase().includes(term);
      const matchesCategory = !categoryFilter || product.category_id === categoryFilter;
      const matchesSubcategory = !subcategoryFilter || product.subcategory_id === subcategoryFilter;
      const matchesAvailability =
        availability === "all" ||
        (availability === "available" ? product.is_available : !product.is_available);
      return matchesQuery && matchesCategory && matchesSubcategory && matchesAvailability;
    });
  }, [products, query, categoryFilter, subcategoryFilter, availability]);

  function categoryName(id: string) {
    return categories.find((category) => category.id === id)?.name || "Uncategorized";
  }

  function subcategoryName(id: string) {
    return subcategories.find((item) => item.id === id)?.name || "";
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setImageFile(null);
    setError("");
    setTab("create");
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description,
      category_id: product.category_id,
      subcategory_id: product.subcategory_id,
      mrp_price: product.mrp_price,
      selling_price: product.selling_price,
      is_available: product.is_available,
      unit: product.unit || "pc",
      net_quantity: product.net_quantity,
      image_preview: product.product_image_url,
    });
    setImageFile(null);
    setError("");
    setNotice("");
    setTab("edit");
  }

  function readImage(file: File) {
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setError("Use a PNG, JPG, or WEBP image.");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((current) => ({ ...current, image_preview: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  }

  function buildFormData() {
    const formData = new FormData();
    formData.append("name", form.name.trim());
    formData.append("description", form.description.trim());
    formData.append("category_id", form.category_id);
    formData.append("subcategory_id", form.subcategory_id);
    formData.append("mrp_price", form.mrp_price);
    formData.append("selling_price", form.selling_price);
    formData.append("is_available", String(form.is_available));
    formData.append("unit", form.unit);
    formData.append("net_quantity", form.net_quantity);
    if (imageFile) formData.append("product_image_url", imageFile);
    return formData;
  }

  function validateForm() {
    if (!form.name.trim() || !form.description.trim()) return "Name and description are required.";
    if (!form.category_id || !form.subcategory_id) return "Choose a category and subcategory.";
    if (!form.mrp_price || !form.selling_price || !form.net_quantity || !form.unit) {
      return "Price, quantity, and unit are required.";
    }
    if (Number(form.selling_price) > Number(form.mrp_price)) {
      return "Selling price cannot be higher than MRP.";
    }
    if (tab === "create" && !imageFile) return "Product image is required.";
    return "";
  }

  async function handleCreateProduct(event: FormEvent) {
    event.preventDefault();
    const message = validateForm();
    if (message) {
      setError(message);
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.post(`/api/products`, buildFormData());
      await fetchProducts();
      setForm(emptyForm);
      setImageFile(null);
      setNotice(`${form.name.trim()} added.`);
      setTab("list");
    } catch (saveError) {
      setError(errorMessage(saveError, "Could not add the product."));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateProduct(event: FormEvent) {
    event.preventDefault();
    if (!editingId) return;
    const message = validateForm();
    if (message) {
      setError(message);
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");
    try {
      await api.put(`/api/products/${editingId}`, buildFormData());
      await fetchProducts();
      setNotice(`${form.name.trim()} updated.`);
      setTab("list");
    } catch (saveError) {
      setError(errorMessage(saveError, "Could not update the product."));
    } finally {
      setSaving(false);
    }
  }

  const editingProduct = products.find((product) => product.id === editingId) ?? null;

  return (
    <div className="text-gray-900">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Catalog</p>
        <h2 className="mt-1 text-2xl font-bold">Products</h2>
        <p className="mt-1 text-sm text-gray-500">
          Filter the shelf, then add or edit a product.
        </p>
      </div>

      <div className="mt-6 grid gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:grid-cols-2 xl:grid-cols-4">
        <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 sm:col-span-2 xl:col-span-1">
          <Search size={16} className="shrink-0 text-gray-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <select
          value={categoryFilter}
          onChange={(event) => {
            setCategoryFilter(event.target.value);
            setSubcategoryFilter("");
          }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-600"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={subcategoryFilter}
          onChange={(event) => setSubcategoryFilter(event.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-600"
        >
          <option value="">All subcategories</option>
          {filterSubcategories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          value={availability}
          onChange={(event) => setAvailability(event.target.value as "all" | "available" | "hidden")}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-600"
        >
          <option value="all">All statuses</option>
          <option value="available">Available</option>
          <option value="hidden">Hidden</option>
        </select>
      </div>

      <div className="mt-4 inline-flex w-full rounded-full bg-gray-100 p-1 sm:w-auto">
        <button
          type="button"
          onClick={() => setTab("list")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition sm:flex-none ${
            tab === "list" ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          All products
        </button>
        <button
          type="button"
          onClick={openCreate}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition sm:flex-none ${
            tab === "create" ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Create
        </button>
        <button
          type="button"
          onClick={() => setTab("edit")}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition sm:flex-none ${
            tab === "edit" ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-800"
          }`}
        >
          Edit
        </button>
      </div>

      {notice && (
        <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800">{notice}</p>
      )}
      {error && tab === "list" && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {tab === "list" ? (
        <section className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-40 animate-pulse rounded-3xl bg-gray-100" />
              ))}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
              <p className="font-semibold">No products found</p>
              <p className="mt-1 text-sm text-gray-500">Try another filter, or add the first product.</p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-5 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
              >
                Create product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visibleProducts.map((product) => (
                <article
                  key={product.id}
                  className="flex gap-3 rounded-3xl border border-gray-100 bg-white p-3 shadow-sm"
                >
                  <span className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-green-50">
                    {product.product_image_url && !brokenImages[product.id] ? (
                      <img
                        src={product.product_image_url}
                        alt=""
                        className="h-full w-full object-contain"
                        onError={() =>
                          setBrokenImages((current) => ({ ...current, [product.id]: true }))
                        }
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-green-700/40">
                        <ImageOff size={20} />
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold">{product.name}</h3>
                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${
                          product.is_available ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                        }`}
                      >
                        {product.is_available ? "Available" : "Hidden"}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-gray-500">
                      {categoryName(product.category_id)}
                      {subcategoryName(product.subcategory_id)
                        ? ` · ${subcategoryName(product.subcategory_id)}`
                        : ""}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      {money(product.selling_price)}
                      <span className="ml-2 text-xs font-normal text-gray-400 line-through">
                        {money(product.mrp_price)}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {product.net_quantity} {product.unit}
                    </p>
                    <button
                      type="button"
                      onClick={() => openEdit(product)}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-green-700 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : tab === "edit" && !editingProduct ? (
        <div className="mt-6 rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <p className="font-semibold">Choose a product to edit</p>
          <p className="mt-1 text-sm text-gray-500">Open All products and click Edit on a card.</p>
        </div>
      ) : (
        <form
          onSubmit={tab === "edit" ? handleUpdateProduct : handleCreateProduct}
          className="mt-6 grid gap-6 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-[1.2fr_0.8fr]"
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold">
                {tab === "edit" ? `Edit ${editingProduct?.name}` : "New product"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">Fields marked with * are required.</p>
            </div>

            <label className="block text-sm font-medium">
              Name <span className="text-red-500">*</span>
              <input
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Amul Gold Full Cream Milk"
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
              />
            </label>

            <label className="block text-sm font-medium">
              Description <span className="text-red-500">*</span>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Fresh full cream milk, 500 ml pouch."
                className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Category <span className="text-red-500">*</span>
                <select
                  required
                  value={form.category_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category_id: event.target.value,
                      subcategory_id: "",
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-green-600"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Subcategory <span className="text-red-500">*</span>
                <select
                  required
                  value={form.subcategory_id}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, subcategory_id: event.target.value }))
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-green-600"
                >
                  <option value="">Select subcategory</option>
                  {formSubcategories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                MRP <span className="text-red-500">*</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.mrp_price}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, mrp_price: event.target.value }))
                  }
                  placeholder="68"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
                />
              </label>
              <label className="block text-sm font-medium">
                Selling price <span className="text-red-500">*</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.selling_price}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, selling_price: event.target.value }))
                  }
                  placeholder="64"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Net quantity <span className="text-red-500">*</span>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.net_quantity}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, net_quantity: event.target.value }))
                  }
                  placeholder="500"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
                />
              </label>
              <label className="block text-sm font-medium">
                Unit <span className="text-red-500">*</span>
                <select
                  required
                  value={form.unit}
                  onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-green-600"
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Available</p>
                <p className="text-xs text-gray-500">
                  {form.is_available ? "Shoppers can buy this" : "Hidden from the store"}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.is_available}
                onClick={() =>
                  setForm((current) => ({ ...current, is_available: !current.is_available }))
                }
                className={`relative h-7 w-12 rounded-full transition ${
                  form.is_available ? "bg-green-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition ${
                    form.is_available ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
              >
                {saving && <LoaderCircle className="animate-spin" size={16} />}
                {tab === "edit" ? "Save changes" : "Create product"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setTab("list");
                }}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">
              Product image {tab === "create" && <span className="text-red-500">*</span>}
            </p>
            <p className="mt-1 text-xs text-gray-500">PNG, JPG, or WEBP. Recommended 500 × 500 pixels.</p>
            {form.image_preview ? (
              <div className="mt-3 flex flex-col items-center rounded-3xl bg-[radial-gradient(circle_at_top,#ffffff,#e8f5e9)] p-6">
                <img src={form.image_preview} alt="" className="h-40 w-40 object-contain" />
                <label className="mt-4 cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                  Replace image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) readImage(file);
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
            ) : (
              <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-gray-300 bg-gray-50 px-4 py-16 text-center hover:bg-gray-100">
                <ImageOff size={28} className="text-gray-400" />
                <span className="mt-2 text-sm font-semibold">Upload image</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) readImage(file);
                    event.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
