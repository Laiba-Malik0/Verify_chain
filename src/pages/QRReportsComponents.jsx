
import React from "react";

export const input =
  "w-full rounded-xl border border-[#dce4d8] bg-white px-3 py-2.5 text-sm text-[#26372b] outline-none focus:border-[#789477]";

export const primary =
  "inline-flex items-center justify-center rounded-xl bg-[#45684c] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#35533b] disabled:cursor-not-allowed disabled:opacity-50";

export const secondary =
  "inline-flex items-center justify-center rounded-xl border border-[#dce4d8] bg-white px-4 py-2.5 text-sm font-medium text-[#45684c] transition hover:bg-[#f5f7f1] disabled:opacity-50";

export function getToken() {
  try {
    return JSON.parse(
      localStorage.getItem("verifychain_user") || "null"
    )?.token;
  } catch {
    return null;
  }
}

export function formatDate(value) {
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

export function display(value) {
  return value === null || value === undefined || value === ""
    ? "—"
    : String(value);
}

export function resultStyle(status) {
  switch (status) {
    case "Verified":
      return "bg-[#e5f1e4] text-[#45684c]";
    case "Already Verified":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-rose-100 text-rose-700";
  }
}

export function reportStyle(status) {
  switch (status) {
    case "resolved":
      return "bg-[#e5f1e4] text-[#45684c]";
    case "pending":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function StatCard({ label, value, Icon, description }) {
  return (
    <div className="rounded-2xl border border-[#e2e8de] bg-white p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf3e9]">
        <Icon size={21} className="text-[#45684c]" />
      </div>

      <p className="text-sm text-[#788578]">{label}</p>

      <p className="mt-1 text-2xl font-semibold text-[#26372b]">
        {value}
      </p>

      <p className="mt-1 text-xs text-[#899487]">
        {description}
      </p>
    </div>
  );
}

export function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-[#edf0e9] py-3 sm:grid-cols-[150px_1fr] sm:gap-4">
      <span className="text-sm text-[#788578]">{label}</span>

      <span className="break-words text-sm font-medium text-[#26372b]">
        {display(value)}
      </span>
    </div>
  );
}
