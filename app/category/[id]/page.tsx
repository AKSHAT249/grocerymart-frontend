import { Suspense } from "react";
import CategoryDetails from "./category-details";

export default function CategoryPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-screen max-w-3xl px-4 py-16 text-center text-sm text-gray-500">
          Loading category...
        </main>
      }
    >
      <CategoryDetails />
    </Suspense>
  );
}
