"use client";

import { Suspense, useEffect, useState } from "react";
import { SignInButton, useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { Loader2, MapPin, Plus, Trash2 } from "lucide-react";

export const DELIVERY_LOCATION = "14th Avenue, Gaur City 2";

export type DeliveryDetails = {
  receiverName: string;
  receiverPhone: string;
  flatNumber: string;
  tower: string;
};

export const emptyDelivery: DeliveryDetails = {
  receiverName: "",
  receiverPhone: "",
  flatNumber: "",
  tower: "",
};

export function isDeliveryComplete(details: DeliveryDetails) {
  return (
    details.receiverName.trim().length > 0 &&
    details.receiverPhone.length === 10 &&
    details.flatNumber.trim().length > 0 &&
    details.tower.trim().length > 0
  );
}

type SavedAddress = {
  id: string;
  recipient_tower_name: string;
  recipient_flat_number: string;
  recipient_name: string;
  recipient_phone: string;
  is_default: boolean;
};

type DraftAddress = {
  recipient_name: string;
  recipient_phone: string;
  recipient_flat_number: string;
  recipient_tower_name: string;
  is_default: boolean;
};


type DeliveryAddressProps = {
  value: DeliveryDetails;
  onChange: (next: DeliveryDetails) => void;
};

const apiBase = process.env.NEXT_PUBLIC_API_URL;
const fieldClass =
  "mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-700";

const emptyDraft: DraftAddress = {
  recipient_name: "",
  recipient_phone: "",
  recipient_flat_number: "",
  recipient_tower_name: "",
  is_default: true,
};

function asSavedAddress(row: SavedAddress & { recipient_number?: string }): SavedAddress {
  const phone = row.recipient_phone || row.recipient_number || "";
  return {
    ...row,
    recipient_phone: phone.replace(/\D/g, "").slice(-10),
  };
}

function toDetails(address: SavedAddress): DeliveryDetails {
  return {
    receiverName: address.recipient_name,
    receiverPhone: (address.recipient_phone || "").replace(/\D/g, "").slice(-10),
    flatNumber: address.recipient_flat_number,
    tower: address.recipient_tower_name,
  };
}

function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message) return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return "Could not save that address.";
}

