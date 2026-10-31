
import { useEffect, useState, useCallback } from "react";
import {
  ShieldCheck,
  Search,
  PackageCheck,
  AlertTriangle,
  History,
  ScanLine,
  Info,
  Send,
  FileWarning,
  CheckCircle2,
} from "lucide-react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "") + "/api";

function getToken() {
  try {
    const user = JSON.parse(
      localStorage.getItem("verifychain_user") || "null"
    );
    return user?.token || "";
  } catch {
    return "";
  }
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("Please log in to your customer account first.");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    throw new Error(
      data.message ||
        (response.status === 403
          ? "Please log in with a customer account."
          : "Request failed. Please try again.")
    );
  }

  return data;
}

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString();
}

function mapHistoryItem(item) {
  const result = item.verification_result;

  let type = "notfound";

  if (result === "registered") type = "registered";
  if (result === "already_verified") type = "already_verified";

  return {
    id: item.verification_id,
    code: item.entered_code || "",
    name: item.product_name || "Product Not Found",
    batch: item.batch_number || "Not available",
    type,
    checkedAt: formatDate(item.verification_date),
  };
}

export default function CustomerPortal() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [showReport, setShowReport] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const [report, setReport] = useState({
    productName: "",
    code: "",
    seller: "",
    location: "",
    description: "",
  });

  const [reportMessage, setReportMessage] = useState("");
  const [reportError, setReportError] = useState("");

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const data = await apiRequest("/customer/history");
      setHistory((data.history || []).map(mapHistoryItem));
    } catch (error) {
      setHistoryError(
        error.message || "Could not load verification history."
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function verifyProduct(e) {
    e.preventDefault();

    const enteredCode = code.trim();

    setShowReport(false);
    setReportMessage("");
    setReportError("");
    setResult(null);

    if (!enteredCode) {
      setResult({
        type: "notfound",
        name: "Enter a product code",
        batch: "-",
        message: "Please enter the code printed on the product packaging.",
      });
      return;
    }

    setVerifyLoading(true);

    try {
      const data = await apiRequest("/verification", {
        method: "POST",
        body: JSON.stringify({ scratch_code: enteredCode }),
      });

      const product = data.product || {};
      let verification;

      if (data.result === "registered") {
        verification = {
          type: "registered",
          name: product.product_name || "Registered Product",
          batch: product.batch_number || "Not available",
          productCode: product.product_code || enteredCode,
          message:
            data.message ||
            "This code matched a registered product and was verified for the first time.",
        };
      } else if (data.result === "already_verified") {
        verification = {
          type: "already_verified",
          name: product.product_name || "Previously Verified Product",
          batch: product.batch_number || "Not available",
          productCode: product.product_code || enteredCode,
          message:
            data.message ||
            "This scratch code has already been used for verification. Check the product carefully.",
        };
      } else {
        verification = {
          type: "notfound",
          name: "Product Not Verified",
          batch: "-",
          productCode: enteredCode,
          message:
            data.message ||
            "This code was not found in the VerifyChain registry. Check the code or submit a report.",
        };
      }

      setResult(verification);

      setReport({
        productName:
          verification.type !== "notfound" ? verification.name : "",
        code: enteredCode,
        seller: "",
        location: "",
        description: "",
      });

      await loadHistory();
    } catch (error) {
      setResult({
        type: "error",
        name: "Verification Failed",
        batch: "-",
        productCode: enteredCode,
        message:
          error.message ||
          "Could not connect to the server. Please try again.",
      });
    } finally {
      setVerifyLoading(false);
    }
  }

  async function submitReport(e) {
    e.preventDefault();
    setReportMessage("");
    setReportError("");

    if (!report.code.trim()) {
      setReportError("Product code is required.");
      return;
    }

    if (
      !report.description.trim() &&
      !report.seller.trim() &&
      !report.location.trim()
    ) {
      setReportError(
        "Please provide additional details, seller information, or purchase location."
      );
      return;
    }

    setReportLoading(true);

    try {
      const data = await apiRequest("/customer/reports", {
        method: "POST",
        body: JSON.stringify({
          product_name: report.productName.trim(),
          scratch_code: report.code.trim(),
          seller: report.seller.trim(),
          location: report.location.trim(),
          description: report.description.trim(),
        }),
      });

      setReportMessage(
        data.message || "Your report was submitted successfully."
      );

      setShowReport(false);

      setReport({
        productName: "",
        code: "",
        seller: "",
        location: "",
        description: "",
      });
    } catch (error) {
      setReportError(
        error.message || "Could not submit the report. Please try again."
      );
    } finally {
      setReportLoading(false);
    }
  }

  function openReport() {
    setReport((previous) => ({
      ...previous,
      code: code.trim(),
      productName:
        result?.type !== "notfound" && result?.type !== "error"
          ? result?.name || ""
          : "",
    }));

    setReportMessage("");
    setReportError("");
    setShowReport(true);
  }

  const resultIsRegistered = result?.type === "registered";
  const resultWasUsed = result?.type === "already_verified";
  const resultIsError = result?.type === "error";

  return (
    <div className="mx-auto max-w-6xl space-y-7">

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-[#294535] p-7 text-white shadow-sm md:p-10">
        <div className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-2 -top-6 h-44 w-44 rounded-full border border-white/10" />

        <div className="relative">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#d3e2d1]">
            VERIFY PRODUCT AUTHENTICITY
          </p>

          <h1 className="mt-3 text-3xl font-bold leading-tight md:text-5xl">
            Buy with confidence.
            <span className="block text-[#c9dfbf]">
              Check before you trust.
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-[#e0e9df] md:text-base">
            Check whether your product code matches a record registered
            with the brand in our verification registry.
          </p>
        </div>
      </section>

      {/* Product Verification */}
      <section
        id="verify-product"
        className="scroll-mt-6 rounded-3xl border border-[#e2e6dc] bg-white p-6 md:p-8"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e9f0e4] text-[#345b42]">
            <ScanLine size={24} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#294535]">
              Verify Your Product
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              Enter the unique scratch code printed on the product packaging.
            </p>
          </div>
        </div>

        <form
          onSubmit={verifyProduct}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative min-w-0 flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setResult(null);
                setShowReport(false);
                setReportMessage("");
                setReportError("");
              }}
              placeholder="Enter product scratch code..."
              aria-label="Product verification code"
              className="w-full rounded-xl border border-gray-200 bg-[#fcfcf9] py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-[#71947a] focus:ring-2 focus:ring-[#71947a]/10"
            />
          </div>

          <button
            type="submit"
            disabled={verifyLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#345b42] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#294535] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ShieldCheck size={18} />
            {verifyLoading ? "Checking..." : "Verify Code"}
          </button>
        </form>

        {result && (
          <div
            className={`mt-6 rounded-2xl border p-5 ${
              resultIsRegistered
                ? "border-[#c8dfc9] bg-[#f0f7ef]"
                : resultWasUsed || resultIsError
                  ? "border-red-200 bg-red-50"
                  : "border-orange-200 bg-orange-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {resultIsRegistered ? (
                <PackageCheck
                  size={28}
                  className="mt-0.5 shrink-0 text-[#345b42]"
                />
              ) : (
                <AlertTriangle
                  size={28}
                  className={`mt-0.5 shrink-0 ${
                    resultWasUsed || resultIsError
                      ? "text-red-700"
                      : "text-orange-700"
                  }`}
                />
              )}

              <div className="min-w-0 flex-1">
                <h3
                  className={`font-bold ${
                    resultIsRegistered
                      ? "text-[#345b42]"
                      : resultWasUsed || resultIsError
                        ? "text-red-800"
                        : "text-orange-800"
                  }`}
                >
                  {resultIsRegistered
                    ? "Product Registered with Brand"
                    : resultWasUsed
                      ? "Code Already Used"
                      : resultIsError
                        ? "Verification Error"
                        : "Product Could Not Be Verified"}
                </h3>

                <p className="mt-1 text-sm leading-6 text-gray-600">
                  {result.message}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 border-t border-black/10 pt-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500">Product Name</p>
                <p className="mt-1 break-words text-sm font-semibold text-[#294535]">
                  {result.name}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Batch Number</p>
                <p className="mt-1 text-sm font-semibold text-[#294535]">
                  {result.batch}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Entered Code</p>
                <p className="mt-1 break-all text-sm font-semibold text-[#294535]">
                  {result.productCode || code.trim()}
                </p>
              </div>
            </div>

            {resultIsRegistered ? (
              <div className="mt-5 flex items-start gap-2 rounded-xl bg-white/70 p-3 text-xs leading-5 text-[#345b42]">
                <ShieldCheck size={17} className="mt-0.5 shrink-0" />
                The code matched a registered record and was verified for
                the first time. 
              </div>
            ) : !resultIsError ? (
              <button
                onClick={openReport}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[#345b42] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#294535]"
              >
                <FileWarning size={18} />
                Report a Fake Product
              </button>
            ) : null}
          </div>
        )}

        {reportMessage && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#c8dfc9] bg-[#f0f7ef] p-4 text-sm leading-6 text-[#345b42]">
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            {reportMessage}
          </div>
        )}

        {reportError && !showReport && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {reportError}
          </div>
        )}
      </section>

      {/* Report Form */}
      {showReport && (
        <section className="rounded-3xl border border-orange-200 bg-white p-6 md:p-8">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
              <FileWarning size={23} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#294535]">
                Report a Fake Product
              </h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                Share the details so the brand can review the product.
              </p>
            </div>
          </div>

          <form onSubmit={submitReport} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Product Name
                </label>
                <input
                  value={report.productName}
                  onChange={(e) =>
                    setReport({ ...report, productName: e.target.value })
                  }
                  placeholder="Name printed on product"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#71947a]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Product / Scratch Code *
                </label>
                <input
                  required
                  value={report.code}
                  onChange={(e) =>
                    setReport({ ...report, code: e.target.value })
                  }
                  placeholder="Product code"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#71947a]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Seller or Shop
                </label>
                <input
                  value={report.seller}
                  onChange={(e) =>
                    setReport({ ...report, seller: e.target.value })
                  }
                  placeholder="Shop or seller name"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#71947a]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Purchase Location
                </label>
                <input
                  value={report.location}
                  onChange={(e) =>
                    setReport({ ...report, location: e.target.value })
                  }
                  placeholder="City or shop location"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#71947a]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Additional Details
              </label>
              <textarea
                rows={4}
                value={report.description}
                onChange={(e) =>
                  setReport({ ...report, description: e.target.value })
                }
                placeholder="Why do you think this product may be fake?"
                className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-[#71947a]"
              />
            </div>

            <div className="rounded-xl bg-[#f5f4ed] p-4 text-xs leading-5 text-gray-600">
              Your report will be saved in the VerifyChain database for
              authorized administrators to review. This does not automatically
              notify the brand.
            </div>

            {reportError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {reportError}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={reportLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#345b42] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#294535] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={17} />
                {reportLoading ? "Submitting..." : "Submit Report"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowReport(false);
                  setReportError("");
                }}
                className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* How It Works */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[#e2e6dc] bg-white p-5">
          <ScanLine size={23} className="text-[#345b42]" />
          <h3 className="mt-4 font-bold text-[#294535]">1. Scan or Enter</h3>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Use the scratch code printed on the packaging.
          </p>
        </div>

        <div className="rounded-2xl border border-[#e2e6dc] bg-white p-5">
          <Search size={23} className="text-[#345b42]" />
          <h3 className="mt-4 font-bold text-[#294535]">2. Match the Record</h3>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Check whether the code exists in the brand&apos;s registry and
            whether it has already been used.
          </p>
        </div>

        <div className="rounded-2xl border border-[#e2e6dc] bg-white p-5">
          <ShieldCheck size={23} className="text-[#345b42]" />
          <h3 className="mt-4 font-bold text-[#294535]">
            3. Review or Report
          </h3>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Review the registration result or submit a report for
            administrator review.
          </p>
        </div>
      </section>

      {/* Verification History */}
      <section className="rounded-3xl border border-[#e2e6dc] bg-white p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <History size={23} className="text-[#345b42]" />
            <div>
              <h2 className="text-lg font-bold text-[#294535]">
                Recent Verifications
              </h2>
              <p className="text-xs text-gray-500">
                Your latest checks saved in the database
              </p>
            </div>
          </div>

          <button
            onClick={loadHistory}
            disabled={historyLoading}
            className="rounded-lg px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            {historyLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {historyError && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {historyError}
          </div>
        )}

        {historyLoading ? (
          <div className="py-10 text-center text-sm text-gray-500">
            Loading verification history...
          </div>
        ) : history.length === 0 ? (
          <div className="py-10 text-center">
            <History size={30} className="mx-auto text-gray-300" />
            <p className="mt-3 font-medium text-gray-600">
              No verification history yet
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Your database verification records will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {history.slice(0, 10).map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between gap-3 rounded-2xl border border-[#edf0e8] p-4 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 items-start gap-3">
                  {item.type === "registered" ? (
                    <PackageCheck
                      size={21}
                      className="mt-1 shrink-0 text-[#345b42]"
                    />
                  ) : (
                    <AlertTriangle
                      size={21}
                      className="mt-1 shrink-0 text-orange-700"
                    />
                  )}

                  <div className="min-w-0">
                    <p className="break-words font-semibold text-[#294535]">
                      {item.name}
                    </p>
                    <p className="mt-1 break-all text-xs text-gray-500">
                      Code: {item.code}
                    </p>
                    {item.batch !== "Not available" && (
                      <p className="mt-1 text-xs text-gray-500">
                        Batch: {item.batch}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      {item.checkedAt}
                    </p>
                  </div>
                </div>

                <span
                  className={`self-start rounded-full px-3 py-1.5 text-xs font-semibold ${
                    item.type === "registered"
                      ? "bg-[#e9f0e4] text-[#345b42]"
                      : item.type === "already_verified"
                        ? "bg-red-50 text-red-800"
                        : "bg-orange-50 text-orange-800"
                  }`}
                >
                  {item.type === "registered"
                    ? "First Verified"
                    : item.type === "already_verified"
                      ? "Previously Used"
                      : "Not Verified"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Information Note */}
      <section className="flex items-start gap-3 rounded-2xl border border-[#e5e6d9] bg-[#f0f0e6] p-5">
        <Info size={20} className="mt-0.5 shrink-0 text-[#61744e]" />
        <div>
          <h3 className="text-sm font-bold text-[#294535]">
            Verification and reports
          </h3>
          <p className="mt-1 text-xs leading-6 text-gray-600">
            A matching code confirms a registry match, not necessarily the
            physical item&apos;s authenticity. VerifyChain records verification
            attempts and saves customer reports in the database for
            administrator review.
          </p>
        </div>
      </section>
    </div>
  );
}
