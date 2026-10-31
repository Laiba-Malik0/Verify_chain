
import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, LockKeyhole, UserRound } from "lucide-react";

import logo from "../assets/logo.jpeg";

// API URL from environment variable
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

export default function Auth({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isSignup
        ? "/auth/register"
        : "/auth/login";

      const body = isSignup
        ? {
            full_name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
          }
        : {
            email: email.trim().toLowerCase(),
            password,
          };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || data.error || "Authentication failed."
        );
      }

      if (isSignup) {
        setMode("login");
        setName("");
        setEmail("");
        setPassword("");
        setError("Account created successfully. Please log in.");
        return;
      }

      const account = data.user || data.customer || data;

      if (!data.token || !account.email) {
        throw new Error(
          "Login response is missing user or token information."
        );
      }

      const session = {
        user_id: account.user_id ?? account.id,
        name:
          account.full_name ||
          account.name ||
          account.email,
        email: account.email,
        role:
          String(account.role || "customer").toLowerCase() === "admin"
            ? "Admin"
            : "Customer",
        token: data.token,
      };

      onAuthSuccess(session);
    } catch (err) {
      setError(
        err.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
    setName("");
    setEmail("");
    setPassword("");
  }

  return (
    <div className="flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-[#f5f4ed] px-3 py-5 sm:px-5 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm rounded-3xl border border-[#e2e6dc] bg-white px-5 py-6 shadow-sm sm:px-7 sm:py-8"
      >
        <div className="mb-4 flex items-center justify-center">
          <img
            src={logo}
            alt="VerifyChain Logo"
            className="h-20 w-20 object-contain sm:h-24 sm:w-24"
          />
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#294535] sm:text-3xl">
            VerifyChain
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-[#69766b] sm:text-sm">
            Product authenticity and supply chain verification
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-xl bg-[#f1f2ec] p-1">
          <button
            type="button"
            onClick={() => changeMode("login")}
            className={`rounded-lg px-2 py-2.5 text-sm transition ${
              !isSignup
                ? "bg-white font-medium text-[#294535] shadow-sm"
                : "text-[#657267] hover:text-[#294535]"
            }`}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => changeMode("signup")}
            className={`rounded-lg px-2 py-2.5 text-sm transition ${
              isSignup
                ? "bg-white font-medium text-[#294535] shadow-sm"
                : "text-[#657267] hover:text-[#294535]"
            }`}
          >
            Customer Sign Up
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="space-y-4"
        >
          {isSignup && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#294535]">
                Full Name
              </label>

              <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#dfe4dc] px-3 focus-within:border-[#71917a]">
                <UserRound
                  size={17}
                  className="shrink-0 text-[#96a296]"
                />
                <input
                  type="text"
                  name="customer-full-name"
                  autoComplete="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#294535]">
              Email Address
            </label>

            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#dfe4dc] px-3 focus-within:border-[#71917a]">
              <Mail size={17} className="shrink-0 text-[#96a296]" />

              <input
                type="email"
                name="new-verifychain-login-email"
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 [color-scheme:light] [&:-webkit-autofill]:[-webkit-text-fill-color:#111827] [&:-webkit-autofill]:[transition:background-color_9999s_ease-out_0s]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[#294535]">
              Password
            </label>

            <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#dfe4dc] px-3 focus-within:border-[#71917a]">
              <LockKeyhole
                size={17}
                className="shrink-0 text-[#96a296]"
              />
              <input
                type="password"
                name="verifychain-password"
                autoComplete={isSignup ? "new-password" : "off"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 [color-scheme:light] [&:-webkit-autofill]:[-webkit-text-fill-color:#111827] [&:-webkit-autofill]:[transition:background-color_9999s_ease-out_0s]"
              />
            </div>
          </div>

          {error && (
            <p
              role="status"
              className={`break-words rounded-lg px-3 py-2 text-sm ${
                error.toLowerCase().includes("successfully")
                  ? "bg-[#edf5e9] text-[#345b42]"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-[#345b42] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#294535] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : isSignup
                ? "Create Customer Account"
                : "Login to VerifyChain"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs leading-5 text-[#8a948b]">
          Secure product authenticity verification
        </p>
      </motion.div>
    </div>
  );
}
