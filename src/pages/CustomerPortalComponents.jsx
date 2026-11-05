import { motion } from "framer-motion";
import {
  CheckCircle2,
  History,
  PackageCheck,
  AlertTriangle,
  ClipboardList,
  ScanLine,
  FileWarning,
  ShieldCheck,
  Info,
  Pencil,
  Trash2,
} from "lucide-react";

export const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

export function PageSection({ children, className = "", id }) {
  return (
    <motion.section
      id={id}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.08 }}
      className={`scroll-mt-6 rounded-[1.7rem] border border-[#e2e8dc] bg-[#fffefa] p-5 shadow-[0_8px_30px_rgba(41,69,53,0.045)] transition-shadow duration-300 hover:shadow-[0_12px_35px_rgba(41,69,53,0.08)] sm:p-7 md:p-8 ${className}`}
    >
      {children}
    </motion.section>
  );
}

export function SectionHeading({
  icon: Icon,
  title,
  description,
  action,
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1e5] text-[#345b42]">
          <Icon size={22} />
        </div>

        <div>
          <h2 className="text-lg font-bold tracking-tight text-[#294535] sm:text-xl">
            {title}
          </h2>

          {description && (
            <p className="mt-1 text-xs leading-5 text-[#7b8578] sm:text-sm">
              {description}
            </p>
          )}
        </div>
      </div>

      {action}
    </div>
  );
}