export default function DeliveryAddress({ value, onChange }: DeliveryAddressProps) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  console.log("addresses", addresses);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState("");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<DraftAddress>(emptyDraft);
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");

  function choose(address: SavedAddress) {
    setSelectedId(address.id);
    onChange(toDetails(address));
  }

  async function authHeaders() {
    const token = await getToken();
    if (!token) throw new Error("Sign in again to save an address.");
    return { Authorization: `Bearer ${token}` };
  }

  async function loadAddresses(preferId?: string) {
    const headers = await authHeaders();
    const response = await axios.get(`${apiBase}/api/user-addresses`, { headers });
    const rows = ((response.data?.data ?? []) as Array<SavedAddress & { recipient_number?: string }>).map(
      asSavedAddress
    );
    setAddresses(rows);
    const pick =
      rows.find((row) => row.id === preferId) ??
      rows.find((row) => row.is_default) ??
      rows[0];
    if (pick) choose(pick);
    else {
      setSelectedId("");
      onChange(emptyDelivery);
    }
  }

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError("");
      try {
        const headers = await authHeaders();
        const response = await axios.get(`${apiBase}/api/user-addresses`, { headers });
        if (cancelled) return;
        const rows = ((response.data?.data ?? []) as Array<SavedAddress & { recipient_number?: string }>).map(
          asSavedAddress
        );
        setAddresses(rows);
        const pick = rows.find((row) => row.is_default) ?? rows[0];
        if (pick) choose(pick);
      } catch (error) {
        if (!cancelled) setLoadError(errorMessage(error));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // Reload when the Clerk session becomes available.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  function openForm() {
    const rawPhone = user?.phoneNumbers?.[0]?.phoneNumber ?? "";
    const phone = rawPhone.replace(/\D/g, "").slice(-10);
    setDraft({
      recipient_name: user?.fullName ?? "",
      recipient_phone: phone.length === 10 ? phone : "",
      recipient_flat_number: "",
      recipient_tower_name: "",
      is_default: addresses.length === 0,
    });
    setFormError("");
    setAdding(true);
  }

  async function saveAddress() {
    if (
      !draft.recipient_name.trim() ||
      draft.recipient_phone.length !== 10 ||
      !draft.recipient_flat_number.trim() ||
      !draft.recipient_tower_name.trim()
    ) {
      setFormError("Add the receiver name, phone, flat number, and tower.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const headers = await authHeaders();
      const response = await axios.post(
        `${apiBase}/api/user-addresses`,
        {
          recipient_name: draft.recipient_name.trim(),
          recipient_phone: draft.recipient_phone,
          recipient_flat_number: draft.recipient_flat_number.trim(),
          recipient_tower_name: draft.recipient_tower_name.trim(),
          is_default: draft.is_default,
        },
        { headers }
      );
      const savedRaw = (response.data?.address ?? response.data?.data) as
        | (SavedAddress & { recipient_number?: string })
        | undefined;
      const saved = savedRaw ? asSavedAddress(savedRaw) : undefined;
      setAdding(false);
      setDraft(emptyDraft);
      await loadAddresses(saved?.id);
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function makeDefault(address: SavedAddress) {
    setPendingId(address.id);
    setLoadError("");
    try {
      await axios.put(
        `${apiBase}/api/user-addresses/${address.id}/default`,
        {},
        { headers: await authHeaders() }
      );
      await loadAddresses(address.id);
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setPendingId("");
    }
  }

  async function removeAddress(address: SavedAddress) {
    setPendingId(address.id);
    setLoadError("");
    try {
      await axios.delete(`${apiBase}/api/user-addresses/${address.id}`, {
        headers: await authHeaders(),
      });
      await loadAddresses(selectedId === address.id ? undefined : selectedId);
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setPendingId("");
    }
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Delivery address</h2>
        {isSignedIn && !adding && (
          <button
            type="button"
            onClick={openForm}
            className="inline-flex items-center gap-1 text-sm font-semibold text-green-700"
          >
            <Plus size={16} />
            Add address
          </button>
        )}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-green-700 bg-green-50 px-4 py-3">
        <MapPin size={18} className="mt-0.5 shrink-0 text-green-700" />
        <div>
          <p className="font-semibold text-gray-900">{DELIVERY_LOCATION}</p>
          <p className="text-sm text-gray-500">Delivering inside this society</p>
        </div>
      </div>

      {!isLoaded && <p className="mt-4 text-sm text-gray-500">Checking your account…</p>}

      {isLoaded && !isSignedIn && (
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 px-4 py-5 text-center">
          <p className="text-sm text-gray-600">Sign in to save a flat and tower for delivery.</p>
          <Suspense>
            <SignInButton mode="modal">
              <button
                type="button"
                className="mt-3 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-800"
              >
                Login
              </button>
            </SignInButton>
          </Suspense>
        </div>
      )}

      {isSignedIn && (
        <div className="mt-4 space-y-3">
          {loading && (
            <p className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin text-green-700" />
              Loading saved addresses…
            </p>
          )}
          {loadError && <p className="text-sm text-red-600">{loadError}</p>}

          {!loading && addresses.length === 0 && !adding && (
            <p className="text-sm text-gray-500">No saved address yet. Add the flat that should receive this order.</p>
          )}

          {addresses.map((address) => {
            const selected = address.id === selectedId;
            return (
              <div
                key={address.id}
                className={`rounded-xl border p-4 ${
                  selected ? "border-2 border-green-700 bg-green-50" : "border-gray-200 bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => choose(address)}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <span
                    aria-hidden
                    className={`mt-1 h-4 w-4 shrink-0 rounded-full border-[5px] bg-white ${
                      selected ? "border-green-700" : "border-gray-300"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        Flat {address.recipient_flat_number}, Tower {address.recipient_tower_name}
                      </span>
                      {address.is_default && (
                        <span className="rounded-full bg-green-700 px-2 py-0.5 text-[11px] font-semibold text-white">
                          Default
                        </span>
                      )}
                    </span>
                    <span className="mt-1 block text-sm text-gray-500">
                      {address.recipient_name} · +91 {address.recipient_phone}
                    </span>
                  </span>
                </button>
                <div className="mt-3 flex gap-4 pl-7 text-sm font-semibold">
                  {pendingId === address.id ? (
                    <span className="inline-flex items-center gap-1 text-gray-500">
                      <Loader2 size={14} className="animate-spin text-green-700" />
                      Please wait…
                    </span>
                  ) : (
                    <>
                      {!address.is_default && (
                        <button
                          type="button"
                          onClick={() => makeDefault(address)}
                          disabled={Boolean(pendingId) || saving}
                          className="text-green-700 disabled:opacity-60"
                        >
                          Make default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAddress(address)}
                        disabled={Boolean(pendingId) || saving}
                        className="inline-flex items-center gap-1 text-gray-500 disabled:opacity-60"
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {adding && (
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="font-semibold text-gray-900">New address</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700">
                  Receiver name
                  <input
                    disabled={saving}
                    value={draft.recipient_name}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, recipient_name: event.target.value }))
                    }
                    placeholder="Name of the person receiving"
                    className={fieldClass}
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Receiver phone number
                  <span className="mt-1.5 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 focus-within:border-green-700">
                    <span className="text-sm text-gray-500">+91</span>
                    <input
                      disabled={saving}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={10}
                      value={draft.recipient_phone}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          recipient_phone: event.target.value.replace(/\D/g, "").slice(0, 10),
                        }))
                      }
                      placeholder="10-digit mobile number"
                      className="w-full bg-transparent text-sm outline-none"
                    />
                  </span>
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Flat number
                  <input
                    disabled={saving}
                    value={draft.recipient_flat_number}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, recipient_flat_number: event.target.value }))
                    }
                    placeholder="e.g. 402"
                    className={fieldClass}
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Tower
                  <input
                    disabled={saving}
                    value={draft.recipient_tower_name}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, recipient_tower_name: event.target.value }))
                    }
                    placeholder="e.g. A"
                    className={fieldClass}
                  />
                </label>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  disabled={saving}
                  checked={draft.is_default}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, is_default: event.target.checked }))
                  }
                  className="accent-green-700"
                />
                Use as the default address
              </label>
              {formError && <p className="mt-3 text-sm text-red-600">{formError}</p>}
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={saveAddress}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving ? "Saving…" : "Save address"}
                </button>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  disabled={saving}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isSignedIn && selectedId && isDeliveryComplete(value) && (
        <p className="mt-4 text-sm text-gray-500">
          This order goes to {value.receiverName}, Flat {value.flatNumber}, Tower {value.tower}.
        </p>
      )}
    </section>
  );
}
