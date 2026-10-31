import Link from "next/link";

type CategoryCardProps = {
  id: string;
  name: string;
  imageUrl?: string | null;
};

export default function CategoryCard({ id, name, imageUrl }: CategoryCardProps) {
  return (
    <Link href={`/category/${id}`} className="flex flex-col items-center gap-2">
      <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-[#f3f3f3] p-3">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="text-3xl" aria-hidden>
            🛒
          </span>
        )}
      </div>
      <p className="line-clamp-2 text-center text-sm font-medium leading-5 text-gray-900">
        {name}
      </p>
    </Link>
  );
}