export function StatusBadge({ status }) {
  const resolved = status === "resolved";

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
        resolved
          ? "bg-[#e8f1e5] text-[#345b42]"
          : "bg-[#fff1df] text-[#98601d]"
      }`}
    >
      {resolved ? (
        <CheckCircle2 size={14} />
      ) : (
        <History size={14} />
      )}
      {resolved ? "Resolved" : "Pending"}
    </span>
  );
}

export function StatCard({ title, count, type }) {
  const isResolved = type === "resolved";

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border p-5 ${
        isResolved
          ? "border-[#dce9d7] bg-gradient-to-br from-[#f1f7ed] to-[#e7f0e2]"
          : "border-[#f0e2cb] bg-gradient-to-br from-[#fff8ed] to-[#fdf0df]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className={`text-xs font-semibold ${
            isResolved ? "text-[#55734e]" : "text-[#a16a29]"
          }`}
        >
          {title}
        </p>

        {isResolved ? (
          <CheckCircle2 size={19} className="text-[#64845b]" />
        ) : (
          <History size={19} className="text-[#b47a36]" />
        )}
      </div>

      <p
        className={`mt-3 text-3xl font-bold ${
          isResolved ? "text-[#294535]" : "text-[#89551e]"
        }`}
      >
        {count}
      </p>
    </motion.div>
  );
}

export function FormField({
  label,
  value,
  onChange,
  placeholder,
  optional = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-[#536254]">
        {label}
        {optional && (
          <span className="ml-1 font-normal text-[#9aa397]">
            (Optional)
          </span>
        )}
      </label>

      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#e3e8df] bg-[#fbfcf8] px-4 py-3 text-sm text-[#344638] outline-none transition duration-200 placeholder:text-[#a5ada2] hover:border-[#c8d6c4] focus:border-[#71947a] focus:bg-white focus:ring-4 focus:ring-[#71947a]/10"
      />
    </div>
  );
}

export function TextareaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-[#536254]">
        {label}
      </label>

      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-[#e3e8df] bg-[#fbfcf8] px-4 py-3 text-sm leading-6 text-[#344638] outline-none transition duration-200 placeholder:text-[#a5ada2] hover:border-[#c8d6c4] focus:border-[#71947a] focus:bg-white focus:ring-4 focus:ring-[#71947a]/10"
      />
    </div>
  );
}

export function VerificationResultCard({ result }) {
  const isRegistered = result?.type === "registered";
  const wasUsed = result?.type === "already_verified";
  const isError = result?.type === "error";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`mt-6 overflow-hidden rounded-2xl border p-5 ${
        isRegistered
          ? "border-[#cbdcc5] bg-gradient-to-br from-[#f2f8ef] to-[#eaf3e6]"
          : wasUsed || isError
            ? "border-[#ead2ca] bg-[#fff5f1]"
            : "border-[#f0dfc5] bg-[#fff8ed]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            isRegistered
              ? "bg-[#dcebd6] text-[#345b42]"
              : "bg-white/80 text-[#a66b32]"
          }`}
        >
          {isRegistered ? (
            <PackageCheck size={25} />
          ) : (
            <AlertTriangle size={25} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[#294535]">
            {isRegistered
              ? "Product Registered with Brand"
              : wasUsed
                ? "Code Already Used"
                : isError
                  ? "Verification Error"
                  : "Product Could Not Be Verified"}
          </h3>

          <p className="mt-1 text-sm leading-6 text-[#69766a]">
            {result.message}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 border-t border-[#294535]/10 pt-4 sm:grid-cols-3">
        {[
          ["Product Name", result.name],
          ["Batch Number", result.batch],
          ["Entered Code", result.productCode],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <p className="text-xs text-[#899287]">{label}</p>
            <p className="mt-1 break-words text-sm font-semibold text-[#294535]">
              {value || "Not available"}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs leading-5 text-[#55734e]">
        You can submit a product issue using the report form below,
        regardless of this verification result.
      </p>
    </motion.div>
  );
}

export function EmptyState({
  icon: Icon = ClipboardList,
  title,
  description,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[#dce5d8] bg-[#fafbf7] px-5 py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf3e9] text-[#82967c]">
        <Icon size={27} />
      </div>

      <p className="mt-4 text-sm font-bold text-[#536254]">{title}</p>

      <p className="mt-1 text-xs leading-5 text-[#929b8e]">
        {description}
      </p>
    </div>
  );
}

export function ReportCard({
  item,
  parsed,
  formatDate,
  onEdit,
  onDelete,
  actionLoading,
}) {
  const isPending = item.report_status === "pending";

  return (
    <motion.article
      layout
      variants={fadeUp}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-[#e7ece3] bg-white p-5 shadow-[0_3px_14px_rgba(41,69,53,0.025)] transition-colors hover:border-[#cbdac6] hover:shadow-[0_8px_24px_rgba(41,69,53,0.06)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.14em] text-[#9aa497]">
            REPORT #{item.report_id}
          </p>

          <h3 className="mt-1 break-words text-base font-bold text-[#294535] sm:text-lg">
            {parsed.productName || "Product Issue Report"}
          </h3>

          <p className="mt-1 text-xs text-[#929b8e]">
            Submitted: {formatDate(item.report_date)}
          </p>
        </div>

        <StatusBadge status={item.report_status} />
      </div>

      <div className="mt-5 grid gap-4 border-t border-[#edf0e9] pt-4 sm:grid-cols-2">
        {[
          ["Product Code", item.scratch_code || "Not provided"],
          ["Seller / Shop", parsed.seller || "Not provided"],
          ["Purchase Location", parsed.location || "Not provided"],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <p className="text-[11px] font-medium text-[#9aa397]">
              {label}
            </p>
            <p className="mt-1 break-words text-sm font-medium text-[#536254]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-[#edf0e9] bg-[#f8faf5] p-4">
        <p className="text-[11px] font-bold text-[#71816e]">
          REPORT DETAILS
        </p>

        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#5e6b5d]">
          {parsed.description || "No additional description provided."}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs leading-5 text-[#899387]">
          {isPending
            ? "You can edit or delete this pending report."
            : "This report has been resolved by the administrator."}
        </p>

        {isPending && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onEdit}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#dce7d8] bg-[#f5f8f2] px-3.5 py-2 text-xs font-semibold text-[#345b42] transition hover:border-[#b8cdb1] hover:bg-[#eaf2e5] disabled:opacity-50"
            >
              <Pencil size={14} />
              Edit
            </button>

            <button
              type="button"
              onClick={onDelete}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#f0dcd5] bg-[#fff8f5] px-3.5 py-2 text-xs font-semibold text-[#a45c4b] transition hover:bg-[#fcebe5] disabled:opacity-50"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        )}
      </div>
    </motion.article>
  );
}

export function HistoryItem({ item }) {
  const registered = item.type === "registered";
  const alreadyUsed = item.type === "already_verified";

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ x: 3 }}
      className="flex flex-col justify-between gap-3 rounded-2xl border border-[#e8ede4] bg-white p-4 transition-colors hover:border-[#cad9c5] sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            registered
              ? "bg-[#eaf2e5] text-[#456b49]"
              : "bg-[#fff2e5] text-[#a66b32]"
          }`}
        >
          {registered ? (
            <PackageCheck size={21} />
          ) : (
            <AlertTriangle size={21} />
          )}
        </div>

        <div className="min-w-0">
          <p className="break-words text-sm font-bold text-[#294535]">
            {item.name}
          </p>

          <p className="mt-1 break-all text-xs text-[#818c7e]">
            Code: {item.code}
          </p>

          {item.batch !== "Not available" && (
            <p className="mt-1 text-xs text-[#818c7e]">
              Batch: {item.batch}
            </p>
          )}

          <p className="mt-1 text-[11px] text-[#a0a99b]">
            {item.checkedAt}
          </p>
        </div>
      </div>

      <span
        className={`self-start rounded-full px-3 py-1.5 text-[11px] font-bold ${
          registered
            ? "bg-[#eaf2e5] text-[#456b49]"
            : alreadyUsed
              ? "bg-[#fff0eb] text-[#a45c4b]"
              : "bg-[#fff3e3] text-[#98601d]"
        }`}
      >
        {registered
          ? "First Verified"
          : alreadyUsed
            ? "Previously Used"
            : "Not Verified"}
      </span>
    </motion.div>
  );
}

