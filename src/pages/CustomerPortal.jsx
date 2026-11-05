import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Search,
  ScanLine,
  FileWarning,
  Send,
  History,
  ClipboardList,
  RefreshCw,
  CheckCircle2,
  X,
} from "lucide-react";

import {
  fadeUp,
  staggerContainer,
  PageSection,
  SectionHeading,
  StatCard,
  FormField,
  TextareaField,
  VerificationResultCard,
  EmptyState,
  ReportCard,
  HistoryItem,
  HowItWorks,
  InfoNote,
} from "./CustomerPortalComponents";

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
      data.message || "Request failed. Please try again."
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
  let type = "notfound";

  if (item.verification_result === "registered") {
    type = "registered";
  }

  if (item.verification_result === "already_verified") {
    type = "already_verified";
  }

  return {
    id: item.verification_id,
    code: item.entered_code || "",
    name: item.product_name || "Product Not Found",
    batch: item.batch_number || "Not available",
    type,
    checkedAt: formatDate(item.verification_date),
  };
}

function extractField(description, field) {
  const regex = new RegExp(
    `(?:^|\\n\\n)${field}:\\s*([\\s\\S]*?)(?=\\n\\n|$)`,
    "i"
  );

  return description?.match(regex)?.[1]?.trim() || "";
}

function parseReport(report) {
  const description = report.report_description || "";

  const cleanDescription = description
    .replace(/(?:^|\n\n)Product name:[\s\S]*?(?=\n\n|$)/i, "")
    .replace(/(?:^|\n\n)Seller\/shop:[\s\S]*?(?=\n\n|$)/i, "")
    .replace(/(?:^|\n\n)Purchase location:[\s\S]*?(?=\n\n|$)/i, "")
    .trim();

  return {
    productName:
      report.product_name ||
      extractField(description, "Product name"),
    code: report.scratch_code || "",
    seller: extractField(description, "Seller/shop"),
    location: extractField(description, "Purchase location"),
    description: cleanDescription,
  };
}

const emptyReport = {
  productName: "",
  code: "",
  seller: "",
  location: "",
  description: "",
};

