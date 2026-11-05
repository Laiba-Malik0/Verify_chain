import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  Search,
  Plus,
  Package,
  Boxes,
  ShieldCheck,
  Pencil,
  Archive,
  RotateCcw,
  Eye,
  X,
  Layers3,
  RefreshCw
} from "lucide-react";

import {
  inputClass,
  Modal,
  ProductForm,
  StatCard
} from "./ProductCatalogModals";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const emptyProduct = {
  name: "",
  brand_id: "",
  category: "Personal Care",
  description: "",
  productCode: "",
  batch_number: "",
  manufactured_qty: "1",
  manufacture_date: "",
  scratch_quantity: "1"
};

function getToken() {
  try {
    return JSON.parse(
      localStorage.getItem("verifychain_user")
    )?.token || "";
  } catch {
    return "";
  }
}

async function apiRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || "Request failed. Please try again."
    );
  }

  return data;
}

// Product data + device image ko FormData mein convert karta hai.
function createProductFormData(form) {
  const data = new FormData();

  data.append("brand_id", form.brand_id);
  data.append("product_name", form.product_name);
  data.append("product_code", form.product_code);
  data.append("category", form.category || "");
  data.append("description", form.description || "");

  if (form.image) {
    data.append("image", form.image);
  }

  return data;
}