export function HowItWorks() {
  const steps = [
    {
      icon: ScanLine,
      title: "1. Verify Product",
      description: "Enter the scratch code to check its registry record.",
    },
    {
      icon: FileWarning,
      title: "2. Submit a Report",
      description:
        "Report any product issue, even if the product is verified.",
    },
    {
      icon: ShieldCheck,
      title: "3. Track Your Report",
      description:
        "Check your report status until the administrator resolves it.",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {steps.map(({ icon: Icon, title, description }) => (
        <motion.div
          key={title}
          variants={fadeUp}
          whileHover={{ y: -5 }}
          className="rounded-2xl border border-[#e2e8dc] bg-[#fffefa] p-5 shadow-[0_5px_20px_rgba(41,69,53,0.035)] transition-shadow hover:shadow-[0_10px_25px_rgba(41,69,53,0.07)]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf1e5] text-[#456b49]">
            <Icon size={22} />
          </div>

          <h3 className="mt-4 text-sm font-bold text-[#294535]">
            {title}
          </h3>

          <p className="mt-2 text-xs leading-6 text-[#7d897a]">
            {description}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

export function InfoNote() {
  return (
    <motion.div
      variants={fadeUp}
      className="flex items-start gap-3 rounded-2xl border border-[#dfe6d5] bg-gradient-to-r from-[#f0f4e9] to-[#f8f7ed] p-5"
    >
      <Info size={20} className="mt-0.5 shrink-0 text-[#61794f]" />

      <div>
        <h3 className="text-sm font-bold text-[#294535]">
          Verification and Reports
        </h3>

        <p className="mt-1 text-xs leading-6 text-[#6f796a]">
          A matching code confirms a registry match, not necessarily
          the physical item's authenticity. Customers can submit
          reports for any product concern and track their status
          through My Reports.
        </p>
      </div>
    </motion.div>
  );
}