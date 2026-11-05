
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  LayoutDashboard,
  Package,
  Truck,
  FileSearch,
  LogOut,
} from "lucide-react";
import logo from "../assets/image.png";

const navItems = [
  { id: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "Product Catalog", label: "Product Catalog", icon: Package },
  { id: "Supply Chain", label: "Supply Chain", icon: Truck },
  { id: "QR Reports", label: "Reports", icon: FileSearch },
];

export default function Sidebar({ user, page, setPage, logout }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigation = (pageId) => {
    setPage(pageId);
    setMobileOpen(false);
  };

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex h-full flex-col bg-[#064e3b] text-white">
      {/* Logo */}
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={logo}
            alt="VerifyChain Logo"
            className="h-10 w-10 shrink-0 rounded-lg object-cover"
          />

          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold tracking-tight">
              VerifyChain
            </h2>
            <p className="text-xs text-emerald-100/70">
              Product Authenticity
            </p>
          </div>
        </div>

        {mobile && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white hover:bg-white/10"
            aria-label="Close sidebar"
          >
            <X size={23} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-3 py-6">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-emerald-100/60">
          Workspace
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = page === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigation(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
                active
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-emerald-50/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Details */}
      <div className="border-t border-white/10 p-4">
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-white/10 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-900">
            {(user?.name || user?.username || "A")
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {user?.name || user?.username || "Admin"}
            </p>
            <p className="truncate text-xs text-emerald-100/70">
              {user?.email || "Administrator"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            logout();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-emerald-50/80 transition-colors hover:bg-red-500/20 hover:text-white"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open sidebar"
        aria-expanded={mobileOpen}
        className="fixed left-4 top-4 z-[100] flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-800 shadow-md hover:bg-gray-50 md:hidden"
      >
        <Menu size={25} />
      </button>

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 md:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close sidebar overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-[110] bg-black/40 md:hidden"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-[120] w-[min(80vw,280px)] shadow-2xl md:hidden"
            >
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