export default function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [batches, setBatches] = useState([]);
  const [scratchCodes, setScratchCodes] = useState([]);

  const [activeTab, setActiveTab] = useState("active");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");

  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Incomplete registrations ko track karta hai
  // taake retry karne par duplicate product na bane.
  const [pendingRegistration, setPendingRegistration] =
    useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [productData, brandData] = await Promise.all([
        apiRequest("/api/products"),
        apiRequest("/api/brands")
      ]);

      setProducts(productData.products || []);
      setBrands(brandData.brands || []);

      try {
        const batchData = await apiRequest("/api/batches");
        setBatches(batchData.batches || []);
      } catch (err) {
        console.error("Could not fetch batches:", err.message);
        setBatches([]);
      }

      try {
        const codeData = await apiRequest("/api/scratch-codes");

        setScratchCodes(
          codeData.scratchCodes || codeData.codes || []
        );
      } catch (err) {
        console.error(
          "Could not fetch scratch codes:",
          err.message
        );
        setScratchCodes([]);
      }
    } catch (err) {
      setError(err.message || "Could not load catalog data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Active aur archived products ko search/filter karta hai.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products.filter((p) => {
      const isActive = (p.status || "active") === "active";

      const matchesTab =
        activeTab === "active" ? isActive : !isActive;

      const matchesSearch = [
        p.product_name,
        p.product_code,
        p.brand_name,
        p.category,
        p.description
      ].some((value) =>
        String(value || "").toLowerCase().includes(q)
      );

      const matchesCategory =
        category === "All categories" ||
        (p.category || "") === category;

      return matchesTab && matchesSearch && matchesCategory;
    });
  }, [products, search, category, activeTab]);

  function productBatches(productId) {
    return batches.filter(
      (batch) =>
        Number(batch.product_id) === Number(productId)
    );
  }

  const totalUnits = batches.reduce(
    (sum, batch) =>
      sum + Number(batch.manufactured_qty || 0),
    0
  );

  // Product edit aur new product registration.
  async function saveProduct(form) {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      // Existing product update
      if (selected?.product_id && modal === "edit") {
        await apiRequest(
          `/api/products/${selected.product_id}`,
          {
            method: "PUT",
            body: createProductFormData(form)
          }
        );

        setModal(null);
        setSelected(null);
        setNotice("Product updated successfully.");

        await loadData();
        return;
      }

      let productId = pendingRegistration?.productId;
      let batchId = pendingRegistration?.batchId;

      // Step 1: Product create karo, agar pehle create nahi hua.
      if (!productId) {
        const result = await apiRequest("/api/products", {
          method: "POST",
          body: createProductFormData(form)
        });

        productId = Number(result.product_id);

        if (!productId) {
          throw new Error(
            "Product API did not return product_id. Check the backend response."
          );
        }

        setPendingRegistration({
          productId,
          batchId: null
        });
      }

      // Step 2: Batch create karo.
      if (!batchId) {
        try {
          const result = await apiRequest("/api/batches", {
            method: "POST",
            body: JSON.stringify({
              product_id: productId,
              batch_number: form.batch_number,
              manufactured_qty: Number(
                form.manufactured_qty
              ),
              manufacture_date: form.manufacture_date
            })
          });

          batchId = Number(result.batch_id);

          if (!batchId) {
            throw new Error(
              "Backend did not return batch_id."
            );
          }

          setPendingRegistration({
            productId,
            batchId
          });
        } catch (err) {
          throw new Error(
            `Product ID ${productId} has been created, but batch creation failed: ${err.message}. Correct the issue and retry without registering the product again.`
          );
        }
      }

      // Step 3: Batch ke liye scratch codes generate karo.
      try {
        await apiRequest("/api/scratch-codes/generate", {
          method: "POST",
          body: JSON.stringify({
            batch_id: batchId,
            quantity: Number(form.scratch_quantity)
          })
        });
      } catch (err) {
        throw new Error(
          `Product and batch have been created, but scratch-code generation failed: ${err.message}. Do not register another product or batch. Retry after checking the scratch-code API.`
        );
      }

      setPendingRegistration(null);
      setModal(null);
      setSelected(null);

      setNotice(
        `Product, batch and ${Number(
          form.scratch_quantity
        )} scratch codes registered successfully.`
      );

      await loadData();
    } catch (err) {
      setError(err.message || "Could not save product.");
      throw err;
    } finally {
      setSaving(false);
    }
  }

  // Product ko permanently delete karne ke bajaye
  // active/inactive status update hota hai.
  async function changeProductStatus(productId, status) {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      await apiRequest(
        `/api/products/${productId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status })
        }
      );

      setNotice(
        status === "inactive"
          ? "Product archived successfully."
          : "Product restored successfully."
      );

      if (
        Number(selected?.product_id) === Number(productId)
      ) {
        setSelected(null);
        setModal(null);
      }

      await loadData();
    } catch (err) {
      setError(
        err.message || "Could not update product status."
      );
    } finally {
      setSaving(false);
    }
  }

  function closeForm() {
    setModal(null);
    setSelected(null);
    setPendingRegistration(null);
  }

  function openEditModal(product) {
    setSelected({
      ...product,
      name: product.product_name,
      productCode: product.product_code,
      brand_id: String(product.brand_id),
      category: product.category || "",
      description: product.description || ""
    });

    setModal("edit");
  }

  const activeCount = products.filter(
    (p) => (p.status || "active") === "active"
  ).length;

  const archivedCount = products.filter(
    (p) => p.status === "inactive"
  ).length;

  return (
    <div className="min-h-screen bg-[#f7f8f3] p-4 text-[#26372d] sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1440px] space-y-6">

        {/* Page heading and top actions */}
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
        >
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[#68836a]">
              VerifyChain / Administration
            </p>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {activeTab === "active"
                ? "Product Catalog"
                : "Archived Products"}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#778276]">
              Manage products, manufacturing batches and scratch codes.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#dce5d7] bg-white px-4 py-3 text-sm font-semibold text-[#47694d] hover:bg-[#edf3e9] disabled:opacity-60"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            {activeTab === "active" && (
              <button
                onClick={() => {
                  setSelected(null);
                  setPendingRegistration(null);
                  setModal("add");
                }}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#3e6247] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#304f38]"
              >
                <Plus size={17} />
                Register product
              </button>
            )}
          </div>
        </motion.header>

        {/* Error message */}
        {error && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p>{error}</p>

            <button
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Success message */}
        {notice && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <p>{notice}</p>

            <button
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Dashboard statistics */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Package}
            label="Registered products"
            value={loading ? "—" : products.length}
            note="Active and archived records"
          />

          <StatCard
            icon={ShieldCheck}
            label="Registered brands"
            value={loading ? "—" : brands.length}
            note="Brands from MySQL"
          />

          <StatCard
            icon={Layers3}
            label="Registered batches"
            value={loading ? "—" : batches.length}
            note="Records from batches table"
          />

          <StatCard
            icon={Boxes}
            label="Manufactured units"
            value={
              loading ? "—" : totalUnits.toLocaleString()
            }
            note="Sum of batch quantities"
          />
        </div>

        {/* Active and archived tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setActiveTab("active");
              setCategory("All categories");
            }}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
              activeTab === "active"
                ? "bg-[#3e6247] text-white"
                : "border border-[#dce5d7] bg-white text-[#47694d]"
            }`}
          >
            Product Catalog ({activeCount})
          </button>

          <button
            onClick={() => {
              setActiveTab("archived");
              setCategory("All categories");
            }}
            className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
              activeTab === "archived"
                ? "bg-[#3e6247] text-white"
                : "border border-[#dce5d7] bg-white text-[#47694d]"
            }`}
          >
            Archived Products ({archivedCount})
          </button>
        </div>

        {/* Product table */}
        <section className="overflow-hidden rounded-2xl border border-[#e5e9df] bg-white">
          <div className="flex flex-col gap-3 border-b border-[#edf0e9] p-4 sm:p-5 lg:flex-row lg:items-center">

            {/* Search */}
            <div className="relative min-w-0 flex-1">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#899488]"
                size={17}
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${inputClass} pl-10`}
                placeholder="Search product, code, brand or category..."
              />
            </div>

            {/* Category filter */}
            <select
              className={`${inputClass} sm:w-52`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {[
                "All categories",
                ...new Set(
                  products
                    .map((p) => p.category)
                    .filter(Boolean)
                )
              ].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-[#f8f9f5] text-[11px] uppercase tracking-wider text-[#7b8778]">
                <tr>
                  {[
                    "Product",
                    "Product code",
                    "Batch records",
                    "Manufactured",
                    "Actions"
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-4 font-semibold"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf0e9]">
                {filtered.map((p, i) => {
                  const productBatchList = productBatches(
                    p.product_id
                  );

                  const units = productBatchList.reduce(
                    (sum, batch) =>
                      sum + Number(
                        batch.manufactured_qty || 0
                      ),
                    0
                  );

                  return (
                    <motion.tr
                      key={p.product_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        delay: Math.min(i * 0.03, 0.2)
                      }}
                      className="transition hover:bg-[#fbfcf8]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">

                          {/* Product image thumbnail */}
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#edf3e9] text-[#55755b]">
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.product_name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package size={19} />
                            )}
                          </span>

                          <div>
                            <p className="font-semibold text-[#2d4031]">
                              {p.product_name}
                            </p>

                            <p className="mt-1 text-xs text-[#899387]">
                              {p.brand_name} ·{" "}
                              {p.category || "Uncategorized"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-medium">
                        {p.product_code}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium">
                          {productBatchList.length} batch(es)
                        </p>

                        <p className="mt-1 text-xs text-[#879184]">
                          {productBatchList[0]?.batch_number ||
                            "No batch"}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-medium">
                        {units.toLocaleString()}{" "}
                        <span className="text-xs font-normal text-[#879184]">
                          units
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">

                          {/* View product */}
                          <button
                            title="View details"
                            onClick={() => {
                              setSelected(p);
                              setModal("view");
                            }}
                            className="rounded-lg p-2 text-[#66806a] hover:bg-[#edf3e9]"
                          >
                            <Eye size={16} />
                          </button>

                          {/* Edit product */}
                          <button
                            title="Edit product"
                            onClick={() => openEditModal(p)}
                            className="rounded-lg p-2 text-[#66806a] hover:bg-[#edf3e9]"
                          >
                            <Pencil size={16} />
                          </button>

                          {/* Archive or restore */}
                          {activeTab === "active" ? (
                            <button
                              title="Archive product"
                              onClick={() =>
                                changeProductStatus(
                                  p.product_id,
                                  "inactive"
                                )
                              }
                              disabled={saving}
                              className="rounded-lg p-2 text-[#a65e58] hover:bg-red-50 disabled:opacity-50"
                            >
                              <Archive size={16} />
                            </button>
                          ) : (
                            <button
                              title="Restore product"
                              onClick={() =>
                                changeProductStatus(
                                  p.product_id,
                                  "active"
                                )
                              }
                              disabled={saving}
                              className="rounded-lg p-2 text-[#47734e] hover:bg-[#edf3e9] disabled:opacity-50"
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-[#879184]"
                    >
                      No products found matching your search.
                    </td>
                  </tr>
                )}

                {loading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-[#879184]"
                    >
                      Loading products from database...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-[#edf0e9] px-5 py-3 text-xs text-[#879184]">
            Showing {filtered.length} of {products.length} database products
          </div>
        </section>
      </div>

      {/* Add and edit product modal */}
      <AnimatePresence>
        {(modal === "add" || modal === "edit") && (
          <Modal
            title={
              pendingRegistration
                ? "Continue product registration"
                : modal === "add"
                  ? "Register a product"
                  : "Edit product"
            }
            subtitle={
              pendingRegistration
                ? `Product ID: ${pendingRegistration.productId}. Complete the remaining steps.`
                : "Product, batch and scratch-code details."
            }
            onClose={closeForm}
          >
            <ProductForm
              key={`${modal}-${selected?.product_id || "new"}-${pendingRegistration?.productId || ""}`}
              initial={
                modal === "edit"
                  ? selected
                  : { ...emptyProduct }
              }
              brands={brands}
              saving={saving}
              pendingRegistration={pendingRegistration}
              onClose={closeForm}
              onSave={saveProduct}
            />
          </Modal>
        )}

        {/* Product details modal */}
        {modal === "view" && selected && (
          <Modal
            title={selected.product_name}
            subtitle={`Product ID: ${selected.product_id}`}
            onClose={() => {
              setModal(null);
              setSelected(null);
            }}
          >
            <div className="space-y-4">

              {/* Product image */}
              {selected.image_url && (
                <div className="flex justify-center rounded-xl border border-[#e8ece3] bg-white p-3">
                  <img
                    src={selected.image_url}
                    alt={selected.product_name}
                    className="max-h-56 w-full rounded-lg object-contain"
                  />
                </div>
              )}

              {/* Product information */}
              {[
                ["Brand", selected.brand_name],
                ["Product code", selected.product_code],
                ["Category", selected.category],
                [
                  "Status",
                  (selected.status || "active") === "active"
                    ? "Active"
                    : "Archived"
                ],
                [
                  "Created",
                  selected.created_at
                    ? new Date(
                        selected.created_at
                      ).toLocaleDateString()
                    : null
                ]
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#e8ece3] p-3"
                >
                  <p className="text-xs text-[#879184]">
                    {label}
                  </p>

                  <p className="mt-1 break-words text-sm font-semibold">
                    {value || "Not provided"}
                  </p>
                </div>
              ))}

              {/* Product description */}
              <div>
                <h3 className="mb-2 text-sm font-bold">
                  Description
                </h3>

                <p className="text-sm leading-6 text-[#697668]">
                  {selected.description ||
                    "No description provided."}
                </p>
              </div>

              {/* Product batches and scratch codes */}
              <div>
                <h3 className="mb-2 text-sm font-bold">
                  Batch records
                </h3>

                <div className="space-y-2">
                  {productBatches(
                    selected.product_id
                  ).map((batch) => {
                    const batchCodes = scratchCodes.filter(
                      (item) =>
                        Number(item.batch_id) ===
                        Number(batch.batch_id)
                    );

                    return (
                      <div
                        key={batch.batch_id}
                        className="rounded-xl border border-[#e3e9de] p-3"
                      >
                        <p className="font-semibold">
                          {batch.batch_number}
                        </p>

                        <p className="mt-1 text-xs text-[#879184]">
                          Manufactured quantity:{" "}
                          {Number(
                            batch.manufactured_qty || 0
                          ).toLocaleString()}
                        </p>

                        <p className="mt-1 text-xs text-[#879184]">
                          Manufacturing date:{" "}
                          {batch.manufacture_date
                            ? String(
                                batch.manufacture_date
                              ).slice(0, 10)
                            : "Not provided"}
                        </p>

                        <div className="mt-3 border-t border-[#edf0e9] pt-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-[#526753]">
                              Scratch Codes
                            </p>

                            <span className="rounded-full bg-[#edf3e9] px-2 py-1 text-[10px] font-semibold text-[#47694d]">
                              {batchCodes.length} code(s)
                            </span>
                          </div>

                          {batchCodes.length > 0 ? (
                            <div className="space-y-2">
                              {batchCodes.map((item) => {
                                const verified =
                                  String(
                                    item.verification_status || ""
                                  ).toLowerCase() === "verified";

                                return (
                                  <div
                                    key={
                                      item.scratch_id ||
                                      item.scratch_code
                                    }
                                    className="flex flex-col gap-2 rounded-lg bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                                  >
                                    <code className="break-all text-xs font-semibold tracking-wide text-[#334b38]">
                                      {item.scratch_code}
                                    </code>

                                    <span
                                      className={`w-fit rounded-full px-2 py-1 text-[10px] font-semibold ${
                                        verified
                                          ? "bg-amber-100 text-amber-800"
                                          : "bg-emerald-100 text-emerald-800"
                                      }`}
                                    >
                                      {verified
                                        ? "Verified"
                                        : "Unused"}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-xs leading-5 text-[#879184]">
                              No scratch codes found for this batch.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {productBatches(
                    selected.product_id
                  ).length === 0 && (
                    <p className="text-sm text-[#879184]">
                      No batch records found.
                    </p>
                  )}
                </div>
              </div>

              {/* Modal actions */}
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  onClick={() => openEditModal(selected)}
                  className="flex items-center gap-2 rounded-xl bg-[#3e6247] px-4 py-3 text-sm font-semibold text-white"
                >
                  <Pencil size={15} />
                  Edit product
                </button>

                {(selected.status || "active") === "active" ? (
                  <button
                    onClick={() =>
                      changeProductStatus(
                        selected.product_id,
                        "inactive"
                      )
                    }
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 disabled:opacity-50"
                  >
                    <Archive size={15} />
                    Archive
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      changeProductStatus(
                        selected.product_id,
                        "active"
                      )
                    }
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl border border-[#dce5d7] px-4 py-3 text-sm font-semibold text-[#47694d] disabled:opacity-50"
                  >
                    <RotateCcw size={15} />
                    Restore
                  </button>
                )}
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}