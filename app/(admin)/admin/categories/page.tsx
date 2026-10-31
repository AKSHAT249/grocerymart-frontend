"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ImageOff, LoaderCircle, Pencil, Search } from "lucide-react";

type Category = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  is_active: boolean;
};

type CategoryForm = {
  name: string;
  description: string;
  image_url: string;
  is_active: boolean;
};

const emptyForm: CategoryForm = {
  name: "",
  description: "",
  image_url: "",
  is_active: true,
};

const apiBase = process.env.NEXT_PUBLIC_API_URL;

function errorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message) return message;
    if (error.message === "Network Error") {
      return "Could not reach the server. Check that the API is running.";
    }
  }
  return fallback;
}

export default function CategoriesPage() {
  const [tab, setTab] = useState<"list" | "form">("list");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [editing, setEditing] = useState<Category | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  async function loadCategories() {
    const response = await axios.get(`${apiBase}/api/categories`);
    setCategories(response.data.data ?? []);
  }

  useEffect(() => {
    let active = true;

    loadCategories()
      .catch((error) => {
        if (active) setError(errorMessage(error, "Could not load categories."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const visibleCategories = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((category) =>
      `${category.name} ${category.description}`.toLowerCase().includes(term)
    );
  }, [categories, query]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setTab("form");
  }

  function openEdit(category: Category) {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description ?? "",
      image_url: category.image_url ?? "",
      is_active: category.is_active !== false,
    });
    setError("");
    setNotice("");
    setTab("form");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      image_url: form.image_url.trim(),
      is_active: form.is_active,
    };

    try {
      if (editing) {
        await axios.put(`${apiBase}/api/categories/${editing.id}`, payload);
        setNotice(`${payload.name} updated.`);
      } else {
        await axios.post(`${apiBase}/api/categories`, payload);
        setNotice(`${payload.name} added.`);
      }

      await loadCategories();
      setEditing(null);
      setForm(emptyForm);
      setTab("list");
    } catch (error) {
      setError(errorMessage(error, "Could not save the category."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="text-gray-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
            Catalog
          </p>
          <h2 className="mt-1 text-2xl font-bold">Categories</h2>
          <p className="mt-1 text-sm text-gray-500">
            The aisles shoppers browse on the storefront.
          </p>
        </div>

        <div className="inline-flex w-full rounded-full bg-gray-100 p-1 sm:w-auto">
          <button
            type="button"
            onClick={() => setTab("list")}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition sm:flex-none ${
              tab === "list"
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            All categories
          </button>
          <button
            type="button"
            onClick={() => (editing ? setTab("form") : openCreate())}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition sm:flex-none ${
              tab === "form"
                ? "bg-white text-green-700 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {editing ? "Edit category" : "Add category"}
          </button>
        </div>
      </div>

      {notice && (
        <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          {notice}
        </p>
      )}
      {error && tab === "list" && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {tab === "list" ? (
        <section className="mt-6">
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
            <Search size={18} className="shrink-0 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search fruits, dairy, snacks..."
              className="w-full bg-transparent text-sm outline-none"
            />
            <span className="shrink-0 text-xs font-semibold text-gray-400">
              {visibleCategories.length}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-64 animate-pulse rounded-3xl bg-gray-100"
                />
              ))}
            </div>
          ) : visibleCategories.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
              <p className="font-semibold">No categories yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Add the first aisle shoppers will see.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-5 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
              >
                Add category
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {visibleCategories.map((category) => (
                <article
                  key={category.id}
                  className="flex flex-col rounded-3xl border border-gray-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex aspect-square items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,#ffffff,#e8f5e9)]">
                    {category.image_url && !brokenImages[category.id] ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="h-4/5 w-4/5 object-contain"
                        onError={() =>
                          setBrokenImages((current) => ({
                            ...current,
                            [category.id]: true,
                          }))
                        }
                      />
                    ) : (
                      <ImageOff className="text-green-700/40" size={36} />
                    )}
                  </div>

                  <h3 className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold leading-5">
                    {category.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-xs leading-5 text-gray-500">
                    {category.description}
                  </p>

                  <button
                    type="button"
                    onClick={() => openEdit(category)}
                    className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-green-700 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
                  >
                    <Pencil size={15} />
                    Edit
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-6 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-[1.2fr_0.8fr]"
        >
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold">
                {editing ? `Edit ${editing.name}` : "New category"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Name, a short description, and the image shoppers see.
              </p>
            </div>

            <label className="block text-sm font-medium">
              Name
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Fruits & Vegetables"
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
              />
            </label>

            <label className="block text-sm font-medium">
              Description
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Fresh, handpicked fruits and farm-fresh vegetables."
                className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
              />
            </label>

            <label className="block text-sm font-medium">
              Image URL
              <input
                required
                type="url"
                value={form.image_url}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    image_url: event.target.value,
                  }))
                }
                placeholder="https://"
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
              />
            </label>

            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    is_active: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-green-700"
              />
              Visible in the store
            </label>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
              >
                {saving && <LoaderCircle className="animate-spin" size={16} />}
                {editing ? "Save changes" : "Add category"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(emptyForm);
                  setError("");
                  setTab("list");
                }}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-3xl bg-[radial-gradient(circle_at_top,#ffffff,#e8f5e9)] p-6">
            {form.image_url ? (
              <img
                src={form.image_url}
                alt={form.name || "Category preview"}
                className="h-40 w-40 object-contain"
              />
            ) : (
              <ImageOff className="text-green-700/40" size={42} />
            )}
            <p className="mt-4 text-center text-sm font-semibold">
              {form.name || "Category preview"}
            </p>
            <p className="mt-1 line-clamp-3 text-center text-xs text-gray-500">
              {form.description || "The image and name shoppers will see."}
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
