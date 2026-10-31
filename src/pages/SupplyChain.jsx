
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeftRight,
  Building2,
  CheckCircle2,
  LoaderCircle,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  X,
  Pencil,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/api`
  : "http://localhost:5000/api";

async function request(path, options = {}) {
  let session = null;

  try {
    session = JSON.parse(
      localStorage.getItem("verifychain_user") || "null"
    );
  } catch {
    session = null;
  }

  if (!session?.token) {
    throw new Error("Authentication token missing. Please log in again.");
  }

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

function getRows(data, keys = []) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  if (Array.isArray(data?.data)) return data.data;

  return [];
}

const emptyPartner = {
  name: "",
  contact_person: "",
  email: "",
  phone: "",
  address: "",
};

const emptyTransfer = {
  batch_id: "",
  distributor_id: "",
  retailer_id: "",
  quantity: "",
};

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-[#71947a]";

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[#e4e7dc] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[#294535]">{value}</p>
        </div>
        <div className="rounded-xl bg-[#e5eddf] p-3 text-[#345b42]">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>
      {children}
    </label>
  );
}

export default function SupplyChain() {
  const [activeTab, setActiveTab] = useState("transfers");
  const [distributors, setDistributors] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [batches, setBatches] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [partnerModal, setPartnerModal] = useState(false);
  const [transferModal, setTransferModal] = useState(false);
  const [partnerType, setPartnerType] = useState("distributor");
  const [editingPartnerId, setEditingPartnerId] = useState(null);
  const [editingTransferId, setEditingTransferId] = useState(null);

  const [partnerForm, setPartnerForm] = useState(emptyPartner);
  const [transferForm, setTransferForm] = useState(emptyTransfer);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        distributorData,
        retailerData,
        transferData,
        batchData,
      ] = await Promise.all([
        request("/distributors"),
        request("/retailers"),
        request("/transfers"),
        request("/batches"),
      ]);

      setDistributors(getRows(distributorData, ["distributors"]));
      setRetailers(getRows(retailerData, ["retailers"]));
      setTransfers(getRows(transferData, ["transfers"]));
      setBatches(getRows(batchData, ["batches"]));
    } catch (err) {
      setError(err.message || "Could not load supply chain data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function notify(message) {
    setSuccess(message);
    setError("");
  }

  function openAddPartner(type) {
    setPartnerType(type);
    setEditingPartnerId(null);
    setPartnerForm(emptyPartner);
    setError("");
    setSuccess("");
    setPartnerModal(true);
  }

  function editPartner(type, item) {
    setPartnerType(type);
    setEditingPartnerId(
      type === "distributor" ? item.distributor_id : item.retailer_id
    );

    setPartnerForm({
      name:
        type === "distributor"
          ? item.distributor_name || ""
          : item.retailer_name || "",
      contact_person: item.contact_person || "",
      email: item.email || "",
      phone: item.phone || "",
      address: item.address || "",
    });

    setError("");
    setSuccess("");
    setPartnerModal(true);
  }

  async function savePartner(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const isDistributor = partnerType === "distributor";
    const endpoint = isDistributor ? "/distributors" : "/retailers";
    const isEditing = editingPartnerId !== null;

    const body = isDistributor
      ? {
          distributor_name: partnerForm.name.trim(),
          contact_person: partnerForm.contact_person.trim(),
          email: partnerForm.email.trim() || null,
          phone: partnerForm.phone.trim(),
          address: partnerForm.address.trim(),
        }
      : {
          retailer_name: partnerForm.name.trim(),
          contact_person: partnerForm.contact_person.trim(),
          email: partnerForm.email.trim() || null,
          phone: partnerForm.phone.trim(),
          address: partnerForm.address.trim(),
        };

    try {
      await request(
        isEditing ? `${endpoint}/${editingPartnerId}` : endpoint,
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify(body),
        }
      );

      setPartnerModal(false);
      setPartnerForm(emptyPartner);
      setEditingPartnerId(null);

      await loadData();

      notify(
        `${isDistributor ? "Distributor" : "Retailer"} ${
          isEditing ? "updated" : "added"
        } successfully.`
      );
    } catch (err) {
      setError(err.message || "Could not save partner.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePartner(type, id) {
    if (!window.confirm("Are you sure you want to delete this partner?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const endpoint =
        type === "distributor" ? "/distributors" : "/retailers";

      await request(`${endpoint}/${id}`, { method: "DELETE" });
      await loadData();
      notify("Partner deleted successfully.");
    } catch (err) {
      setError(
        err.message ||
          "Could not delete partner. It may be linked to a transfer."
      );
    }
  }

  // Open a new transfer form.
  function openAddTransfer() {
    setEditingTransferId(null);
    setTransferForm(emptyTransfer);
    setError("");
    setSuccess("");
    setTransferModal(true);
  }

  // Open the selected transfer with its existing values.
  function editTransfer(item) {
    setEditingTransferId(item.transfer_id);

    setTransferForm({
      batch_id: String(item.batch_id ?? ""),
      distributor_id: String(item.distributor_id ?? ""),
      retailer_id: String(item.retailer_id ?? ""),
      quantity: String(item.quantity ?? ""),
    });

    setError("");
    setSuccess("");
    setTransferModal(true);
  }

  // Create or update a transfer.
  async function saveTransfer(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const quantity = Number(transferForm.quantity);

    if (
      !transferForm.batch_id ||
      !transferForm.distributor_id ||
      !transferForm.retailer_id ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      setError("Please enter valid transfer details and quantity.");
      setSaving(false);
      return;
    }

    const body = {
      batch_id: Number(transferForm.batch_id),
      distributor_id: Number(transferForm.distributor_id),
      retailer_id: Number(transferForm.retailer_id),
      quantity,
    };

    const isEditing = editingTransferId !== null;

    try {
      await request(
        isEditing ? `/transfers/${editingTransferId}` : "/transfers",
        {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify(body),
        }
      );

      setTransferModal(false);
      setTransferForm(emptyTransfer);
      setEditingTransferId(null);

      await loadData();

      notify(
        isEditing
          ? "Transfer updated successfully."
          : "Supply chain transfer recorded successfully."
      );
    } catch (err) {
      setError(err.message || "Could not save transfer.");
    } finally {
      setSaving(false);
    }
  }

  function closeTransferModal() {
    if (saving) return;

    setTransferModal(false);
    setTransferForm(emptyTransfer);
    setEditingTransferId(null);
  }

  async function deleteTransfer(id) {
    if (!window.confirm("Delete this transfer record?")) return;

    setError("");
    setSuccess("");

    try {
      await request(`/transfers/${id}`, { method: "DELETE" });
      await loadData();
      notify("Transfer deleted successfully.");
    } catch (err) {
      setError(err.message || "Could not delete transfer.");
    }
  }

  function distributorName(id) {
    const item = distributors.find(
      (d) => Number(d.distributor_id) === Number(id)
    );
    return item?.distributor_name || "Unknown distributor";
  }

  function retailerName(id) {
    const item = retailers.find(
      (r) => Number(r.retailer_id) === Number(id)
    );
    return item?.retailer_name || "Unknown retailer";
  }

  function batchLabel(batch) {
    const batchNumber =
      batch.batch_number || batch.batch_code || batch.batch_id;

    const productName =
      batch.product_name ||
      batch.name ||
      batch.product?.product_name ||
      "";

    return `${productName ? `${productName} · ` : ""}${batchNumber}`;
  }

  const filteredDistributors = distributors.filter((item) =>
    [
      item.distributor_id,
      item.distributor_name,
      item.contact_person,
      item.email,
      item.phone,
      item.address,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredRetailers = retailers.filter((item) =>
    [
      item.retailer_id,
      item.retailer_name,
      item.contact_person,
      item.email,
      item.phone,
      item.address,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredTransfers = transfers.filter((item) =>
    [
      item.transfer_id,
      item.batch_id,
      item.batch_number,
      item.product_name,
      item.distributor_id,
      item.retailer_id,
      distributorName(item.distributor_id),
      retailerName(item.retailer_id),
      item.quantity,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const partners =
    activeTab === "distributors"
      ? filteredDistributors
      : filteredRetailers;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#294535]">
            Supply Chain
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage distributors, retailers and product batch transfers.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#dce4d6] bg-white px-4 py-2.5 text-sm font-semibold text-[#345b42] hover:bg-[#f5f7f1] disabled:opacity-60"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <X size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Truck}
          label="Total Distributors"
          value={distributors.length}
        />
        <StatCard
          icon={Building2}
          label="Total Retailers"
          value={retailers.length}
        />
        <StatCard
          icon={ArrowLeftRight}
          label="Total Transfers"
          value={transfers.length}
        />
        <StatCard
          icon={Package}
          label="Available Batches"
          value={batches.length}
        />
      </div>

      <div className="rounded-2xl border border-[#e4e7dc] bg-white">
        <div className="flex flex-col gap-4 border-b border-[#edf0e8] p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {[
                ["transfers", "Transfers"],
                ["distributors", "Distributors"],
                ["retailers", "Retailers"],
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => {
                    setActiveTab(value);
                    setSearch("");
                    setError("");
                    setSuccess("");
                  }}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    activeTab === value
                      ? "bg-[#345b42] text-white"
                      : "bg-[#f2f3ed] text-gray-600 hover:bg-[#e8ecdf]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                if (activeTab === "transfers") {
                  openAddTransfer();
                } else {
                  openAddPartner(
                    activeTab === "distributors"
                      ? "distributor"
                      : "retailer"
                  );
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#345b42] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#294535]"
            >
              <Plus size={17} />
              {activeTab === "transfers" ? "Add Transfer" : "Add Partner"}
            </button>
          </div>

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-[#71947a]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-sm text-gray-500">
            <LoaderCircle
              size={28}
              className="animate-spin text-[#345b42]"
            />
            Loading supply chain data...
          </div>
        ) : activeTab === "transfers" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-[#f7f8f3] text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4">Transfer ID</th>
                  <th className="px-5 py-4">Batch</th>
                  <th className="px-5 py-4">Distributor ID</th>
                  <th className="px-5 py-4">Distributor</th>
                  <th className="px-5 py-4">Retailer ID</th>
                  <th className="px-5 py-4">Retailer</th>
                  <th className="px-5 py-4">Quantity</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf0e8]">
                {filteredTransfers.map((item) => (
                  <tr
                    key={item.transfer_id}
                    className="hover:bg-[#fbfcf8]"
                  >
                    <td className="px-5 py-4 font-semibold text-[#345b42]">
                      TR-{item.transfer_id}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {item.batch_number ||
                        item.batch_code ||
                        `Batch ${item.batch_id}`}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {item.distributor_id}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {item.distributor_name ||
                        distributorName(item.distributor_id)}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {item.retailer_id}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {item.retailer_name ||
                        retailerName(item.retailer_id)}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {item.quantity}
                    </td>
                    <td className="px-5 py-4 text-gray-500">
                      {item.transfer_date
                        ? new Date(item.transfer_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          title="Edit transfer"
                          onClick={() => editTransfer(item)}
                          className="rounded-lg p-2 text-[#345b42] hover:bg-[#edf3e9]"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          title="Delete transfer"
                          onClick={() => deleteTransfer(item.transfer_id)}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredTransfers.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-12 text-center text-gray-500"
                    >
                      No transfers found. Add a transfer to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-[#f7f8f3] text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4">ID</th>
                  <th className="px-5 py-4">Partner</th>
                  <th className="px-5 py-4">Contact Person</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Phone</th>
                  <th className="px-5 py-4">Address</th>
                  <th className="px-5 py-4">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf0e8]">
                {partners.map((item) => {
                  const isDistributor = activeTab === "distributors";
                  const id = isDistributor
                    ? item.distributor_id
                    : item.retailer_id;

                  return (
                    <tr key={id} className="hover:bg-[#fbfcf8]">
                      <td className="px-5 py-4 font-medium text-gray-600">
                        {id}
                      </td>
                      <td className="px-5 py-4 font-semibold text-[#294535]">
                        {isDistributor
                          ? item.distributor_name
                          : item.retailer_name}
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {item.contact_person || "—"}
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {item.email || "—"}
                      </td>
                      <td className="px-5 py-4 text-gray-700">
                        {item.phone || "—"}
                      </td>
                      <td className="max-w-56 px-5 py-4 text-gray-500">
                        {item.address || "—"}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            title="Edit partner"
                            onClick={() =>
                              editPartner(
                                isDistributor ? "distributor" : "retailer",
                                item
                              )
                            }
                            className="rounded-lg p-2 text-[#345b42] hover:bg-[#edf3e9]"
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            type="button"
                            title="Delete partner"
                            onClick={() =>
                              deletePartner(
                                isDistributor ? "distributor" : "retailer",
                                id
                              )
                            }
                            className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {partners.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-gray-500"
                    >
                      No {activeTab} found. Add a partner to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Distributor or Retailer Modal */}
      {partnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#294535]">
                  {editingPartnerId !== null ? "Edit" : "Add"}{" "}
                  {partnerType === "distributor" ? "Distributor" : "Retailer"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {editingPartnerId !== null
                    ? "Update the partner details."
                    : "Enter the partner details."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPartnerModal(false);
                  setEditingPartnerId(null);
                  setPartnerForm(emptyPartner);
                }}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={savePartner} className="space-y-4">
              <Field
                label={
                  partnerType === "distributor"
                    ? "Distributor Name"
                    : "Retailer Name"
                }
              >
                <input
                  required
                  className={inputClass}
                  value={partnerForm.name}
                  onChange={(e) =>
                    setPartnerForm({
                      ...partnerForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter partner name"
                />
              </Field>

              <Field label="Contact Person">
                <input
                  className={inputClass}
                  value={partnerForm.contact_person}
                  onChange={(e) =>
                    setPartnerForm({
                      ...partnerForm,
                      contact_person: e.target.value,
                    })
                  }
                  placeholder="Contact person's name"
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  className={inputClass}
                  value={partnerForm.email}
                  onChange={(e) =>
                    setPartnerForm({
                      ...partnerForm,
                      email: e.target.value,
                    })
                  }
                  placeholder="partner@example.com"
                />
              </Field>

              <Field label="Phone">
                <input
                  className={inputClass}
                  value={partnerForm.phone}
                  onChange={(e) =>
                    setPartnerForm({
                      ...partnerForm,
                      phone: e.target.value,
                    })
                  }
                  placeholder="Phone number"
                />
              </Field>

              <Field label="Address">
                <textarea
                  rows={2}
                  className={inputClass}
                  value={partnerForm.address}
                  onChange={(e) =>
                    setPartnerForm({
                      ...partnerForm,
                      address: e.target.value,
                    })
                  }
                  placeholder="Partner address"
                />
              </Field>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPartnerModal(false);
                    setEditingPartnerId(null);
                    setPartnerForm(emptyPartner);
                  }}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#345b42] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingPartnerId !== null
                      ? "Update Partner"
                      : "Save Partner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Transfer Modal */}
      {transferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#294535]">
                  {editingTransferId !== null ? "Edit Transfer" : "Record Transfer"}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {editingTransferId !== null
                    ? "Update the batch, distributor, retailer or quantity."
                    : "Link a batch to a distributor and retailer."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeTransferModal}
                disabled={saving}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveTransfer} className="space-y-4">
              <Field label="Product Batch">
                <select
                  required
                  className={inputClass}
                  value={transferForm.batch_id}
                  onChange={(e) =>
                    setTransferForm({
                      ...transferForm,
                      batch_id: e.target.value,
                    })
                  }
                >
                  <option value="">Select a batch</option>
                  {batches.map((batch) => (
                    <option key={batch.batch_id} value={batch.batch_id}>
                      {batchLabel(batch)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Distributor">
                <select
                  required
                  className={inputClass}
                  value={transferForm.distributor_id}
                  onChange={(e) =>
                    setTransferForm({
                      ...transferForm,
                      distributor_id: e.target.value,
                    })
                  }
                >
                  <option value="">Select distributor</option>
                  {distributors.map((item) => (
                    <option
                      key={item.distributor_id}
                      value={item.distributor_id}
                    >
                      {item.distributor_name} (ID: {item.distributor_id})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Retailer">
                <select
                  required
                  className={inputClass}
                  value={transferForm.retailer_id}
                  onChange={(e) =>
                    setTransferForm({
                      ...transferForm,
                      retailer_id: e.target.value,
                    })
                  }
                >
                  <option value="">Select retailer</option>
                  {retailers.map((item) => (
                    <option key={item.retailer_id} value={item.retailer_id}>
                      {item.retailer_name} (ID: {item.retailer_id})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Quantity">
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  className={inputClass}
                  value={transferForm.quantity}
                  onChange={(e) =>
                    setTransferForm({
                      ...transferForm,
                      quantity: e.target.value,
                    })
                  }
                  placeholder="Enter quantity"
                />
              </Field>

              {batches.length === 0 && (
                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                  No batches are available. Create a product batch first.
                </p>
              )}

              {(distributors.length === 0 || retailers.length === 0) && (
                <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                  Add at least one distributor and one retailer before recording a transfer.
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeTransferModal}
                  disabled={saving}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    batches.length === 0 ||
                    distributors.length === 0 ||
                    retailers.length === 0
                  }
                  className="rounded-xl bg-[#345b42] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingTransferId !== null
                      ? "Update Transfer"
                      : "Save Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
