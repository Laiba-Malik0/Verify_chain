import React, { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export const inputClass =
  "w-full rounded-xl border border-[#e1e6dc] bg-white px-3.5 py-3 text-sm text-[#26372d] outline-none transition focus:border-[#63816a] focus:ring-2 focus:ring-[#63816a]/10";

const labelClass =
  "mb-1.5 block text-xs font-semibold text-[#58675a]";

// Reusable form field
export function Field({ label, children }) {
  return (
    <label className="block min-w-0">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

// Reusable modal
export function Modal({ title, subtitle, onClose, children }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#17251b]/45 p-3 backdrop-blur-sm sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10 }}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-[#fbfcf8] shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[#e8ece3] bg-[#fbfcf8] px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-[#26372d]">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 text-xs text-[#788477]">
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#667567] hover:bg-[#edf1e9]"
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>

        <div className="p-5 sm:p-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}

// Dashboard statistic card
export function StatCard({ icon: Icon, label, value, note }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-[#e7ebe2] bg-white p-4 sm:p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[#758174]">
          {label}
        </span>

        <span className="rounded-xl bg-[#edf3e9] p-2 text-[#52765a]">
          <Icon size={18} />
        </span>
      </div>

      <p className="mt-4 text-2xl font-bold tracking-tight text-[#26372d]">
        {value}
      </p>

      <p className="mt-1 text-xs text-[#879184]">{note}</p>
    </motion.div>
  );
}

// Product registration and edit form
export function ProductForm({
  initial,
  brands,
  onSave,
  onClose,
  saving,
  pendingRegistration
}) {
  const [form, setForm] = useState(() => ({ ...initial }));
  const [error, setError] = useState("");

  // Product image states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    initial.image_url || ""
  );

  // Device se image select karna
  function handleImageChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG and WEBP images are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5 MB.");
      e.target.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  }

  const update = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (
      !form.name.trim() ||
      !form.brand_id ||
      !form.productCode.trim()
    ) {
      setError(
        "Product name, brand aur unique product code required hain."
      );
      return;
    }

    // Validate batch and scratch-code details for new products.
    if (!initial.product_id && !pendingRegistration) {
      const manufacturedQty = Number(form.manufactured_qty);
      const scratchQty = Number(form.scratch_quantity);

      if (!form.batch_number.trim() || !form.manufacture_date) {
        setError(
          "Batch number aur manufacturing date required hain."
        );
        return;
      }

      if (
        !Number.isInteger(manufacturedQty) ||
        manufacturedQty < 1
      ) {
        setError(
          "Manufactured quantity positive whole number honi chahiye."
        );
        return;
      }

      if (
        !Number.isInteger(scratchQty) ||
        scratchQty < 1 ||
        scratchQty > 100
      ) {
        setError(
          "Scratch codes ki quantity 1 se 100 honi chahiye."
        );
        return;
      }

      if (scratchQty > manufacturedQty) {
        setError(
          "Scratch codes manufactured quantity se zyada nahi ho sakte."
        );
        return;
      }
    }

    try {
      await onSave({
        brand_id: Number(form.brand_id),
        product_name: form.name.trim(),
        product_code: form.productCode.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        batch_number: form.batch_number.trim(),
        manufactured_qty: Number(form.manufactured_qty),
        manufacture_date: form.manufacture_date,
        scratch_quantity: Number(form.scratch_quantity),

        // Selected device image
        image: imageFile
      });
    } catch (err) {
      setError(err.message || "Product save nahi ho saka.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}

          {pendingRegistration && (
            <p className="mt-2 font-semibold">
              Retry karne se existing product dobara create nahi hoga.
            </p>
          )}
        </div>
      )}

      <div className="space-y-4">
        <Field label="Product name *">
          <input
            required
            className={inputClass}
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Zebaish Floral Dress"
          />
        </Field>

        <Field label="Registered brand *">
          <select
            required
            className={inputClass}
            value={form.brand_id}
            onChange={(e) => update("brand_id", e.target.value)}
          >
            <option value="">Select a registered brand</option>

            {brands.map((brand) => (
              <option
                key={brand.brand_id}
                value={brand.brand_id}
              >
                {brand.brand_name}
              </option>
            ))}
          </select>

          {brands.length === 0 && (
            <p className="mt-1 text-xs text-amber-700">
              No brands found. Register a brand first.
            </p>
          )}
        </Field>

        <Field label="Unique product code *">
          <input
            required
            className={inputClass}
            value={form.productCode}
            onChange={(e) =>
              update("productCode", e.target.value)
            }
            placeholder="e.g. ZB-DRE-002"
          />
        </Field>

        <Field label="Category">
          <select
            className={inputClass}
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
          >
            {[
              "Personal Care",
              "Skincare",
              "Food & Beverage",
              "Pharmaceutical",
              "Electronics",
              "Household",
              "Dresses",
              "Bags",
              "Perfumes",
              "Other"
            ].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Product description">
          <textarea
            rows={3}
            className={inputClass}
            value={form.description}
            onChange={(e) =>
              update("description", e.target.value)
            }
            placeholder="Enter product details..."
          />
        </Field>

        {/* Product image upload */}
        <Field label="Product image">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className={inputClass}
          />

          <p className="mt-1 text-xs text-[#879184]">
            Upload JPG, PNG or WEBP. Maximum size: 5 MB.
          </p>

          {imagePreview && (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#e3e9de] bg-white p-3">
              <img
                src={imagePreview}
                alt="Product preview"
                className="h-20 w-20 rounded-lg object-cover"
              />

              <span className="text-xs text-[#697668]">
                {imageFile
                  ? imageFile.name
                  : "Current product image"}
              </span>
            </div>
          )}
        </Field>
      </div>

      {!initial.product_id && (
        <div className="space-y-4 rounded-xl border border-[#e3e9de] bg-[#f8faf5] p-4">
          <div>
            <h3 className="text-sm font-bold text-[#334b38]">
              Batch Information
            </h3>

            <p className="mt-1 text-xs text-[#788477]">
              Manufacturing details for this product.
            </p>
          </div>

          <Field label="Batch number *">
            <input
              required
              className={inputClass}
              value={form.batch_number}
              onChange={(e) =>
                update("batch_number", e.target.value)
              }
              placeholder="e.g. ZB-BATCH-001"
            />
          </Field>

          <Field label="Manufactured quantity *">
            <input
              required
              type="number"
              min="1"
              step="1"
              className={inputClass}
              value={form.manufactured_qty}
              onChange={(e) =>
                update("manufactured_qty", e.target.value)
              }
            />
          </Field>

          <Field label="Manufacturing date *">
            <input
              required
              type="date"
              className={inputClass}
              value={form.manufacture_date}
              onChange={(e) =>
                update("manufacture_date", e.target.value)
              }
            />
          </Field>

          <div className="border-t border-[#e3e9de] pt-4">
            <h3 className="text-sm font-bold text-[#334b38]">
              Scratch Code Generation
            </h3>

            <p className="mt-1 text-xs leading-5 text-[#788477]">
              Scratch codes will be generated for the new batch.
            </p>
          </div>

          <Field label="Number of scratch codes *">
            <input
              required
              type="number"
              min="1"
              max="100"
              step="1"
              className={inputClass}
              value={form.scratch_quantity}
              onChange={(e) =>
                update("scratch_quantity", e.target.value)
              }
            />
          </Field>
        </div>
      )}

      <p className="text-xs leading-5 text-[#788477]">
        Product, batch and scratch-code records are saved separately
        in MySQL.
      </p>

      <div className="flex flex-col-reverse gap-2 border-t border-[#e8ece3] pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-[#dfe5da] px-5 py-3 text-sm font-semibold text-[#5f6b5e] hover:bg-[#f0f3ed]"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving || brands.length === 0}
          className="rounded-xl bg-[#3e6247] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#304f38] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "Saving..."
            : pendingRegistration
              ? "Continue registration"
              : initial.product_id
                ? "Save changes"
                : "Register product"}
        </button>
      </div>
    </form>
  );
}