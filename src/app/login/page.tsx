"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("E-posta veya şifre hatalı");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#FAF7F4" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, #B08D7A, #E8D5CB)" }}>
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-[#3D2E26]" style={{ fontFamily: "Cormorant Garamond, serif" }}>
            Belle Studio
          </h1>
          <p className="text-sm text-[#B08D7A] mt-1">Salon Yönetim Paneli</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E8E0DA] shadow-sm p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">E-posta</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B08D7A]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bellestudio.com"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#9A8A82] uppercase tracking-wide">Şifre</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B08D7A]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#FAF7F4] border border-[#E8E0DA] rounded-xl outline-none focus:border-[#B08D7A] transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #B08D7A, #C9A898)" }}
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
