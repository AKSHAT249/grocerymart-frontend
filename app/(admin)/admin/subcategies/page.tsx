"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  ImageOff,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

type Category = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  is_active: boolean;
};

type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  image_url: string;
  is_active: boolean;
  product_count: number;
};

type SubcategoryForm = {
  category_id: string;
  name: string;
  image_url: string;
  is_active: boolean;
};

type Toast = {
  id: number;
  tone: "success" | "error";
  message: string;
};

const apiBase = process.env.NEXT_PUBLIC_API_URL;

function asRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: Record<string, unknown>[] }).data;
  }
  return [];
}

function normalizeCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    description: String(row.description ?? ""),
    image_url: typeof row.image_url === "string" ? row.image_url : "",
    is_active: row.is_active !== false,
  };
}

function normalizeSubcategory(row: Record<string, unknown>, productCount: number): Subcategory {
  return {
    id: String(row.id ?? ""),
    category_id: String(row.category_id ?? ""),
    name: String(row.name ?? ""),
    image_url: typeof row.image_url === "string" ? row.image_url : "",
    is_active: row.is_active !== false,
    product_count: productCount,
  };
}

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

function blankForm(categoryId: string): SubcategoryForm {
  return {
    category_id: categoryId,
    name: "",
    image_url: "",
    is_active: true,
  };
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ring-4 ${
          active ? "bg-green-500 ring-green-100" : "bg-red-500 ring-red-100"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Thumb({
  src,
  alt,
  broken,
  onError,
}: {
  src: string;
  alt: string;
  broken: boolean;
  onError: () => void;
}) {
  if (!src || broken) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-green-50 text-green-700/40">
        <ImageOff size={18} />
      </div>
    );
  }

  return (
    <img src={src} alt={alt} className="h-full w-full object-contain" onError={onError} />
  );
}