export default function CustomerPortal() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);

  // Report form
  const [report, setReport] = useState(emptyReport);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reportError, setReportError] = useState("");
  const [editingId, setEditingId] = useState(null);

  // My Reports
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const data = await apiRequest("/customer/history");
      setHistory((data.history || []).map(mapHistoryItem));
    } catch (error) {
      setHistoryError(error.message);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError("");

    try {
      const data = await apiRequest("/customer/reports");
      setReports(data.reports || []);
    } catch (error) {
      setReportsError(error.message);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
    loadReports();
  }, [loadHistory, loadReports]);

  // Product verification
  async function verifyProduct(e) {
    e.preventDefault();

    const enteredCode = code.trim();

    setResult(null);

    if (!enteredCode) {
      setResult({
        type: "notfound",
        name: "Enter a product code",
        batch: "-",
        productCode: "",
        message: "Please enter the code printed on the packaging.",
      });
      return;
    }

    setVerifyLoading(true);

    try {
      const data = await apiRequest("/verification", {
        method: "POST",
        body: JSON.stringify({
          scratch_code: enteredCode,
        }),
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
            "This scratch code has already been used. Check the product carefully.",
        };
      } else {
        verification = {
          type: "notfound",
          name: "Product Not Verified",
          batch: "-",
          productCode: enteredCode,
          message:
            data.message ||
            "This code was not found in the VerifyChain registry.",
        };
      }

      setResult(verification);

      // Automatically fill report form if product details are available
      setReport((previous) => ({
        ...previous,
        productName:
          verification.type !== "notfound"
            ? verification.name
            : previous.productName,
        code: enteredCode,
      }));

      await loadHistory();
    } catch (error) {
      setResult({
        type: "error",
        name: "Verification Failed",
        batch: "-",
        productCode: enteredCode,
        message: error.message,
      });
    } finally {
      setVerifyLoading(false);
    }
  }

  // Submit or update report
  async function submitReport(e) {
    e.preventDefault();

    setReportMessage("");
    setReportError("");

    if (
      !report.description.trim() &&
      !report.productName.trim() &&
      !report.seller.trim() &&
      !report.location.trim()
    ) {
      setReportError(
        "Please provide some details about your product issue."
      );
      return;
    }

    setReportLoading(true);

    try {
      const payload = {
        product_name: report.productName,
        scratch_code: report.code,
        seller: report.seller,
        location: report.location,
        description: report.description,
      };

      const endpoint = editingId
        ? `/customer/reports/${editingId}`
        : "/customer/reports";

      const data = await apiRequest(endpoint, {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      setReportMessage(
        data.message ||
          (editingId
            ? "Report updated successfully."
            : "Report submitted successfully.")
      );

      setReport(emptyReport);
      setEditingId(null);

      await loadReports();
    } catch (error) {
      setReportError(error.message);
    } finally {
      setReportLoading(false);
    }
  }

  // Edit report
  function editReport(item) {
    if (item.report_status !== "pending") return;

    setEditingId(item.report_id);
    setReport(parseReport(item));
    setReportMessage("");
    setReportError("");

    document
      .getElementById("report-form")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  // Cancel editing
  function cancelEdit() {
    setEditingId(null);
    setReport(emptyReport);
    setReportError("");
    setReportMessage("");
  }

  // Delete report
  async function deleteReport(reportId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this report?"
    );

    if (!confirmed) return;

    setActionLoading(true);
    setReportsError("");

    try {
      const data = await apiRequest(
        `/customer/reports/${reportId}`,
        { method: "DELETE" }
      );

      if (editingId === reportId) {
        cancelEdit();
      }

      setReportMessage(
        data.message || "Report deleted successfully."
      );

      await loadReports();
    } catch (error) {
      setReportsError(error.message);
    } finally {
      setActionLoading(false);
    }
  }

  const pendingCount = reports.filter(
    (item) => item.report_status === "pending"
  ).length;

  const resolvedCount = reports.filter(
    (item) => item.report_status === "resolved"
  ).length;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="mx-auto max-w-6xl space-y-6 rounded-[2rem] bg-[#f3f5ee] p-3 sm:space-y-7 sm:p-5 md:p-7"
    >
      {/* HERO */}
      <motion.section
        variants={fadeUp}
        className="relative isolate overflow-hidden rounded-[1.8rem] bg-gradient-to-br from-[#294535] via-[#345b42] to-[#49694d] p-6 text-white shadow-[0_15px_40px_rgba(41,69,53,0.16)] sm:p-8 md:p-10"
      >
        <motion.div
          aria-hidden="true"
          animate={{ rotate: 360 }}
          transition={{
            duration: 55,
            repeat: Infinity,
            ease: "linear",
          }}
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10"
        />

        <motion.div
          aria-hidden="true"
          animate={{ y: [0, 12, 0], x: [0, -8, 0] }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="pointer-events-none absolute -right-4 top-8 h-40 w-40 rounded-full border border-white/10 bg-white/[0.025]"
        />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold tracking-[0.17em] text-[#dce9d6]">
            <ShieldCheck size={14} />
            VERIFY PRODUCT AUTHENTICITY
          </div>

          <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            Buy with confidence.
            <span className="mt-1 block text-[#c9dfbf]">
              Check before you trust.
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-sm leading-7 text-[#e0e9df] sm:text-base">
            Verify your product and submit an issue report whenever
            you need assistance from the brand.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("verify-product")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#e4eedc] px-4 py-3 text-xs font-bold text-[#294535] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white"
            >
              <ScanLine size={16} />
              Verify Product
            </button>

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("my-reports")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-xs font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/15"
            >
              <ClipboardList size={16} />
              My Reports
            </button>
          </div>
        </div>
      </motion.section>

      {/* VERIFICATION */}
      <PageSection id="verify-product">
        <SectionHeading
          icon={ScanLine}
          title="Verify Your Product"
          description="Enter the unique scratch code printed on the packaging."
        />

        <form
          onSubmit={verifyProduct}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative min-w-0 flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#98a394]"
            />

            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setResult(null);
              }}
              placeholder="Enter product scratch code..."
              aria-label="Product verification code"
              className="w-full rounded-xl border border-[#e3e8df] bg-[#fbfcf8] py-3.5 pl-11 pr-4 text-sm text-[#344638] outline-none transition placeholder:text-[#a5ada2] hover:border-[#c8d6c4] focus:border-[#71947a] focus:bg-white focus:ring-4 focus:ring-[#71947a]/10"
            />
          </div>

          <button
            type="submit"
            disabled={verifyLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#345b42] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#294535] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ShieldCheck size={18} />
            {verifyLoading ? "Checking..." : "Verify Code"}
          </button>
        </form>

        {result && <VerificationResultCard result={result} />}
      </PageSection>

      {/* REPORT FORM */}
      <PageSection id="report-form">
        <SectionHeading
          icon={FileWarning}
          title={editingId ? "Edit Your Report" : "Report a Product Issue"}
          description="Submit a report for any product-related concern, whether your product is verified or not."
        />

        <form onSubmit={submitReport} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Product Name"
              value={report.productName}
              onChange={(e) =>
                setReport({
                  ...report,
                  productName: e.target.value,
                })
              }
              placeholder="Name printed on product"
            />

            <FormField
              label="Product / Scratch Code"
              value={report.code}
              onChange={(e) =>
                setReport({
                  ...report,
                  code: e.target.value,
                })
              }
              placeholder="Enter code"
              optional
            />

            <FormField
              label="Seller or Shop"
              value={report.seller}
              onChange={(e) =>
                setReport({
                  ...report,
                  seller: e.target.value,
                })
              }
              placeholder="Shop or seller name"
              optional
            />

            <FormField
              label="Purchase Location"
              value={report.location}
              onChange={(e) =>
                setReport({
                  ...report,
                  location: e.target.value,
                })
              }
              placeholder="City or shop location"
              optional
            />
          </div>

          <TextareaField
            label="Complaint Details"
            rows={4}
            value={report.description}
            onChange={(e) =>
              setReport({
                ...report,
                description: e.target.value,
              })
            }
            placeholder="Describe your product issue or concern..."
          />

          <div className="flex items-start gap-3 rounded-xl border border-[#e2e8d9] bg-[#f4f7ef] p-4">
            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-[#54734e]"
            />

            <p className="text-xs leading-6 text-[#697766]">
              Your report will be saved in the VerifyChain database.
              The administrator can review it and update its status
              to Resolved.
            </p>
          </div>

          {reportMessage && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 rounded-xl border border-[#cbdcc5] bg-[#f0f7ed] p-4 text-sm text-[#345b42]"
            >
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              {reportMessage}
            </motion.div>
          )}

          {reportError && (
            <div className="rounded-xl border border-[#efd3cb] bg-[#fff4f0] p-4 text-sm text-[#a45c4b]">
              {reportError}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={reportLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-[#345b42] px-5 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#294535] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={16} />
              {reportLoading
                ? "Please wait..."
                : editingId
                  ? "Update Report"
                  : "Submit Report"}
            </button>

            {editingId ? (
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center gap-2 rounded-xl border border-[#dfe6dc] bg-white px-5 py-3 text-sm font-semibold text-[#667363] transition hover:bg-[#f4f6f1]"
              >
                <X size={16} />
                Cancel Editing
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setReport(emptyReport);
                  setReportMessage("");
                  setReportError("");
                }}
                className="rounded-xl border border-[#dfe6dc] bg-white px-5 py-3 text-sm font-semibold text-[#667363] transition hover:bg-[#f4f6f1]"
              >
                Clear Form
              </button>
            )}
          </div>
        </form>
      </PageSection>

      {/* MY REPORTS */}
      <PageSection id="my-reports">
        <SectionHeading
          icon={ClipboardList}
          title="My Reports"
          description="View and manage your submitted reports."
          action={
            <button
              type="button"
              onClick={loadReports}
              disabled={reportsLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-[#e0e7dc] bg-[#f8faf5] px-3.5 py-2.5 text-xs font-semibold text-[#587052] transition hover:bg-[#edf3e8] disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={reportsLoading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          }
        />

        {/* REPORT COUNTS */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-6 grid grid-cols-2 gap-4"
        >
          <StatCard
            title="Pending Reports"
            count={pendingCount}
            type="pending"
          />

          <StatCard
            title="Resolved Reports"
            count={resolvedCount}
            type="resolved"
          />
        </motion.div>

        {reportsError && (
          <div className="mt-5 rounded-xl border border-[#efd3cb] bg-[#fff4f0] p-4 text-sm text-[#a45c4b]">
            {reportsError}
          </div>
        )}

        {reportsLoading ? (
          <div className="py-12 text-center">
            <RefreshCw
              size={22}
              className="mx-auto animate-spin text-[#789174]"
            />
            <p className="mt-3 text-sm text-[#899387]">
              Loading your reports...
            </p>
          </div>
        ) : reports.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={ClipboardList}
              title="No reports submitted yet"
              description="Your submitted product reports will appear here."
            />
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mt-6 space-y-4"
          >
            {reports.map((item) => (
              <ReportCard
                key={item.report_id}
                item={item}
                parsed={parseReport(item)}
                formatDate={formatDate}
                onEdit={() => editReport(item)}
                onDelete={() => deleteReport(item.report_id)}
                actionLoading={actionLoading}
              />
            ))}
          </motion.div>
        )}
      </PageSection>

      {/* HOW IT WORKS */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <HowItWorks />
      </motion.div>

      {/* VERIFICATION HISTORY */}
      <PageSection>
        <SectionHeading
          icon={History}
          title="Recent Verifications"
          description="Your latest checks saved in the database."
          action={
            <button
              type="button"
              onClick={loadHistory}
              disabled={historyLoading}
              className="inline-flex items-center gap-2 rounded-xl border border-[#e0e7dc] bg-[#f8faf5] px-3.5 py-2.5 text-xs font-semibold text-[#587052] transition hover:bg-[#edf3e8] disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={historyLoading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          }
        />

        {historyError && (
          <div className="mt-5 rounded-xl border border-[#efd3cb] bg-[#fff4f0] p-4 text-sm text-[#a45c4b]">
            {historyError}
          </div>
        )}

        {historyLoading ? (
          <div className="py-10 text-center">
            <RefreshCw
              size={21}
              className="mx-auto animate-spin text-[#789174]"
            />
            <p className="mt-3 text-sm text-[#899387]">
              Loading verification history...
            </p>
          </div>
        ) : history.length === 0 ? (
          <div className="mt-5">
            <EmptyState
              icon={History}
              title="No verification history yet"
              description="Your verification records will appear here."
            />
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="mt-5 space-y-3"
          >
            {history.slice(0, 10).map((item) => (
              <HistoryItem key={item.id} item={item} />
            ))}
          </motion.div>
        )}
      </PageSection>

      {/* INFORMATION */}
      <InfoNote />
    </motion.div>
  );
}