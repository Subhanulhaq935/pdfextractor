"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpenCheck, FileText, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post<{ access_token: string }>("/auth/login", {
        email: email.trim(),
        password,
      });
      setToken(res.data.access_token);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err) {
      const msg = getErrorMessage(err, "Invalid email or password");
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      {/* Left Hero Panel */}
      <div className="hidden flex-1 flex-col justify-between p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">DocuMind AI</span>
        </div>

        <div className="max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-medium text-blue-200 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Powered by RAG + pgvector
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Ask anything about your PDFs.{" "}
            <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
              Get exact page citations.
            </span>
          </h1>
          <p className="text-base leading-relaxed text-slate-300">
            Upload research papers, contracts, or manuals. Our AI answers strictly from
            your document with zero hallucination and instant source snippets.
          </p>

          <div className="grid gap-4 pt-2 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <BookOpenCheck className="mb-2 h-5 w-5 text-blue-400" />
              <p className="text-sm font-semibold">Page-Level Citations</p>
              <p className="mt-1 text-xs text-slate-400">
                Every answer includes clickable page chips &amp; exact text snippets.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <ShieldCheck className="mb-2 h-5 w-5 text-emerald-400" />
              <p className="text-sm font-semibold">Zero Hallucination</p>
              <p className="mt-1 text-xs text-slate-400">
                Refuses to guess when information is not present in your PDF.
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          Secure JWT Authentication • Private Document Storage
        </p>
      </div>

      {/* Right Auth Card */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-2xl">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-slate-900">DocuMind AI</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to access your saved PDFs and chat history
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                Password
              </label>
              <input
                type="password"
                required
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
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-blue-600 hover:underline">
              Create one
            </Link>
          </p>

          <div className="mt-6 border-t border-slate-200 pt-5">
            <Link
              href="/guest"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700"
            >
              <Sparkles className="h-4 w-4 text-blue-600" />
              Continue as Guest (No Login)
            </Link>
            <p className="mt-1.5 text-center text-xs text-slate-400">
              Instant chat • History is not saved in guest mode
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
