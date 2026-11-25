
"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import ItemCard from "@/components/ItemCard";
import Checkout from "@/components/Checkout";
import CategoryCard from "@/components/CategoryCard";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/lib/store";
import { increment, decrement, incrementByAmount, decrementByAmount, reset } from "@/lib/features/counter/counterSlice";
import Header from "@/components/Header";
import Image from "next/image";
interface Product {
  id: string;
  name: string;
  description: string;
  category_id: string;
  mrp_price: string;
  selling_price: string;
  product_image_url: string | null;
  unit: string;
  net_quantity: string;
  is_available: boolean;
  subcategory_id: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  is_available: boolean;
}

export default function Home() {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  console.log(filteredProducts);
  const [cartCount, setCartCount] = useState(0);
  const [total, setTotal] = useState<number>(0);


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
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/active`);
      setAllCategories(response?.data?.data as Category[]);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    let pricing = 0

    for (const productKey in cart) {
      const product = allProducts.find((product) => product.id === productKey);
      if (product) {
        pricing += parseInt(product.selling_price) * (cart[productKey as keyof typeof cart] as number);
      }
    }
    setTotal(pricing);
  }, [cart])

  useEffect(() => {
    const fromUrl = searchParams.get("search");
    if (fromUrl) setSearch(fromUrl);
  }, [searchParams]);

  useEffect(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      setFilteredProducts(allProducts);
      return;
    }
    setFilteredProducts(
      allProducts.filter((product) => product.name.toLowerCase().includes(term))
    );
  }, [search, allProducts]);

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
            price: Number(product.selling_price),
            quantity,
            image: product.product_image_url || "",
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
        onPlaceOrder={() => alert("Order placed! 111111111")}
        onChangeQuantity={changeQuantity}
      />
    );
  }

  return (
    <main className="min-h-screen bg-white pb-28 text-gray-900">
      <Header search={search} onSearch={setSearch} />

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

      </section>



      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        {!search.trim() && (
        <div className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
          {allCategories.map((item) => (
            <CategoryCard
              key={item.id}
              id={item.id}
              name={item.name}
              imageUrl={item.image_url || ""}
            />
          ))}
        </div>
        )}

        <div className="mb-5 mt-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">Popular essentials</h2>
          <span className="text-sm text-gray-500">
            {allProducts.length} allProducts
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5">
          {filteredProducts.map((product) => (
            <ItemCard
              key={product.id}
              product={product}
              quantity={cart[product.id] || 0}
              onAdd={() => changeQuantity(product.id, 1)}
              onRemove={() => changeQuantity(product.id, -1)}
            />
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
