"use client";

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

type DeliveryAddressProps = {
  value: DeliveryDetails;
  onChange: (next: DeliveryDetails) => void;
};

const fieldClass =
  "mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-700";

export default function DeliveryAddress({ value, onChange }: DeliveryAddressProps) {
  function update(patch: Partial<DeliveryDetails>) {
    onChange({ ...value, ...patch });
  }

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-semibold text-gray-900">1. Delivery address</h2>

      <div className="mt-4 rounded-xl border-2 border-green-700 bg-green-50 p-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-1 h-4 w-4 shrink-0 rounded-full border-[5px] border-green-700 bg-white"
          />
          <div>
            <p className="font-semibold text-gray-900">{DELIVERY_LOCATION}</p>
            <p className="mt-0.5 text-sm text-gray-500">Selected location</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-gray-700">
            Receiver name
            <input
              required
              value={value.receiverName}
              onChange={(event) => update({ receiverName: event.target.value })}
              placeholder="Name of the person receiving"
              className={fieldClass}
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Receiver phone number
            <span className="mt-1.5 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 focus-within:border-green-700">
              <span className="text-sm text-gray-500">+91</span>
              <input
                required
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                value={value.receiverPhone}
                onChange={(event) =>
                  update({
                    receiverPhone: event.target.value.replace(/\D/g, "").slice(0, 10),
                  })
                }
                placeholder="10-digit mobile number"
                className="w-full bg-transparent text-sm outline-none"
              />
            </span>
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Flat number
            <input
              required
              value={value.flatNumber}
              onChange={(event) => update({ flatNumber: event.target.value })}
              placeholder="e.g. 402"
              className={fieldClass}
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Tower
            <input
              required
              value={value.tower}
              onChange={(event) => update({ tower: event.target.value })}
              placeholder="e.g. A"
              className={fieldClass}
            />
          </label>
        </div>
      </div>
    </section>
  );
}
