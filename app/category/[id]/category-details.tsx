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

export default function CategoryDetails() {
  const params = useParams<{ id: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const id = params.id;
    if (!id) return;

    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${id}`)
      .then((response) => {
        const row = response.data?.data?.[0] ?? response.data?.data;
        if (!row?.id) {
          setMissing(true);
          return;
        }
        setCategory(row);
      })
      .catch(() => setMissing(true));
  }, [params.id]);

  if (missing) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 text-gray-900">
        <Link href="/" className="text-sm font-semibold text-green-700">
          ← Back to store
        </Link>
        <p className="mt-8 text-gray-500">This category could not be found.</p>
      </main>
    );
  }

  if (!category) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-4 py-16 text-center text-sm text-gray-500">
        Loading category...
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8 text-gray-900">
      <Link href="/" className="text-sm font-semibold text-green-700">
        ← Back to store
      </Link>
      <div className="mx-auto mt-8 flex max-w-xs flex-col items-center">
        <div className="flex aspect-square w-full items-center justify-center rounded-3xl bg-[#f3f3f3] p-6">
          {category.image_url ? (
            <img
              src={category.image_url}
              alt={category.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-5xl" aria-hidden>
              🛒
            </span>
          )}
        </div>
        <h1 className="mt-4 text-center text-2xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-center text-sm text-gray-500">
            {category.description}
          </p>
        )}
      </div>
    </main>
  );
}
