import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Package, User, Lock, EyeOff, Eye, ArrowRight, Globe, Moon, Sun, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import useAuth from "../context/useAuth";
import axiosClient from "../services/axiosClient";

function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [isDark, setIsDark] = useState(() =>
    localStorage.getItem("theme") === "dark" ||
    (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Language dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setIsLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem("language", lang);
    setIsLangMenuOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const response = await axiosClient.post("/auth/login", { username, password });
      const { accessToken } = response || {};
      if (accessToken) {
        login(accessToken);
        navigate("/");
      } else {
        setErrorMsg(t("login.loginFailed"));
      }
    } catch (err) {
      if (err.response) {
        const serverMessage = err.response.data?.error?.message || err.response.data?.message;
        setErrorMsg(serverMessage || t('login.loginFailed'));
      } else if (err.request) {
        // Request đã được gửi đi nhưng không nhận được phản hồi
        setErrorMsg(t('common.connectionError'));
      } else {
        // Lỗi không xác định khác
        setErrorMsg(t('common.unknownError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen flex flex-col items-center justify-center relative overflow-hidden text-gray-900 dark:text-gray-100 font-sans p-4 transition-colors duration-200">
      <div className="absolute inset-0 dot-pattern pointer-events-none"></div>

      {/* Header */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setIsDark(!isDark)}
          className="flex items-center justify-center w-8 h-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-gray-200 dark:border-gray-700 rounded-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
          aria-label="Toggle Dark Mode"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        {/* Language dropdown */}
        <div className="relative" ref={langMenuRef}>
          <button
            type="button"
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-gray-200 dark:border-gray-700 px-3.5 py-1.5 rounded-full text-[12px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
          >
            <Globe className="w-[14px] h-[14px]" />
            <span>{i18n.language?.startsWith("vi") ? "Tiếng Việt" : "English"}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isLangMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {isLangMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-32 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 py-1 z-50 overflow-hidden">
              <button
                type="button"
                onClick={() => changeLanguage("vi")}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer text-left ${i18n.language?.startsWith("vi")
                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
              >
                <span>🇻🇳</span> Tiếng Việt
              </button>
              <button
                type="button"
                onClick={() => changeLanguage("en")}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer text-left ${i18n.language?.startsWith("en")
                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
              >
                <span>🇺🇸</span> English
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Login */}
      <div className="relative z-10 w-full max-w-md mx-auto p-6 sm:p-8 bg-white dark:bg-slate-900 shadow-xl border border-gray-200 dark:border-gray-800 rounded-lg flex flex-col gap-8">
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/50 rounded-full flex items-center justify-center border border-indigo-100 dark:border-indigo-900 mb-2">
            <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="font-display text-[32px] leading-[40px] font-semibold text-gray-900 dark:text-gray-100 tracking-tight">ITAM SYSTEM</h1>
          <p className="text-[16px] leading-[24px] text-gray-600 dark:text-gray-400 mt-2">{t("login.welcome")}</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {errorMsg && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-[14px] text-red-600 dark:text-red-400 text-center font-medium">
              {errorMsg}
            </div>
          )}

          {/* Username */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[12px] font-medium text-gray-700 dark:text-gray-300" htmlFor="username">
              {t("login.usernameLabel")}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-gray-700 rounded pl-10 pr-4 py-2 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-600 dark:focus:ring-indigo-500 focus:outline-none transition-colors text-[14px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                id="username" required value={username} onChange={e => setUsername(e.target.value)} placeholder={t("login.usernamePlaceholder")} type="text"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[12px] font-medium text-gray-700 dark:text-gray-300" htmlFor="password">
              {t("login.passwordLabel")}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 dark:text-gray-500 pointer-events-none" />
              <input
                className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-gray-700 rounded pl-10 pr-10 py-2 focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-1 focus:ring-indigo-600 dark:focus:ring-indigo-500 focus:outline-none transition-colors text-[14px] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                id="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder={t("login.passwordPlaceholder")} type={showPassword ? "text" : "password"}
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
                type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
              >
                {showPassword ? <Eye className="w-[18px] h-[18px]" /> : <EyeOff className="w-[18px] h-[18px]" />}
              </button>
            </div>
          </div>

          <button
            className="w-full bg-indigo-600 text-white font-mono text-[14px] font-medium py-3 rounded flex items-center justify-center gap-2 hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors mt-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            type="submit" disabled={loading}
          >
            {loading ? t("common.loading") : t("login.loginButton")}
            <ArrowRight className="w-[18px] h-[18px]" />
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center pb-8">
        <p className="font-mono text-[12px] font-medium text-gray-500 dark:text-gray-400">{t("login.footer")}</p>
      </div>
    </div>
  );

};

export default LoginPage;
