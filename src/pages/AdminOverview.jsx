import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  ShieldCheck,
  ScanLine,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Sparkles,
  Clock3,
  RefreshCw,
  Leaf,
  CircleCheck,
} from "lucide-react";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "") + "/api";

const initialStats = [
  {
    title: "Total Products",
    value: 0,
    note: "Registered in database",
    icon: Package,
    color: "bg-[#e8efe4] text-[#466b4d]",
  },
  {
    title: "Verified Products",
    value: 0,
    note: "Successful verifications",
    icon: ShieldCheck,
    color: "bg-[#e0eee2] text-[#39754b]",
  },
  {
    title: "Total Scans",
    value: 0,
    note: "Verification attempts",
    icon: ScanLine,
    color: "bg-[#eeeddf] text-[#777345]",
  },
  {
    title: "Not Verified",
    value: 0,
    note: "Unregistered code attempts",
    icon: ShieldAlert,
    color: "bg-[#f6e9df] text-[#ad704b]",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35 },
  },
};

function getToken(user) {
  return (
    user?.token ||
    user?.accessToken ||
    user?.access_token ||
    user?.access ||
    ""
  );
}

function formatTime(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getResultLabel(result) {
  const value = String(result || "").toLowerCase().trim();

  if (
    value.includes("not_registered") ||
    value.includes("not registered")
  ) {
    return "Not Registered";
  }

  if (
    value.includes("already_verified") ||
    value.includes("already verified")
  ) {
    return "Already Verified";
  }

  if (
    value === "registered" ||
    value === "verified" ||
    value === "original"
  ) {
    return "Verified";
  }

  return result || "Unknown";
}

function isSuccessful(result) {
  const value = String(result || "").toLowerCase().trim();

  return (
    value === "registered" ||
    value === "verified" ||
    value === "original" ||
    value.includes("already_verified") ||
    value.includes("already verified")
  );
}

function getBrandList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.brands)) return data.brands;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

function getBrandDisplayName(brand) {
  return (
    brand?.brand_name ||
    brand?.brandName ||
    brand?.name ||
    ""
  );
}

