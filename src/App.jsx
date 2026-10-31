
import { useState } from "react";

import Auth from "./components/Auth.jsx";
import Sidebar from "./components/Sidebar.jsx";

import AdminOverview from "./pages/AdminOverview.jsx";
import CustomerPortal from "./pages/CustomerPortal.jsx";
import ProductCatalog from "./pages/ProductCatalog.jsx";
import SupplyChain from "./pages/SupplyChain.jsx";
import QRReports from "./pages/QRReports.jsx";

import logo from "./assets/logo.jpeg";

import "./style.css";

function getSavedSession() {
  try {
    return JSON.parse(localStorage.getItem("verifychain_user")) || null;
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState(getSavedSession);
  const [page, setPage] = useState("Dashboard");

  function handleAuthSuccess(session) {
    localStorage.setItem("verifychain_user", JSON.stringify(session));
    setUser(session);

    setPage(
      String(session.role).toLowerCase() === "admin"
        ? "Dashboard"
        : "Customer Portal"
    );
  }

  function logout() {
    localStorage.removeItem("verifychain_user");
    setUser(null);
    setPage("Dashboard");
  }

  function renderPage() {
    switch (page) {
      case "Dashboard":
        return <AdminOverview user={user} />;

      case "Product Catalog":
        return <ProductCatalog />;

      case "Supply Chain":
        return <SupplyChain />;

      case "QR Reports":
        return <QRReports />;

      default:
        return <AdminOverview user={user} />;
    }
  }

  // Login / Customer Signup
  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  // Customer Portal
  if (String(user.role).toLowerCase() === "customer") {
    return (
      <div className="min-h-dvh bg-[#f5f4ed]">
        <header className="flex items-center justify-between gap-3 border-b border-[#e1e5d9] bg-white px-4 py-3 sm:px-6 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={logo}
              alt="VerifyChain Logo"
              className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
            />

            <div className="min-w-0">
              <h1 className="text-lg font-bold text-[#294535] sm:text-xl">
                VerifyChain
              </h1>

              <p className="text-xs text-gray-500">
                Customer Portal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-sm text-[#345b42] transition hover:bg-gray-50 sm:px-4"
          >
            Log Out
          </button>
        </header>

        <main className="mx-auto w-full min-w-0 max-w-[1600px] p-4 sm:p-6 md:p-8">
          <CustomerPortal />
        </main>
      </div>
    );
  }

  // Admin Workspace
  return (
    <div className="min-h-dvh bg-[#f5f4ed]">
      <Sidebar
        user={user}
        page={page}
        setPage={setPage}
        logout={logout}
      />

      <div className="min-h-dvh min-w-0 md:ml-64">
        <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between gap-3 border-b border-[#e1e5d9] bg-white/95 px-4 py-3 backdrop-blur sm:px-6 md:px-8">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-[#294535] sm:text-lg">
              {page}
            </h2>

            <p className="hidden text-xs text-gray-500 sm:block">
              Manage your product verification system
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-[#e5eddf] px-3 py-1.5 text-xs font-semibold text-[#345b42]">
            Admin
          </span>
        </header>

        <main className="mx-auto w-full min-w-0 max-w-[1800px] p-3 sm:p-5 md:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
