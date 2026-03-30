"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { saveSession } from "@/lib/auth";
import { apiRequest } from "@/lib/api";
import type { AuthResponse } from "@/lib/types";

type Mode = "login" | "signup";

export function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const payload =
        mode === "signup" ? { name, email, password } : { email, password };
      const response = await apiRequest<AuthResponse>(
        mode === "signup" ? "/api/auth/signup" : "/api/auth/login",
        {
          method: "POST",
          body: payload,
        },
      );

      saveSession(response.token, response.user);
      router.push("/dashboard");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to continue right now.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <section className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#e2e8f0_100%)] px-6 py-10 text-slate-950 lg:px-10">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[32px] bg-slate-950 p-8 text-slate-50 shadow-[0_24px_80px_rgba(15,23,42,0.24)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-300">
            InterviewFlow
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Keep the job hunt out of scattered notes and half-forgotten follow-ups.
          </h1>
          <div className="mt-8 grid gap-4">
            {[
              "Save every referral with the company, role, and applied date.",
              "Keep notes from recruiter calls, assessments, and interview rounds.",
              "Set a reminder so you know when it is time to follow up.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-white/10 bg-white/5 px-5 py-4 text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="flex gap-3">
            {(["login", "signup"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setMode(item);
                  setMessage("");
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  mode === item
                    ? "bg-slate-950 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {item === "login" ? "Login" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
            {mode === "signup" ? (
              <label className="grid gap-2 text-sm text-slate-700">
                Full name
                <input
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Akhil Sharma"
                  className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400"
                />
              </label>
            ) : null}

            <label className="grid gap-2 text-sm text-slate-700">
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="akhil@example.com"
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400"
              />
            </label>

            <label className="grid gap-2 text-sm text-slate-700">
              Password
              <input
                required
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 8 characters"
                className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-orange-400"
              />
            </label>

            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-2 rounded-2xl bg-orange-500 px-4 py-3 font-semibold text-slate-950 hover:bg-orange-400 disabled:opacity-60"
            >
              {status === "loading"
                ? "Please wait..."
                : mode === "login"
                  ? "Login to dashboard"
                  : "Create account"}
            </button>

            <p className={`min-h-6 text-sm ${status === "error" ? "text-rose-600" : "text-slate-500"}`}>
              {message}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
