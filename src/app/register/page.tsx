'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import api from '@/lib/axios';
import { useTranslation } from 'react-i18next';


export default function Register() {
  const { t } = useTranslation();
  const router = useRouter();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await api.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, form);
      if (res.status === 201) {
        setSuccess(t("register.success"));
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch (err: any) {
      if (err.response?.data?.errors) {
        // Handle validation errors
        const errorMessages = err.response.data.errors.map((error: any) => error.msg).join(', ');
        setError(errorMessages);
      } else {
        setError(err.response?.data?.message || t("register.failed"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-r from-blue-50 via-white to-white text-gray-900">
      <div className="flex flex-1">
        {/* Colonne gauche : logo + slogan avec halo */}
        <div className="hidden md:flex flex-col justify-center items-center flex-1 relative">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-100 opacity-60 blur-2xl z-0" />
          <div className="relative z-10 flex flex-col items-center">
            <Image src="/logo_breezy.png" alt="Breezy logo" width={180} height={180} priority className="mb-6 drop-shadow-2xl" />
            <h1 className="text-4xl font-extrabold text-blue-700 mb-2">Breezy</h1>
            <p className="text-xl text-gray-500 font-medium text-center max-w-xs">A breath of fresh share</p>
          </div>
        </div>
        {/* Colonne droite : bloc d'inscription */}
        <div className="flex flex-col justify-center items-center flex-1 py-12 px-4 sm:px-8 relative">
          <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-2xl border-l-8 border-blue-200">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center mb-2">{t("register.title")}</h2>
            <p className="text-gray-500 text-center mb-6">{t("register.subtitle")}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t("register.username")}</label>
                <input
                  type="text"
                  name="username"
                  placeholder={t("register.username_placeholder")}
                  value={form.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t("register.email")}</label>
                <input
                  type="email"
                  name="email"
                  placeholder={t("register.email_placeholder")}
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t("register.password")}</label>
                <input
                  type="password"
                  name="password"
                  placeholder={t("register.password_placeholder")}
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-all transform hover:scale-[1.02] focus:scale-[0.98]"
                disabled={loading}
              >
                {loading ? t("register.creating") : t("register.create")}
              </button>
              {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-center">{error}</div>}
              {success && <div className="bg-green-50 border border-green-200 text-green-600 p-3 rounded-xl text-center">{success}</div>}
            </form>
            {/* Séparateur */}
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-gray-300" />
              <span className="mx-4 text-gray-500 font-medium">{t("register.or")}</span>
              <div className="flex-1 h-px bg-gray-300" />
            </div>
            {/* Bouton Google */}
            <button
              className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 px-4 bg-white hover:bg-gray-50 transition-all transform hover:scale-[1.02] focus:scale-[0.98] shadow-sm"
              onClick={() => signIn("google")}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" className="mr-2">
                <g>
                  <path fill="#4285F4" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.3-5.7 7-11.3 7-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2.9 7.2 2.4l6-6C34.5 5.5 29.5 3.5 24 3.5 12.7 3.5 3.5 12.7 3.5 24S12.7 44.5 24 44.5c11 0 20.5-8 20.5-20.5 0-1.4-.2-2.7-.4-4z"/>
                  <path fill="#34A853" d="M6.3 14.1l6.6 4.8C14.5 16.1 18.9 13 24 13c2.7 0 5.2.9 7.2 2.4l6-6C34.5 5.5 29.5 3.5 24 3.5c-7.2 0-13.4 4.1-16.7 10.6z"/>
                  <path fill="#FBBC05" d="M24 44.5c5.5 0 10.5-1.8 14.4-4.9l-6.6-5.4c-2 1.4-4.5 2.3-7.8 2.3-5.6 0-10.3-3.8-12-9l-6.5 5c3.3 6.5 10.5 11 18.5 11z"/>
                  <path fill="#EA4335" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.1 3-4.1 5.5-7.3 5.5-4.2 0-7.7-3.5-7.7-7.7 0-.6.1-1.2.2-1.8l-6.5-5C7.2 23.1 7 23.5 7 24c0 7.2 5.8 13 13 13 6.6 0 12-5.4 12-12 0-.8-.1-1.5-.2-2.2z"/>
                </g>
              </svg>
              <span className="text-gray-700 font-medium">{t("register.google")}</span>
            </button>
            {/* Texte d'accord */}
            <p className="text-xs text-gray-500 text-center max-w-md mt-6">
              {t("register.agreement")}
              <Link href="/terms" className="text-blue-600 hover:underline">{t("footer.terms")}</Link>
              {' '}{t("register.and")}{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">{t("footer.privacy")}</Link>
            </p>
            {/* Lien connexion */}
            <div className="w-full text-center mt-6">
              <span className="text-gray-500">{t("register.already")} </span>
              <Link href="/login" className="text-blue-600 hover:underline font-medium">{t("register.signin")}</Link>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="py-6 px-4 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-4 text-sm text-gray-500">
          <Link href="/about" className="hover:text-gray-700 transition-colors">{t("footer.about")}</Link>
          <Link href="/terms" className="hover:text-gray-700 transition-colors">{t("footer.terms")}</Link>
          <Link href="/privacy" className="hover:text-gray-700 transition-colors">{t("footer.privacy")}</Link>
          <Link href="/contact" className="hover:text-gray-700 transition-colors">{t("footer.contact")}</Link>
          <span>© {new Date().getFullYear()} Breezy</span>
        </div>
      </footer>
    </div>
  );
}