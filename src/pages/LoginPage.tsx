import { useEffect, useState } from "react";
import type { UserRole } from "../App";
import { useAuth } from "../contexts/AuthContext";
import { lookupRetailerApprovalStatus, registerOrUpdateRetailer, RetailerAccount } from "../lib/retailers";

// ─── Role Configuration ───────────────────────────────────────────────────────

type RoleCfg = {
  label: string;
  badge: string;
  accent: string;
  gradient: string;
};

const ROLES: Record<string, RoleCfg> = {
  retailer: {
    label: "Retailer",
    badge: "B2B Wholesale",
    accent: "#059669",
    gradient: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
  },
  admin: {
    label: "Admin",
    badge: "Management",
    accent: "#073b4c",
    gradient: "linear-gradient(135deg, #073b4c 0%, #0c566d 100%)",
  },
};

// ─── Simple Icons ─────────────────────────────────────────────────────────────

function MailIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" />
      <path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

// ─── Simple Alert Boxes ───────────────────────────────────────────────────────

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-left animate-in fade-in duration-150">
      <span className="text-red-500 font-bold text-sm leading-none mt-0.5">!</span>
      <p className="text-red-700 text-xs leading-relaxed flex-1 break-words">{msg}</p>
    </div>
  );
}

function SuccessBox({ msg }: { msg: string }) {
  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-left animate-in fade-in duration-150">
      <span className="text-emerald-600 font-bold text-sm leading-none mt-0.5">✓</span>
      <p className="text-emerald-700 text-xs leading-relaxed flex-1 break-words">{msg}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LoginPage({ onBackToStore }: { onBackToStore?: () => void }) {
  const { signIn, signUp, resetPassword, pendingApprovalInfo, clearPendingApproval } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [selectedRole, setSelectedRole] = useState<UserRole>("retailer");

  // Email / password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-populate remembered credentials
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("subhone_remember_email");
      const savedRole = localStorage.getItem("subhone_remember_role") as UserRole | null;
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
        if (savedRole && (savedRole === "admin" || savedRole === "retailer")) {
          setSelectedRole(savedRole);
        }
      }
    } catch {
      // Ignored
    }
  }, []);

  // Forgot password modal
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotError, setForgotError] = useState("");

  // Signup fields
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupShop, setSignupShop] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");

  // Check Retailer Status modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusQuery, setStatusQuery] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResult, setStatusResult] = useState<{
    searched: boolean;
    found: boolean;
    retailer: RetailerAccount | null;
  }>({
    searched: false,
    found: false,
    retailer: null,
  });

  const handleCheckStatus = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToUse = (customQuery || statusQuery).trim();
    if (!queryToUse) return;
    setStatusLoading(true);
    try {
      const res = await lookupRetailerApprovalStatus(queryToUse);
      setStatusResult({ searched: true, found: res.found, retailer: res.retailer });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    if (!/\S+@\S+\.\S+/.test(forgotEmail)) {
      setForgotError("Please enter a valid email address.");
      return;
    }
    setForgotLoading(true);
    const { error: resetErr } = await resetPassword(forgotEmail.trim());
    setForgotLoading(false);
    if (resetErr) {
      setForgotError(resetErr);
    } else {
      setForgotSuccess("Password reset instructions have been sent to your email.");
    }
  };

  const resetForm = () => {
    setEmail(""); setPassword(""); setSignupName(""); setSignupPhone("");
    setSignupShop(""); setSignupConfirm("");
    setError(""); setSuccess("");
  };

  const switchMode = (m: "login" | "signup") => {
    setMode(m);
    resetForm();
    if (m === "signup") setSelectedRole("retailer");
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!password) { setError("Please enter your password."); return; }

    try {
      if (rememberMe) {
        localStorage.setItem("subhone_remember_email", email.trim());
        localStorage.setItem("subhone_remember_role", selectedRole);
      } else {
        localStorage.removeItem("subhone_remember_email");
        localStorage.removeItem("subhone_remember_role");
      }
    } catch {
      // Ignored
    }

    setLoading(true);
    const { error: authError } = await signIn(email.trim(), password, selectedRole);
    setLoading(false);

    if (authError) {
      setError(authError);
    }
  };

  // Signup handler
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!signupName.trim()) { setError("Please enter your full name."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email address."); return; }
    if (!signupShop.trim()) { setError("Please enter your shop or pharmacy name."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== signupConfirm) { setError("Passwords do not match."); return; }

    setLoading(true);

    try {
      await registerOrUpdateRetailer({
        fullName: signupName.trim(),
        email: email.trim(),
        phone: signupPhone || null,
        shopName: signupShop.trim() || `${signupName.trim()}'s Store`,
        approvalStatus: "pending",
      });
    } catch (regErr) {
      console.warn("Notice saving retailer approval request:", regErr);
    }

    const { error: authError, emailConfirmationRequired } = await signUp({
      email: email.trim(),
      password,
      fullName: signupName.trim(),
      phone: signupPhone || undefined,
      shopName: signupShop.trim(),
      role: "retailer",
    });
    setLoading(false);

    if (authError) {
      setError(authError);
    } else if (emailConfirmationRequired) {
      setSuccess("Account registered! Please check your email inbox to confirm your address.");
    } else {
      setSuccess("Retailer application submitted! Access will activate once verified by our executive admin.");
    }
  };

  const cfg = ROLES[selectedRole] || ROLES["retailer"];
  const roleList: UserRole[] = mode === "signup" ? ["retailer"] : ["retailer", "admin"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f2f8f3] via-[#f9faf9] to-[#ebf5ed] flex flex-col justify-center items-center p-4 sm:p-6 text-[#073b4c]">
      
      {/* Top action bar: Back to Store */}
      {onBackToStore && (
        <div className="w-full max-w-md mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToStore}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#006a39] hover:text-[#004d2a] transition-colors cursor-pointer"
          >
            <span>←</span>
            <span>Back to Pharmacy Store</span>
          </button>
          <span className="text-[11px] text-[#718574] font-semibold">SubhOne Health Group</span>
        </div>
      )}

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-white border border-[#e2ede4] rounded-3xl shadow-xl shadow-emerald-950/5 p-6 sm:p-8 flex flex-col gap-5">
        
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#006a39] to-[#047857] flex items-center justify-center text-white shadow-md shadow-emerald-900/15 mb-3 border border-white/40">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" fill="white" />
            </svg>
          </div>
          <h1 className="font-['Manrope',sans-serif] font-black text-xl sm:text-2xl text-[#073b4c] tracking-tight">
            SubhOne Health Group
          </h1>
          <p className="text-xs text-[#627765] mt-1">
            {mode === "login" ? "Sign in to your account" : "Create your new account"}
          </p>
        </div>

        {/* Mode Switcher Tabs (Sign In / Sign Up) */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#f0f5f2] border border-[#dce7db] text-xs font-bold">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`py-2 rounded-xl transition-all duration-150 cursor-pointer ${
              mode === "login"
                ? "bg-white text-[#073b4c] shadow-xs font-black"
                : "text-[#627765] hover:text-[#073b4c]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`py-2 rounded-xl transition-all duration-150 cursor-pointer ${
              mode === "signup"
                ? "bg-white text-[#073b4c] shadow-xs font-black"
                : "text-[#627765] hover:text-[#073b4c]"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Clean Role Selector */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-[#627765]">
            <span>Account Type</span>
            <span className="text-emerald-800 font-extrabold">{cfg.label}</span>
          </div>

          <div className={`grid gap-1.5 p-1 rounded-2xl bg-[#f0f5f2] border border-[#dce7db] ${roleList.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
            {roleList.map((r) => {
              const active = selectedRole === r;
              const roleInfo = ROLES[r] || ROLES["retailer"];
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setSelectedRole(r); setError(""); setSuccess(""); }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                    active
                      ? "bg-white text-[#073b4c] shadow-xs font-black border border-white"
                      : "text-[#627765] hover:text-[#073b4c]"
                  }`}
                >
                  <span className="text-sm">
                    {r === "retailer" ? "🏪" : "🛡️"}
                  </span>
                  <span>{roleInfo.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pending Retailer Approval Notice (if applicable) */}
        {pendingApprovalInfo && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 flex flex-col gap-2">
            <div className="flex items-center justify-between font-bold">
              <span>⏳ Retailer Application In Review</span>
              <span className="text-[10px] uppercase bg-amber-200 px-2 py-0.5 rounded-full">Pending</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-normal">
              Wholesale account for <strong>{pendingApprovalInfo.shopName}</strong> ({pendingApprovalInfo.email}) is currently being reviewed.
            </p>
            <div className="flex items-center gap-2 pt-1 border-t border-amber-200/80">
              <button
                type="button"
                onClick={() => {
                  setStatusQuery(pendingApprovalInfo.email);
                  setShowStatusModal(true);
                  handleCheckStatus(undefined, pendingApprovalInfo.email);
                }}
                className="text-[11px] font-bold text-amber-800 hover:underline"
              >
                View Status Details →
              </button>
              <button
                type="button"
                onClick={clearPendingApproval}
                className="text-[11px] text-amber-700 hover:underline ml-auto"
              >
                Switch Account
              </button>
            </div>
          </div>
        )}

        {/* ── Sign In Form ── */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
            {/* Email */}
            <div>
              <label className="text-[11px] font-bold text-[#073b4c] block mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8ea292] pointer-events-none">
                  <MailIcon />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="w-full bg-[#fbfdfb] border border-[#d6e4d8] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#073b4c] placeholder:text-[#9bb09f] focus:outline-none focus:border-[#006a39] focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[11px] font-bold text-[#073b4c] block mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8ea292] pointer-events-none">
                  <LockIcon />
                </div>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full bg-[#fbfdfb] border border-[#d6e4d8] rounded-xl pl-10 pr-10 py-2.5 text-sm text-[#073b4c] placeholder:text-[#9bb09f] focus:outline-none focus:border-[#006a39] focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ea292] hover:text-[#073b4c] cursor-pointer"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 text-[#596b5e] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#d6e4d8] text-[#006a39] focus:ring-emerald-500 cursor-pointer accent-[#006a39]"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotError("");
                  setForgotSuccess("");
                  setShowForgot(true);
                }}
                className="font-bold text-[#006a39] hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {error && <ErrorBox msg={error} />}
            {success && <SuccessBox msg={success} />}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-emerald-950/10 cursor-pointer mt-1"
              style={{ background: cfg.gradient }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Sign In as {cfg.label}</span>
              )}
            </button>
          </form>
        )}

        {/* ── Sign Up Form ── */}
        {mode === "signup" && (
          <form onSubmit={handleSignup} className="flex flex-col gap-3">
            {/* Full Name */}
            <div>
              <label className="text-[11px] font-bold text-[#073b4c] block mb-1">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8ea292] pointer-events-none">
                  <UserIcon />
                </div>
                <input
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full bg-[#fbfdfb] border border-[#d6e4d8] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#073b4c] placeholder:text-[#9bb09f] focus:outline-none focus:border-[#006a39] focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="text-[11px] font-bold text-[#073b4c] block mb-1">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8ea292] pointer-events-none">
                  <MailIcon />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-[#fbfdfb] border border-[#d6e4d8] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#073b4c] placeholder:text-[#9bb09f] focus:outline-none focus:border-[#006a39] focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-[11px] font-bold text-[#073b4c] block mb-1">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8ea292] pointer-events-none">
                  <PhoneIcon />
                </div>
                <input
                  type="tel"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value.replace(/[^0-9+]/g, ""))}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#fbfdfb] border border-[#d6e4d8] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#073b4c] placeholder:text-[#9bb09f] focus:outline-none focus:border-[#006a39] focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            {/* Shop / Pharmacy Name */}
            <div>
              <label className="text-[11px] font-bold text-[#073b4c] block mb-1">
                Shop / Pharmacy Name *
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8ea292] pointer-events-none">
                  <BuildingIcon />
                </div>
                <input
                  type="text"
                  value={signupShop}
                  onChange={(e) => setSignupShop(e.target.value)}
                  placeholder="e.g. Apollo Chemist, LifeCare Pharmacy"
                  required
                  className="w-full bg-[#fbfdfb] border border-[#d6e4d8] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-[#073b4c] placeholder:text-[#9bb09f] focus:outline-none focus:border-[#006a39] focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-[#073b4c] block mb-1">
                  Password *
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  required
                  className="w-full bg-[#fbfdfb] border border-[#d6e4d8] rounded-xl px-3 py-2.5 text-sm text-[#073b4c] placeholder:text-[#9bb09f] focus:outline-none focus:border-[#006a39] focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#073b4c] block mb-1">
                  Confirm Password *
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                  placeholder="Confirm"
                  required
                  className="w-full bg-[#fbfdfb] border border-[#d6e4d8] rounded-xl px-3 py-2.5 text-sm text-[#073b4c] placeholder:text-[#9bb09f] focus:outline-none focus:border-[#006a39] focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            {error && <ErrorBox msg={error} />}
            {success && <SuccessBox msg={success} />}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-emerald-950/10 cursor-pointer mt-1"
              style={{ background: cfg.gradient }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Register as {cfg.label}</span>
              )}
            </button>
          </form>
        )}

        {/* ── Sub-options & Helper Links ── */}
        <div className="pt-3 border-t border-[#e8f0e9] flex flex-col gap-2 text-center text-xs text-[#627765]">
          {selectedRole === "retailer" && (
            <button
              type="button"
              onClick={() => {
                setStatusQuery(email || "");
                setShowStatusModal(true);
                if (email) handleCheckStatus(undefined, email);
              }}
              className="text-[#006a39] font-bold hover:underline cursor-pointer"
            >
              Applied as Retailer? Check your verification status →
            </button>
          )}

          {onBackToStore && (
            <button
              type="button"
              onClick={onBackToStore}
              className="hover:text-[#073b4c] transition-colors cursor-pointer"
            >
              Want to browse products first? <span className="font-bold underline text-[#006a39]">Continue as Guest</span>
            </button>
          )}
        </div>

      </div>

      {/* ── Forgot Password Modal ── */}
      {showForgot && (
        <div
          className="fixed inset-0 bg-[#07242e]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowForgot(false)}
        >
          <div
            className="bg-white border border-[#e4ede2] rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-['Manrope',sans-serif] font-bold text-base text-[#073b4c]">
                Reset Password
              </h3>
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="w-7 h-7 rounded-full bg-[#f0f5f1] hover:bg-[#e2ede4] flex items-center justify-center text-xs text-[#073b4c] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#627765] leading-relaxed">
              Enter your registered email address and we will send you a password reset link.
            </p>

            <form onSubmit={handleForgotSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-[#fbfdfb] border border-[#d6e4d8] rounded-xl px-3.5 py-2.5 text-sm text-[#073b4c] focus:outline-none focus:border-[#006a39] focus:ring-2 focus:ring-emerald-500/20"
              />

              {forgotError && <ErrorBox msg={forgotError} />}
              {forgotSuccess && <SuccessBox msg={forgotSuccess} />}

              <div className="flex gap-2.5 mt-1">
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#d6e4d8] text-xs font-bold text-[#627765] hover:bg-[#f4faf5] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#006a39] text-white text-xs font-bold hover:bg-[#005a30] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {forgotLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{forgotLoading ? "Sending..." : "Send Link"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Check Retailer Approval Status Modal ── */}
      {showStatusModal && (
        <div
          className="fixed inset-0 bg-[#07242e]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="bg-white border border-[#e4ede2] rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-['Manrope',sans-serif] font-bold text-base text-[#073b4c]">
                Retailer Application Status
              </h3>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="w-7 h-7 rounded-full bg-[#f0f5f1] hover:bg-[#e2ede4] flex items-center justify-center text-xs text-[#073b4c] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCheckStatus} className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-[#073b4c]">
                Registered Email or Phone Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={statusQuery}
                  onChange={(e) => setStatusQuery(e.target.value)}
                  placeholder="email@example.com or 9876543210"
                  required
                  className="flex-1 bg-[#fbfdfb] border border-[#d6e4d8] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-[#073b4c] focus:outline-none focus:border-[#006a39] focus:ring-2 focus:ring-emerald-500/20"
                />
                <button
                  type="submit"
                  disabled={statusLoading}
                  className="px-4 py-2 rounded-xl bg-[#006a39] hover:bg-[#005a30] text-white text-xs font-bold transition-all disabled:opacity-60 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  {statusLoading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{statusLoading ? "Checking..." : "Check"}</span>
                </button>
              </div>
            </form>

            {/* Results */}
            {statusResult.searched && (
              <div className="pt-3 border-t border-[#e8f0e9] animate-in fade-in duration-150">
                {statusResult.found && statusResult.retailer ? (
                  <div className="flex flex-col gap-3">
                    <div
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold ${
                        statusResult.retailer.approvalStatus === "approved"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : statusResult.retailer.approvalStatus === "pending"
                          ? "bg-amber-50 border-amber-200 text-amber-900"
                          : "bg-red-50 border-red-200 text-red-900"
                      }`}
                    >
                      <span>
                        {statusResult.retailer.approvalStatus === "approved"
                          ? "🎉 Wholesale Account Approved"
                          : statusResult.retailer.approvalStatus === "pending"
                          ? "⏳ Application Under Review"
                          : "❌ Application Declined"}
                      </span>
                      <span className="uppercase text-[10px] px-2 py-0.5 rounded-full bg-white/70">
                        {statusResult.retailer.approvalStatus}
                      </span>
                    </div>

                    <div className="bg-[#f7faf7] border border-[#e2ece0] rounded-xl p-3 text-xs flex flex-col gap-1.5 text-[#596b5e]">
                      <div className="flex justify-between">
                        <span>Shop:</span>
                        <strong className="text-[#073b4c]">{statusResult.retailer.shopName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Contact:</span>
                        <span className="text-[#073b4c]">{statusResult.retailer.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Email:</span>
                        <span className="font-mono text-emerald-800">{statusResult.retailer.email}</span>
                      </div>
                    </div>

                    {statusResult.retailer.approvalStatus === "approved" && (
                      <button
                        type="button"
                        onClick={() => {
                          setEmail(statusResult.retailer!.email);
                          setSelectedRole("retailer");
                          setMode("login");
                          setShowStatusModal(false);
                        }}
                        className="w-full py-2.5 rounded-xl bg-[#006a39] text-white text-xs font-bold hover:bg-[#005a30] transition-colors cursor-pointer"
                      >
                        Sign In as Retailer Now →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-[#f7faf7] rounded-xl border border-[#e2ece0] text-xs">
                    <p className="font-bold text-[#073b4c]">No Application Found</p>
                    <p className="text-[#718574] text-[11px] mt-0.5">
                      No retailer record found for &ldquo;{statusQuery}&rdquo;.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
