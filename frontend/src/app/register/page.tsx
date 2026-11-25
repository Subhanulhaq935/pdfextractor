"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || password.length < 8) {
      setError("Please enter a valid email and a password of at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/register", {
        email: email.trim(),
        password,
        full_name: fullName.trim() || null,
      });
      toast.success("Account created! Please sign in.");
      router.push("/login");
    } catch (err) {
      const msg = getErrorMessage(err, "Registration failed");
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Create Account</h1>
            <p className="text-xs text-slate-500">Save your PDFs &amp; chat history</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Full Name (optional)
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Subhan"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm transition focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm transition focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Password (min 8 chars)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm transition focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:underline">
            Sign In
          </Link>
        </p>

        <div className="mt-5 border-t border-slate-200 pt-4">
          <Link
            href="/guest"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            Try Guest Mode without signing up
          </Link>
        </div>
      </div>
    </div>
  );
}