export default function SubcategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [panel, setPanel] = useState<"categories" | "subcategories">("categories");
  const [editorId, setEditorId] = useState<string | null | undefined>(undefined);
  const [form, setForm] = useState<SubcategoryForm>(blankForm(""));


  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  async function fetchCategories() {
    const categoryResponse = await axios.get(`${apiBase}/api/categories/`, { timeout: 12000 });
    const categoryRows = asRows(categoryResponse.data)
      .map(normalizeCategory)
      .filter((category) => category.id);

    setCategories(categoryRows);
    setSelectedId((current) =>
      categoryRows.some((category) => category.id === current)
        ? current
        : categoryRows[0]?.id ?? ""
    );
    return categoryRows;
  }

  async function fetchingSubcategories(categoryRows: Category[] = categories) {
    const productResponse = await axios
      .get(`${apiBase}/api/products`, { timeout: 12000 })
      .catch(() => ({ data: [] }));
    const productCounts: Record<string, number> = {};
    for (const product of asRows(productResponse.data)) {
      const subcategoryId = String(product.subcategory_id ?? "");
      if (!subcategoryId) continue;
      productCounts[subcategoryId] = (productCounts[subcategoryId] ?? 0) + 1;
    }

    const lists = await Promise.all(
      categoryRows.map(async (category) => {
        try {
          const response = await axios.get(`${apiBase}/api/subcategories/${category.id}`, {
            timeout: 12000,
          });
          return asRows(response.data)
            .map((row) => normalizeSubcategory(row, productCounts[String(row.id ?? "")] ?? 0))
            .filter((item) => item.id);
        } catch {
          return [] as Subcategory[];
        }
      })
    );

    const nextSubcategories = lists.flat();
    setSubcategories(nextSubcategories);
    return nextSubcategories;
  }

  useEffect(() => {
    let active = true;

    setLoading(true);
    setLoadError("");
    fetchCategories()
      .then((categoryRows) => {
        if (!active) return;
        return fetchingSubcategories(categoryRows);
      })
      .catch((error) => {
        if (active) setLoadError(errorMessage(error, "Could not load categories."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (editorId === undefined) return;

    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setEditorId(undefined);
      setFormError("");
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editorId]);

  const visibleCategories = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((category) =>
      `${category.name} ${category.description}`.toLowerCase().includes(term)
    );
  }, [categories, query]);

  const selected = categories.find((category) => category.id === selectedId) ?? null;

  const selectedSubcategories = useMemo(
    () => (selected ? subcategories.filter((item) => item.category_id === selected.id) : []),
    [subcategories, selected]
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of subcategories) {
      map[item.category_id] = (map[item.category_id] ?? 0) + 1;
    }
    return map;
  }, [subcategories]);

  function notify(tone: Toast["tone"], message: string) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, tone, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }

  function markBroken(id: string) {
    setBrokenImages((current) => ({ ...current, [id]: true }));
  }

  function openCreate() {
    if (!selected) return;
    setEditorId(null);
    setForm(blankForm(selected.id));
    setImageFile(null);
    setFormError("");
  }

  function openEdit(item: Subcategory) {
    setEditorId(item.id);
    setForm({
      category_id: item.category_id,
      name: item.name,
      image_url: item.image_url,
      is_active: item.is_active,
    });
    setImageFile(null);
    setFormError("");
  }

  function readImage(file: File) {
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      notify("error", "Use a PNG, JPG, or WEBP image.");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((current) => ({ ...current, image_url: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setFormError("Enter a subcategory name.");
      return;
    }
    if (!imageFile) {
      setFormError("Add a subcategory image.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("is_active", form.is_active ? "1" : "0");
    formData.append("image", imageFile);

    const categoryId = form.category_id || selectedId;
    setSaving(true);
    axios.post(`${apiBase}/api/subcategories/${categoryId}`, formData).then(async () => {
      await fetchingSubcategories();
      setSelectedId(categoryId);
      setPanel("subcategories");
      setEditorId(undefined);
      setForm(blankForm(categoryId));
      setImageFile(null);
      notify("success", `${name} added.`);
    }).catch(() => {
      notify("error", `Failed to add ${name}.`);
    })
    .finally(() => {
      setSaving(false);
    });
  }

  function handleUpdate(event: FormEvent) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setFormError("Enter a subcategory name.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("is_active", form.is_active ? "1" : "0");
    if (imageFile) formData.append("image", imageFile);

    setSaving(true);
    axios.put(`${apiBase}/api/subcategories/${editorId}`, formData).then(async () => {
      await fetchingSubcategories();
      notify("success", `${name} updated.`);
    }).catch(() => {
      notify("error", `Failed to update ${name}.`);
    })
    .finally(() => {
      setSaving(false);
      setEditorId(undefined);
      setFormError("");
      setForm(blankForm(form.category_id));
      setImageFile(null);
      setSelectedId(form.category_id);
      setPanel("subcategories");
    })
  }

  const handleDelete = (item: Subcategory) => {
    axios.delete(`${apiBase}/api/subcategories/${item.id}`).then(async () => {
      await fetchingSubcategories();
      notify("success", `${item.name} deleted.`);
    })
    .catch(() => {
      notify("error", `Failed to delete ${item.name}.`);
    });
  }

  function toggleStatus(item: Subcategory) {
    const status = !item.is_active;
    axios.put(`${apiBase}/api/subcategories/${item.id}`, { is_active: status }).then(async () => {
      await fetchingSubcategories();
      notify("success", `${item.name} ${status ? "activated" : "deactivated"}.`);
    }).catch(() => {
      notify("error", `Failed to ${status ? "activate" : "deactivate"} ${item.name}.`);
    });
  }

  const editorOpen = editorId !== undefined;
  const editing = editorId ? subcategories.find((item) => item.id === editorId) : null;

  return (
    <div className="text-gray-900">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Catalog</p>
        <h2 className="mt-1 text-2xl font-bold">Subcategories</h2>
        <p className="mt-1 text-sm text-gray-500">
          Choose an aisle, then add or edit the groups inside it.
        </p>
      </div>

      {loading ? (
        <div className="mt-6 flex flex-col gap-4 lg:h-[calc(100dvh-11rem)] lg:flex-row">
          <div className="h-80 animate-pulse rounded-3xl bg-gray-100 lg:h-full lg:w-[280px]" />
          <div className="h-96 flex-1 animate-pulse rounded-3xl bg-gray-100" />
        </div>
      ) : loadError || !selected ? (
        <div className="mt-6 rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
          <p className="font-semibold">{loadError ? "Could not load the catalog" : "No categories yet"}</p>
          <p className="mt-1 text-sm text-gray-500">
            {loadError || "Add a category first, then come back to group it into subcategories."}
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4 lg:h-[calc(100dvh-11rem)] lg:min-h-[32rem] lg:flex-row">
          <aside
            className={`${
              panel === "subcategories" ? "hidden lg:flex" : "flex"
            } w-full shrink-0 flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm lg:h-full lg:w-[280px]`}
          >
            <div className="border-b border-gray-100 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold">Categories</h3>
                <span className="text-xs font-semibold text-gray-400">{categories.length}</span>
              </div>
              <label className="mt-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <Search size={16} className="shrink-0 text-gray-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search categories"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </label>
            </div>

            <div className="flex-1 space-y-1 overflow-y-auto p-2">
              {visibleCategories.length === 0 ? (
                <p className="px-3 py-10 text-center text-sm text-gray-500">
                  No categories match “{query.trim()}”.
                </p>
              ) : (
                visibleCategories.map((category) => {
                  const active = category.id === selected.id;
                  const count = counts[category.id] ?? 0;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setSelectedId(category.id);
                        setPanel("subcategories");
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left transition ${
                        active ? "bg-green-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-gray-50">
                        <Thumb
                          src={category.image_url}
                          alt=""
                          broken={!!brokenImages[category.id]}
                          onError={() => markBroken(category.id)}
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{category.name}</span>
                        <span className="mt-0.5 block text-xs text-gray-500">
                          {count} {count === 1 ? "subcategory" : "subcategories"}
                        </span>
                      </span>
                      <StatusBadge active={category.is_active} />
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section
            className={`${
              panel === "categories" ? "hidden lg:flex" : "flex"
            } min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm lg:h-full`}
          >
            <div className="flex flex-col gap-4 border-b border-gray-100 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => setPanel("categories")}
                  className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-gray-500 lg:hidden"
                >
                  <ArrowLeft size={16} />
                  Categories
                </button>
                <h3 className="truncate text-lg font-bold">{selected.name}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Manage subcategories under this category.
                </p>
                <p className="mt-2 text-xs font-semibold text-gray-400">
                  {selectedSubcategories.length}{" "}
                  {selectedSubcategories.length === 1 ? "subcategory" : "subcategories"}
                </p>
              </div>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
              >
                <Plus size={16} />
                Add Subcategory
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {selectedSubcategories.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-gray-200 px-6 py-16 text-center">
                  <p className="font-semibold">No subcategories yet</p>
                  <p className="mt-1 text-sm text-gray-500">
                    Add the first group shoppers will see inside {selected.name}.
                  </p>
                  <button
                    type="button"
                    onClick={openCreate}
                    className="mt-5 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
                  >
                    Add Subcategory
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {selectedSubcategories.map((item) => (
                    <article
                      key={item.id}
                      className="relative flex flex-col rounded-3xl border border-gray-100 bg-gray-50/60 p-3"
                    >
                      <div className="absolute right-3 top-3">
                        <StatusBadge active={item.is_active} />
                      </div>
                      <div className="flex gap-3 pr-24">
                        <span className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white">
                          <Thumb
                            src={item.image_url}
                            alt=""
                            broken={!!brokenImages[item.id]}
                            onError={() => markBroken(item.id)}
                          />
                        </span>
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-semibold">{item.name}</h4>
                          <p className="mt-1 text-xs text-gray-500">
                            {item.product_count}{" "}
                            {item.product_count === 1 ? "product" : "products"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-green-700 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50"
                        >
                          <Pencil size={13} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(item)}
                          className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          {item.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-red-100 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {editorOpen && (  
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="subcategory-form-title"
            onSubmit={ editorId ? handleUpdate : handleSubmit}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="subcategory-form-title" className="text-lg font-bold">
                  {editing ? `Edit ${editing.name}` : "New subcategory"}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Name, image, and whether shoppers can see it.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => {
                  setEditorId(undefined);
                  setFormError("");
                }}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <label className="mt-5 block text-sm font-medium">
              Parent Category
              <select
                value={form.category_id}
                onChange={(event) =>
                  setForm((current) => ({ ...current, category_id: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm outline-none focus:border-green-600"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block text-sm font-medium">
              Subcategory Name
              <input
                required
                value={form.name}
                onChange={(event) => {
                  setFormError("");
                  setForm((current) => ({ ...current, name: event.target.value }));
                }}
                placeholder="Enter subcategory name"
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-green-600"
              />
            </label>

            <div className="mt-4">
              <p className="text-sm font-medium">Subcategory Image</p>
              <p className="mt-1 text-xs text-gray-500">PNG, JPG, or WEBP. Recommended 500 × 500 pixels.</p>
              {form.image_url ? (
                <div className="mt-3 flex items-center gap-4">
                  <img
                    src={form.image_url}
                    alt=""
                    className="h-20 w-20 rounded-2xl object-cover"
                  />
                  <div className="flex flex-wrap gap-2">
                    <label className="cursor-pointer rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                      Replace
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
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setForm((current) => ({ ...current, image_url: "" }));
                      }}
                      className="rounded-xl border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center hover:bg-gray-100">
                  <ImageOff size={22} className="text-gray-400" />
                  <span className="mt-2 text-sm font-semibold">Upload image</span>
                  <span className="mt-1 text-xs text-gray-500">PNG, JPG, or WEBP</span>
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

            <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-gray-50 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-xs text-gray-500">
                  {form.is_active ? "Visible to shoppers" : "Hidden from the store"}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.is_active}
                onClick={() =>
                  setForm((current) => ({ ...current, is_active: !current.is_active }))
                }
                className={`relative h-7 w-12 rounded-full transition ${
                  form.is_active ? "bg-green-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition ${
                    form.is_active ? "left-5" : "left-0.5"
                  }`}
                />
              </button>
            </div>

            {formError && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>
            )}

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setEditorId(undefined);
                  setFormError("");
                }}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
              >
                {saving && <LoaderCircle className="animate-spin" size={16} />}
                Save Subcategory
              </button>
            </div>
          </form>
        </div>
      )}


      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
        {toasts.map((toast) => (
          <p
            key={toast.id}
            role="status"
            className={`pointer-events-auto rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
              toast.tone === "success" ? "bg-green-700 text-white" : "bg-red-600 text-white"
            }`}
          >
            {toast.message}
          </p>
        ))}
      </div>
    </div>
  );
}
