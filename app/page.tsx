
"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import axios from "axios";
import { Search, ShoppingBasket, MapPin, Plus, Minus } from "lucide-react";
import Checkout from "@/components/Checkout";
import CategoryCard from "@/components/CategoryCard";


interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  image_url: string | null;
  stock_quantity: number;
  is_available: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  is_available: boolean;
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedCategory] = useState<string>("All");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [total, setTotal] = useState<number>(0);

  console.log("all categories 12434", allCategories);


  useEffect(() => {
      const fetchAllProducts = async () => {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/products`);
          setAllProducts(response.data);
          setFilteredProducts(response.data);
          // const categories = [
          //   "All",
          //   ...new Set(response.data.map((product: Product) => product.category)),
          // ];
          // setAllCategories(categories as string[]);

      };
      fetchAllProducts();
  }, []);


  useEffect(() => {
    const fetchCategories = async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`);
      setAllCategories(response?.data?.data as Category[]);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    let pricing = 0

    for (const productKey in cart) {
      const product = allProducts.find((product) => product.id === productKey);
      if (product) {
        pricing += parseInt(product.price) * (cart[productKey as keyof typeof cart] as number);
      }
    }
    setTotal(pricing);
  }, [cart])

  useEffect(() => {
    if((selectedCategory as unknown as string) === "All"){
      setFilteredProducts(allProducts);
      return;
    }
    const filteredData = allProducts.filter((product) => {
      return product.category === (selectedCategory as any);
    });
    setFilteredProducts(filteredData);
  }, [selectedCategory])

  function changeQuantity(id: string, amount: number) {
    setCart((current: { [key: string]: number }) => {
      const next = { ...current };
      const quantity = (next[id as keyof typeof next] || 0) + amount;
      if (quantity <= 0) delete next[id];
      else next[id] = quantity;
      return next;
    });
  }

  useEffect(() => {
    setCartCount(Object.keys(cart).length);
  }, [cart])

  const cartItems = useMemo(
    () =>
      Object.entries(cart).flatMap(([id, quantity]) => {
        const product = allProducts.find((item) => item.id === id);
        if (!product) return [];
        return [
          {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            quantity,
            image: product.image_url || undefined,
          },
        ];
      }),
    [cart, allProducts]
  );

  if (showCheckout) {
    return (
      <Checkout
        cartItems={cartItems}
        onBack={() => setShowCheckout(false)}
        onPlaceOrder={() => alert("Order placed!")}
        onChangeQuantity={changeQuantity}
      />
    );
  }

  return (
    <main className="min-h-screen bg-white pb-28 text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href="/" className="text-xl font-black tracking-tight">
            daily<span className="text-green-600">basket.</span>
          </a>

          <div className="hidden items-center gap-2 text-sm text-gray-500 sm:flex">
            <MapPin size={17} className="text-green-600" />
            Everyday essentials, near you
          </div>

          <div className="flex items-center gap-2 rounded-full bg-gray-50 px-3 py-2 text-sm">
            <ShoppingBasket size={18} />
            <span>{cartCount} items</span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12">
        <p className="mb-2 text-sm font-semibold text-green-700">
          YOUR NEIGHBOURHOOD STORE
        </p>
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
          Daily essentials, made simple.
        </h1>
        <p className="mt-3 text-sm text-gray-500 sm:text-base">
          The things you need, from your local store.
        </p>

        <div className="mt-7 flex max-w-xl items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 focus-within:border-green-600">
          <Search size={20} className="shrink-0 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search milk, snacks, household items..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </section>



      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
          {allCategories.map((item) => (
            <CategoryCard
              key={item.id}
              id={item.id}
              name={item.name}
              imageUrl={item.image_url}
            />
          ))}
        </div>

        <div className="mb-5 mt-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">Popular essentials</h2>
          <span className="text-sm text-gray-500">
            {allProducts.length} allProducts
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
          {filteredProducts.map((product) => (
            <article
              key={product.id}
              className="rounded-2xl border border-gray-100 p-3 transition hover:border-gray-200 sm:p-4"
            >
              {/* <div className={`flex aspect-square items-center justify-center rounded-xl text-6xl ${product.color}`}>
                {product.emoji}
              </div> */}

              <h3 className="mt-1 min-h-10 text-sm font-semibold leading-5">
                {product.name}
              </h3>

              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="font-bold">₹{product.price}</span>

                {cart[product.id] ? (
                  <div className="flex items-center gap-2 rounded-lg bg-green-700 px-2 py-1.5 text-white">
                    <button
                      aria-label={`Remove one ${product.name}`}
                      onClick={() => changeQuantity(product.id, -1)}
                    >
                      <Minus size={15} />
                    </button>
                    <span className="text-sm font-semibold">
                      {cart[product.id]}
                    </span>
                    <button
                      aria-label={`Add one ${product.name}`}
                      onClick={() => changeQuantity(product.id, 1)}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => changeQuantity(product.id, 1)}
                    className="rounded-lg border border-green-700 px-3 py-1.5 text-sm font-semibold text-green-700 hover:bg-green-50"
                  >
                    ADD
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <p className="py-16 text-center text-gray-500">
            No allProducts found. Try another search.
          </p>
        )}
      </section>

      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-100 bg-white p-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">{cartCount} items</p>
              <p className="text-lg font-bold">₹{total.toFixed(2)}</p>
            </div>
            <button
              onClick={() => setShowCheckout(true)}
              className="rounded-xl bg-green-700 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800"
            >
              Continue to checkout →
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
