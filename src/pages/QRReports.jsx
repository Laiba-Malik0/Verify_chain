import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Eye,
  Download,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  FileText,
  X,
  RefreshCw,
  CheckCircle2,
  Clock3,
  Package,
  Truck,
  UserRound,
  CalendarDays,
  AlertCircle,
} from "lucide-react";

const API = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "") + "/api/reports";
const input =
  "w-full rounded-xl border border-[#dce4d8] bg-white px-3 py-2.5 text-sm text-[#26372b] outline-none focus:border-[#789477]";

const primary =
  "inline-flex items-center justify-center rounded-xl bg-[#45684c] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#35533b] disabled:cursor-not-allowed disabled:opacity-50";

const secondary =
  "inline-flex items-center justify-center rounded-xl border border-[#dce4d8] bg-white px-4 py-2.5 text-sm font-medium text-[#45684c] transition hover:bg-[#f5f7f1] disabled:opacity-50";

function getToken() {
  try {
    return JSON.parse(
      localStorage.getItem("verifychain_user") || "null"
    )?.token;
  } catch {
    return null;
  }
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function display(value) {
  return value === null || value === undefined || value === ""
    ? "—"
    : String(value);
}

function resultStyle(status) {
  switch (status) {
    case "Verified":
      return "bg-[#e5f1e4] text-[#45684c]";
    case "Already Verified":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-rose-100 text-rose-700";
  }
}

function reportStyle(status) {
  switch (status) {
    case "resolved":
      return "bg-[#e5f1e4] text-[#45684c]";
    case "reviewed":
      return "bg-sky-100 text-sky-700";
    case "pending":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function StatCard({ label, value, Icon, description }) {
  return (
    <div className="rounded-2xl border border-[#e2e8de] bg-white p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf3e9]">
        <Icon size={21} className="text-[#45684c]" />
      </div>

      <p className="text-sm text-[#788578]">{label}</p>

      <p className="mt-1 text-2xl font-semibold text-[#26372b]">
        {value}
      </p>

      <p className="mt-1 text-xs text-[#899487]">{description}</p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-[#edf0e9] py-3 sm:grid-cols-[150px_1fr] sm:gap-4">
      <span className="text-sm text-[#788578]">{label}</span>
      <span className="break-words text-sm font-medium text-[#26372b]">
        {display(value)}
      </span>
    </div>
  );
}

export default function QRReports() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");

    const token = getToken();

    if (!token) {
      setError("Please log in again. Your authentication token was not found.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to fetch verification reports."
        );
      }

      setRecords(Array.isArray(data.records) ? data.records : []);
      setSummary(data.summary || {});
    } catch (err) {
      setError(err.message || "Unable to connect to the backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filtered = records.filter((record) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch = [
      record.customer_name,
      record.customer_email,
      record.user_id,
      record.product_name,
      record.product_code,
      record.batch_number,
      record.entered_code,
      record.verification_status,
      record.report_description,
    ].some((value) =>
      String(value ?? "").toLowerCase().includes(searchText)
    );

    const matchesFilter =
      filter === "All" ||
      (filter === "Verified" &&
        record.verification_status === "Verified") ||
      (filter === "Already Verified" &&
        record.verification_status === "Already Verified") ||
      (filter === "Not Registered" &&
        record.verification_status === "Not Registered") ||
      (filter === "With Report" && record.report_id != null) ||
      (filter === "Pending Reports" &&
        record.report_status === "pending");

    return matchesSearch && matchesFilter;
  });

  async function updateReportStatus(reportId, report_status) {
    const token = getToken();

    if (!token || !reportId) return;

    setUpdating(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/${reportId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ report_status }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to update the report status."
        );
      }

      await fetchReports();

      setSelected((current) =>
        current && Number(current.report_id) === Number(reportId)
          ? { ...current, report_status }
          : current
      );
    } catch (err) {
      setError(err.message || "Unable to update the report.");
    } finally {
      setUpdating(false);
    }
  }

  function exportReport() {
    const headings = [
      "Verification ID",
      "Customer",
      "Customer Email",
      "Product",
      "Product Code",
      "Batch",
      "Scratch Code",
      "Verification Result",
      "Verification Date",
      "Complaint Description",
      "Complaint Status",
    ];

    const rows = filtered.map((record) => [
      record.verification_id,
      record.customer_name,
      record.customer_email,
      record.product_name,
      record.product_code,
      record.batch_number,
      record.entered_code,
      record.verification_status,
      formatDate(record.verification_date),
      record.report_description,
      record.report_status,
    ]);

    const csv = [headings, ...rows]
      .map((row) =>
        row
          .map((value) => {
            let text = String(value ?? "");

            // Prevent spreadsheet formulas from being executed.
            if (/^[\s]*[=+\-@]/.test(text)) {
              text = `'${text}`;
            }

            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "VerifyChain-Verification-Reports.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  const stats = [
    {
      label: "Total Attempts",
      value: summary.total_attempts ?? records.length,
      Icon: FileText,
      description: "Recorded verification attempts",
    },
    {
      label: "First-Time Verified",
      value: summary.first_verified ?? 0,
      Icon: ShieldCheck,
      description: "Codes verified for the first time",
    },
    {
      label: "Already Verified",
      value: summary.already_verified ?? 0,
      Icon: RotateCcw,
      description: "Previously used codes entered again",
    },
    {
      label: "Not Registered",
      value: summary.not_registered ?? 0,
      Icon: AlertTriangle,
      description: "Codes not found in the database",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7f1] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Page header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#26372b] sm:text-3xl">
              Verification & Reports
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-[#788578]">
              Monitor scratch-code verification activity and review
              customer complaints from the VerifyChain database.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={secondary}
              onClick={fetchReports}
              disabled={loading}
            >
              <RefreshCw
                size={16}
                className={`mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            <button
              type="button"
              className={primary}
              onClick={exportReport}
              disabled={loading || filtered.length === 0}
            >
              <Download size={16} className="mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />

            <div className="flex-1">
              <p className="font-medium">Something needs attention</p>
              <p className="mt-1">{error}</p>
            </div>

            <button
              type="button"
              title="Dismiss"
              onClick={() => setError("")}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* Reports table */}
        <div className="overflow-hidden rounded-2xl border border-[#e2e8de] bg-white">
          <div className="border-b border-[#edf0e9] p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[#26372b]">
                  Verification History
                </h2>

                <p className="mt-1 text-sm text-[#788578]">
                  View attempts and inspect any submitted complaints.
                </p>
              </div>

              <span className="rounded-full bg-[#edf3e9] px-3 py-1.5 text-xs font-medium text-[#45684c]">
                {filtered.length} records
              </span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={17}
                  className="absolute left-3 top-3 text-[#899487]"
                />

                <input
                  className={`${input} pl-10`}
                  placeholder="Search customer, product or scratch code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                className={`${input} sm:w-56`}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                aria-label="Filter verification records"
              >
                {[
                  "All",
                  "Verified",
                  "Already Verified",
                  "Not Registered",
                  "With Report",
                  "Pending Reports",
                ].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead className="border-b border-[#e2e8de] bg-[#fafbf8] text-[#788578]">
                <tr>
                  {[
                    "Customer",
                    "Product",
                    "Scratch Code",
                    "Date & Time",
                    "Result",
                    "Complaint",
                    "Details",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-4 py-3 font-medium"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf0e9]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <RefreshCw
                        size={23}
                        className="mx-auto mb-3 animate-spin text-[#45684c]"
                      />
                      <p className="text-sm text-[#788578]">
                        Loading database records...
                      </p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-[#899487]"
                    >
                      <FileText
                        size={28}
                        className="mx-auto mb-3 opacity-60"
                      />
                      No verification records found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((record, index) => (
                    <tr
                      key={
                        record.verification_id ??
                        `${record.user_id}-${record.entered_code}-${index}`
                      }
                      className="transition hover:bg-[#fafbf8]"
                    >
                      <td className="px-4 py-4">
                        <p className="font-medium text-[#26372b]">
                          {display(record.customer_name)}
                        </p>
                        <p className="mt-1 text-xs text-[#899487]">
                          ID: {display(record.user_id)}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="font-medium text-[#26372b]">
                          {display(record.product_name)}
                        </p>
                        <p className="mt-1 text-xs text-[#899487]">
                          {display(record.batch_number)}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-mono text-xs text-[#45684c]">
                          {display(record.entered_code)}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-xs text-[#788578]">
                        {formatDate(record.verification_date)}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-medium ${resultStyle(
                            record.verification_status
                          )}`}
                        >
                          {display(record.verification_status)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {record.report_id != null ? (
                          <div>
                            <span
                              className={`rounded-full px-2.5 py-1.5 text-xs font-medium ${reportStyle(
                                record.report_status
                              )}`}
                            >
                              {display(record.report_status)}
                            </span>
                            <p className="mt-2 text-xs text-[#899487]">
                              Report #{record.report_id}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-[#899487]">
                            No report
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          title="View verification details"
                          aria-label="View verification details"
                          onClick={() => setSelected(record)}
                          className="rounded-lg p-2 text-[#45684c] transition hover:bg-[#edf3e9]"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-[#edf0e9] px-5 py-3 text-xs text-[#899487]">
            Showing {loading ? 0 : filtered.length} of {records.length} fetched
            records.
          </div>
        </div>

        {/* Summary of complaints */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl border border-[#e2e8de] bg-white p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
              <Clock3 size={22} className="text-amber-700" />
            </div>

            <div>
              <p className="text-sm text-[#788578]">Pending Complaints</p>
              <p className="mt-1 text-xl font-semibold text-[#26372b]">
                {summary.pending_reports ?? 0}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-[#e2e8de] bg-white p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf3e9]">
              <CheckCircle2 size={22} className="text-[#45684c]" />
            </div>

            <div>
              <p className="text-sm text-[#788578]">Submitted Complaints</p>
              <p className="mt-1 text-xl font-semibold text-[#26372b]">
                {summary.total_reports ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Details modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-5"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-details-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#fbfcf8] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e2e8de] bg-[#fbfcf8] p-5">
              <div>
                <h2
                  id="report-details-title"
                  className="text-xl font-semibold text-[#26372b]"
                >
                  Verification Details
                </h2>

                <p className="mt-1 text-sm text-[#788578]">
                  Record #{display(selected.verification_id)}
                </p>
              </div>

              <button
                type="button"
                title="Close details"
                onClick={() => setSelected(null)}
                className="rounded-lg p-2 text-[#788578] hover:bg-[#edf3e9]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-5">
              {/* Verification */}
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <ShieldCheck size={19} className="text-[#45684c]" />
                  <h3 className="font-semibold text-[#26372b]">
                    Verification Result
                  </h3>
                </div>

                <div className="rounded-xl border border-[#e2e8de] bg-white px-4">
                  <DetailRow
                    label="Scratch Code"
                    value={selected.entered_code}
                  />
                  <DetailRow
                    label="Result"
                    value={selected.verification_status}
                  />
                  <DetailRow
                    label="Verification Date"
                    value={formatDate(selected.verification_date)}
                  />
                  <DetailRow
                    label="Code Status"
                    value={selected.verification_status === "Not Registered"
                      ? "No matching registered code"
                      : selected.verification_status === "Already Verified"
                      ? "Previously used"
                      : "Verified for the first time"}
                  />
                </div>
              </section>

              {/* Customer */}
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <UserRound size={19} className="text-[#45684c]" />
                  <h3 className="font-semibold text-[#26372b]">Customer</h3>
                </div>

                <div className="rounded-xl border border-[#e2e8de] bg-white px-4">
                  <DetailRow label="Customer ID" value={selected.user_id} />
                  <DetailRow
                    label="Full Name"
                    value={selected.customer_name}
                  />
                  <DetailRow
                    label="Email"
                    value={selected.customer_email}
                  />
                </div>
              </section>

              {/* Product and batch */}
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <Package size={19} className="text-[#45684c]" />
                  <h3 className="font-semibold text-[#26372b]">
                    Product & Batch
                  </h3>
                </div>

                <div className="rounded-xl border border-[#e2e8de] bg-white px-4">
                  <DetailRow
                    label="Product ID"
                    value={selected.product_id}
                  />
                  <DetailRow
                    label="Product Name"
                    value={selected.product_name}
                  />
                  <DetailRow
                    label="Product Code"
                    value={selected.product_code}
                  />
                  <DetailRow label="Category" value={selected.category} />
                  <DetailRow label="Batch ID" value={selected.batch_id} />
                  <DetailRow
                    label="Batch Number"
                    value={selected.batch_number}
                  />
                  <DetailRow
                    label="Manufacture Date"
                    value={selected.manufacture_date}
                  />
                </div>
              </section>

              {/* Supply chain */}
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <Truck size={19} className="text-[#45684c]" />
                  <h3 className="font-semibold text-[#26372b]">
                    Supply Chain
                  </h3>
                </div>

                <div className="rounded-xl border border-[#e2e8de] bg-white p-4">
                  {Array.isArray(selected.supply_chain_details) &&
                  selected.supply_chain_details.length > 0 ? (
                    <div className="space-y-3">
                      {selected.supply_chain_details.map((item, index) => (
                        <div
                          key={`${selected.verification_id}-transfer-${index}`}
                          className="rounded-xl bg-[#f5f7f1] p-3 text-sm leading-6 text-[#45684c]"
                        >
                          <p className="mb-1 font-medium">
                            Transfer {index + 1}
                          </p>
                          <p className="break-words">{item}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#899487]">
                      {selected.product_id
                        ? "No supply-chain transfers are registered for this batch."
                        : "Supply-chain details are unavailable because this code did not match a registered product."}
                    </p>
                  )}
                </div>
              </section>

              {/* Complaint */}
              <section>
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle size={19} className="text-[#45684c]" />
                  <h3 className="font-semibold text-[#26372b]">
                    Customer Complaint
                  </h3>
                </div>

                <div className="rounded-xl border border-[#e2e8de] bg-white p-4">
                  {selected.report_id != null ? (
                    <>
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-[#899487]">Report ID</p>
                          <p className="mt-1 font-medium text-[#26372b]">
                            #{selected.report_id}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-medium ${reportStyle(
                            selected.report_status
                          )}`}
                        >
                          {display(selected.report_status)}
                        </span>
                      </div>

                      <div className="mb-4">
                        <p className="mb-2 text-xs text-[#899487]">
                          Complaint Description
                        </p>

                        <p className="whitespace-pre-wrap break-words rounded-xl bg-[#f5f7f1] p-3 text-sm leading-6 text-[#26372b]">
                          {display(selected.report_description)}
                        </p>
                      </div>

                      <div className="mb-4 flex items-center gap-2 text-xs text-[#788578]">
                        <CalendarDays size={15} />
                        Submitted: {formatDate(selected.report_date)}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {selected.report_status !== "reviewed" &&
                          selected.report_status !== "resolved" && (
                            <button
                              type="button"
                              className={secondary}
                              disabled={updating}
                              onClick={() =>
                                updateReportStatus(
                                  selected.report_id,
                                  "reviewed"
                                )
                              }
                            >
                              <Eye size={16} className="mr-2" />
                              Mark Reviewed
                            </button>
                          )}

                        {selected.report_status !== "resolved" && (
                          <button
                            type="button"
                            className={primary}
                            disabled={updating}
                            onClick={() =>
                              updateReportStatus(
                                selected.report_id,
                                "resolved"
                              )
                            }
                          >
                            <CheckCircle2 size={16} className="mr-2" />
                            Mark Resolved
                          </button>
                        )}

                        {updating && (
                          <span className="self-center text-xs text-[#788578]">
                            Updating status...
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-[#899487]">
                      No report submitted for this verification attempt.
                    </p>
                  )}
                </div>
              </section>

              <div className="flex justify-end border-t border-[#e2e8de] pt-4">
                <button
                  type="button"
                  className={secondary}
                  onClick={() => setSelected(null)}
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}