function StatCard({ stat }) {
  const Icon = stat.icon;

  return (
    <motion.article
      variants={itemVariants}
      whileHover={{ y: -3 }}
      className="min-w-0 rounded-2xl border border-[#e8e9df] bg-[#fffefa] p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium leading-5 text-[#788479]">
          {stat.title}
        </p>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.color}`}
        >
          <Icon size={21} strokeWidth={1.8} />
        </div>
      </div>

      <h3 className="mt-5 break-words text-3xl font-semibold tracking-tight text-[#2d4334] sm:text-4xl">
        {Number(stat.value || 0).toLocaleString()}
      </h3>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-[#839087]">
        {stat.title === "Not Verified" ? (
          <AlertTriangle size={14} className="text-[#b87950]" />
        ) : (
          <ArrowUpRight size={14} className="text-[#5b8a64]" />
        )}

        {stat.note}
      </p>
    </motion.article>
  );
}

export default function AdminOverview({ user }) {
  const [products, setProducts] = useState([]);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});
  const [brandName, setBrandName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      // Load products from the database.
      const productResponse = await fetch(`${API_URL}/products`);

      if (!productResponse.ok) {
        throw new Error(
          `Products API failed (${productResponse.status}).`
        );
      }

      const productData = await productResponse.json();

      if (productData.success === false) {
        throw new Error(
          productData.message || "Could not load products."
        );
      }

      const productList = Array.isArray(productData)
        ? productData
        : Array.isArray(productData.products)
          ? productData.products
          : [];

      setProducts(productList);

      // Load the brand name from the database.
      try {
        const brandResponse = await fetch(`${API_URL}/brands`);

        if (brandResponse.ok) {
          const brandData = await brandResponse.json();
          const brands = getBrandList(brandData);

          const adminBrandId = user?.brand_id ?? user?.brandId;

          const matchingBrand =
            adminBrandId != null
              ? brands.find(
                  (brand) =>
                    String(brand.brand_id ?? brand.id) ===
                    String(adminBrandId)
                )
              : null;

          const selectedBrand = matchingBrand || brands[0];
          const fetchedName = getBrandDisplayName(selectedBrand);

          if (fetchedName) {
            setBrandName(fetchedName);
          }
        }
      } catch (brandError) {
        console.error("Could not load brand name:", brandError);
      }

      // Reports require an admin token.
      const token = getToken(user);

      if (!token) {
        setSummary({});
        setRecords([]);
        setError(
          "Products loaded, but verification reports require an admin login token. Please log in again."
        );
        return;
      }

      const reportResponse = await fetch(`${API_URL}/reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!reportResponse.ok) {
        if (
          reportResponse.status === 401 ||
          reportResponse.status === 403
        ) {
          throw new Error(
            "Reports access denied. Your admin session may have expired. Please log in again."
          );
        }

        throw new Error(
          `Reports API failed (${reportResponse.status}).`
        );
      }

      const reportData = await reportResponse.json();

      if (reportData.success === false) {
        throw new Error(
          reportData.message || "Could not load verification reports."
        );
      }

      setSummary(reportData.summary || {});
      setRecords(
        Array.isArray(reportData.records)
          ? reportData.records
          : []
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the backend. Check that the server is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const totalProducts = products.length;

  const successfulVerifications =
    Number(summary.first_verified || 0) +
    Number(summary.already_verified || 0);

  const totalScans = Number(summary.total_attempts || 0);
  const notVerified = Number(summary.not_registered || 0);

  const stats = initialStats.map((stat) => {
    if (stat.title === "Total Products") {
      return { ...stat, value: totalProducts };
    }

    if (stat.title === "Verified Products") {
      return { ...stat, value: successfulVerifications };
    }

    if (stat.title === "Total Scans") {
      return { ...stat, value: totalScans };
    }

    return { ...stat, value: notVerified };
  });

  const verificationRate =
    totalScans > 0
      ? Math.round(
          (successfulVerifications / totalScans) * 100
        )
      : 0;

  const recentRecords = [...records]
    .sort((a, b) => {
      const dateA = new Date(
        a.verification_date || a.report_date || 0
      ).getTime();

      const dateB = new Date(
        b.verification_date || b.report_date || 0
      ).getTime();

      return dateB - dateA;
    })
    .slice(0, 5);

  return (
    <motion.main
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="mx-auto w-full max-w-[1600px] space-y-7 pb-6 text-[#2d4033] sm:space-y-8"
    >
      {/* Welcome section */}
      <motion.section
        variants={itemVariants}
        className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-[#263f32] via-[#385b45] to-[#607b5d] px-5 py-7 text-[#fffdf6] shadow-xl shadow-[#263f32]/10 sm:px-8 sm:py-9 lg:px-10"
      >
        <div className="pointer-events-none absolute -right-12 -top-20 -z-10 h-64 w-64 rounded-full border border-white/10 sm:right-12 sm:top-[-90px] sm:h-80 sm:w-80">
          <div className="absolute inset-8 rounded-full border border-white/10" />
          <div className="absolute inset-16 rounded-full border border-white/10" />
          <div className="absolute inset-24 rounded-full border border-white/10" />
        </div>

        <div className="relative max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-semibold tracking-[0.18em] text-[#d7e4d2]">
            <Sparkles size={13} />
            YOUR BRAND · ADMIN PANEL
          </div>

          <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#d7e0c4] sm:text-sm">
            A little more trust in every detail
          </p>

          <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            Welcome to{" "}
            <span className="text-[#e7e1b8]">
              {brandName || "Your Brand"} Outlet
            </span>
            <span className="ml-2 text-[#d9d6a9]">✦</span>
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-[#d7e0d6] sm:text-base">
          Your space to nurture authenticity, care for every product,
  and build lasting customer trust.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  error ? "bg-amber-300" : "bg-[#b4dca5]"
                }`}
              />

              <span className="text-xs font-medium text-[#f0f2e7]">
                {loading
                  ? "Preparing your overview..."
                  : error
                    ? "Some data needs attention"
                    : "Your dashboard is up to date"}
              </span>
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
              Refresh data
            </button>
          </div>
        </div>
      </motion.section>

      {/* Error and loading messages */}
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
        >
          <strong className="block">Dashboard data warning</strong>
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-[#e8e9df] bg-[#fffefa] p-4 text-sm text-[#788479]">
          Loading products and verification records from your database...
        </div>
      )}

      {/* Statistics */}
      <motion.section variants={itemVariants}>
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1.5 text-[10px] font-bold tracking-[0.2em] text-[#829181]">
              YOUR OVERVIEW
            </p>

            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Dashboard at a glance
            </h2>

            <p className="mt-1.5 text-sm text-[#879187]">
              Statistics are calculated from API responses.
            </p>
          </div>

          <span className="w-fit rounded-xl border border-[#e6e8dd] bg-[#fffefa] px-3.5 py-2 text-xs text-[#718071]">
            Live database overview
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.title} stat={stat} />
          ))}
        </div>
      </motion.section>

      {/* Verification summary and recent activity */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        {/* Verification summary */}
        <motion.section
          variants={itemVariants}
          className="rounded-2xl border border-[#e8e9df] bg-[#fffefa] p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="mb-1.5 text-[10px] font-bold tracking-[0.18em] text-[#829181]">
                AUTHENTICATION
              </p>

              <h2 className="text-lg font-semibold">
                Verification summary
              </h2>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f0e5] text-[#4e7957]">
              <ShieldCheck size={22} />
            </div>
          </div>

          <div className="mt-7 flex flex-col items-center gap-6 min-[420px]:flex-row">
            <div
              className="relative grid h-36 w-36 shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(#668b69 0% ${verificationRate}%, #e9eee4 ${verificationRate}% 100%)`,
              }}
            >
              <div className="absolute inset-[10px] flex flex-col items-center justify-center rounded-full bg-[#fffefa]">
                <span className="text-3xl font-semibold tracking-tight text-[#304b37]">
                  {verificationRate}%
                </span>

                <span className="mt-1 text-xs text-[#849087]">
                  Successful
                </span>
              </div>
            </div>

            <div className="text-center min-[420px]:text-left">
              <h3 className="text-sm font-semibold text-[#34483a]">
                Verification activity
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#839087]">
                The percentage reflects successful verification
                attempts divided by total attempts. It is not a
                count of unique products.
              </p>
            </div>
          </div>

          <div className="mt-7 space-y-4 border-t border-[#edf0e8] pt-5">
            <div className="flex items-center gap-3 text-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-[#668b69]" />

              <span className="text-[#78847a]">
                Successful verifications
              </span>

              <strong className="ml-auto text-[#35473a]">
                {successfulVerifications.toLocaleString()}
              </strong>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-[#e5c99e]" />

              <span className="text-[#78847a]">
                Not registered attempts
              </span>

              <strong className="ml-auto text-[#35473a]">
                {notVerified.toLocaleString()}
              </strong>
            </div>
          </div>
        </motion.section>

        {/* Refined monitoring and recent activity */}
        <motion.section
          variants={itemVariants}
          className="min-w-0 overflow-hidden rounded-2xl border border-[#e8e9df] bg-[#fffefa] p-5 shadow-sm sm:p-6"
        >
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e3eadd] bg-[#edf2e9] text-[#55765b]">
                <Activity size={21} strokeWidth={1.8} />
              </div>

              <div>
                <p className="mb-1 text-[10px] font-bold tracking-[0.2em] text-[#829181]">
                  LIVE INSIGHTS
                </p>

                <h2 className="text-lg font-semibold tracking-tight text-[#34483a]">
                  Activity Monitor
                </h2>

                <p className="mt-1 text-xs text-[#879187]">
                  Your latest verification records
                </p>
              </div>
            </div>

            <div className="flex w-fit items-center gap-2 rounded-full border border-[#e2e9dc] bg-[#f4f7f0] px-3 py-2">
              <span className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${
                    loading ? "bg-amber-400" : "bg-[#78a77a]"
                  }`}
                />
                {!loading && (
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#5e9365]" />
                )}
              </span>

              <span className="text-[10px] font-semibold tracking-wide text-[#55765b]">
                {loading ? "UPDATING" : "DATABASE ACTIVITY"}
              </span>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#e8eee3] bg-[#f7f8f2] p-3.5">
              <div className="flex items-center gap-2 text-[#638267]">
                <CircleCheck size={15} />
                <span className="text-[10px] font-medium">
                  Successful
                </span>
              </div>

              <p className="mt-2 text-xl font-semibold text-[#354c39]">
                {successfulVerifications.toLocaleString()}
              </p>

              <p className="mt-1 text-[10px] text-[#879187]">
                Verification attempts
              </p>
            </div>

            <div className="rounded-xl border border-[#f0e5d9] bg-[#fbf7f1] p-3.5">
              <div className="flex items-center gap-2 text-[#ad8056]">
                <AlertTriangle size={15} />
                <span className="text-[10px] font-medium">
                  Not registered
                </span>
              </div>

              <p className="mt-2 text-xl font-semibold text-[#77563b]">
                {notVerified.toLocaleString()}
              </p>

              <p className="mt-1 text-[10px] text-[#9a8977]">
                Unregistered code attempts
              </p>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between border-b border-[#edf0e8] pb-3">
            <h3 className="text-sm font-semibold text-[#435345]">
              Recent activity
            </h3>

            <span className="rounded-md bg-[#f3f4ed] px-2 py-1 text-[10px] font-medium text-[#7b897b]">
              Latest 5 records
            </span>
          </div>

          {recentRecords.length > 0 ? (
            <div className="divide-y divide-[#eff0e9]">
              {recentRecords.map((record, index) => {
                const result = getResultLabel(
                  record.verification_result
                );

                const successful = isSuccessful(
                  record.verification_result
                );

                return (
                  <motion.div
                    key={
                      record.verification_id ||
                      record.report_id ||
                      `${record.entered_code}-${index}`
                    }
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex min-w-0 items-center gap-3 py-4 first:pt-1 last:pb-1"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                        successful
                          ? "bg-[#e9f2e7] text-[#56815a]"
                          : "bg-[#f8e9df] text-[#b16b44]"
                      }`}
                    >
                      {successful ? (
                        <CheckCircle2 size={19} />
                      ) : (
                        <AlertTriangle size={19} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#3d4c40]">
                        {record.product_name ||
                          record.entered_code ||
                          "Verification record"}
                      </p>

                      <p className="mt-1 truncate text-xs text-[#879187]">
                        Code:{" "}
                        {record.entered_code ||
                          record.product_code ||
                          "—"}
                      </p>

                      <p className="mt-1 flex items-center gap-1 text-[10px] text-[#a0a89f]">
                        <Clock3 size={11} />

                        {formatTime(
                          record.verification_date ||
                            record.report_date
                        )}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-lg px-2 py-1.5 text-[10px] font-medium ${
                        successful
                          ? "border border-[#dce9d8] bg-[#edf5e9] text-[#4e7954]"
                          : "border border-[#f0dfd1] bg-[#fbefe6] text-[#a86340]"
                      }`}
                    >
                      {result}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#e3e7dc] bg-[#f8f8f2] px-5 py-8 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#edf2e9] text-[#6c896c]">
                {loading ? (
                  <RefreshCw size={19} className="animate-spin" />
                ) : (
                  <Leaf size={20} />
                )}
              </div>

              <p className="mt-3 text-sm font-medium text-[#526454]">
                {loading
                  ? "Gathering activity..."
                  : error
                    ? "Activity is temporarily unavailable"
                    : "A fresh start"}
              </p>

              <p className="mx-auto mt-1.5 max-w-xs text-xs leading-5 text-[#879187]">
                {loading
                  ? "Fetching the latest records from your database."
                  : error
                    ? "Check the dashboard warning above and refresh the data."
                    : "New verification records will appear here as customers verify their products."}
              </p>
            </div>
          )}

          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#e9ebdf] bg-[#f7f7f0] p-3.5">
            <Sparkles
              size={15}
              className="mt-0.5 shrink-0 text-[#87966c]"
            />

            <p className="text-xs leading-5 text-[#7e897e]">
              Stay informed about product authenticity through your
              latest recorded verification activity.
            </p>
          </div>
        </motion.section>
      </div>

      {/* Footer */}
      <footer className="flex flex-col gap-2 border-t border-[#e8e9df] pt-5 text-xs text-[#929b91] sm:flex-row sm:items-center sm:justify-between">
        <span className="font-semibold text-[#56695a]">
          {brandName || "Your Brand"} Outlet
        </span>

        <span>
          Authenticity in every detail. Trust in every purchase.
        </span>
      </footer>
    </motion.main>
  );
}