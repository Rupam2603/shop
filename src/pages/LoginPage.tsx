import { useEffect, useState } from "react";
import type { UserRole } from "../App";
import { useAuth } from "../contexts/AuthContext";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import { lookupRetailerApprovalStatus, registerOrUpdateRetailer, RetailerAccount } from "../lib/retailers";

// ─── Role UI configuration ────────────────────────────────────────────────────

type RoleCfg = {
  label: string;
  desc: string;
  accent: string;
  lightBg: string;
};

const ROLES: Record<UserRole, RoleCfg> = {
  admin: {
    label: "Admin",
    desc: "Full platform access",
    accent: "#073b4c",
    lightBg: "#e8f4f8",
  },
  retailer: {
    label: "Retailer",
    desc: "Manage your storefront",
    accent: "#006a39",
    lightBg: "#e8f5ee",
  },
  customer: {
    label: "Customer",
    desc: "Shop & track orders",
    accent: "#0369a1",
    lightBg: "#e0f2fe",
  },
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function ShieldIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
      <path d="M10 1L1 5V11C1 16.55 4.84 21.74 10 23C15.16 21.74 19 16.55 19 11V5L10 1ZM8 16L4 12L5.41 10.59L8 13.17L14.59 6.58L16 8L8 16Z" fill={color} />
    </svg>
  );
}

function StoreIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="20" viewBox="0 0 22 20" fill="none">
      <path d="M2 10H4V19H18V10H20V8L18 2H4L2 8V10ZM6 4H16L17.42 8H4.58L6 4ZM16 10V17H14V13H8V17H6V10H16ZM10 17V15H12V17H10Z" fill={color} />
    </svg>
  );
}

function PersonIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
      <path d="M10 11C12.76 11 15 8.76 15 6C15 3.24 12.76 1 10 1C7.24 1 5 3.24 5 6C5 8.76 7.24 11 10 11ZM10 13C6.67 13 0 14.67 0 18V20H20V18C20 14.67 13.33 13 10 13Z" fill={color} />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
      <path d="M9 0C5 0 1.73 2.61 0 7C1.73 11.39 5 14 9 14C13 14 16.27 11.39 18 7C16.27 2.61 13 0 9 0ZM9 11.5C6.52 11.5 4.5 9.48 4.5 7C4.5 4.52 6.52 2.5 9 2.5C11.48 2.5 13.5 4.52 13.5 7C13.5 9.48 11.48 11.5 9 11.5ZM9 4.5C7.62 4.5 6.5 5.62 6.5 7C6.5 8.38 7.62 9.5 9 9.5C10.38 9.5 11.5 8.38 11.5 7C11.5 5.62 10.38 4.5 9 4.5Z" fill="currentColor" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M1 1L17 17M7.53 7.53C7.2 7.86 7 8.31 7 8.8C7 9.92 7.9 10.8 9 10.8C9.5 10.8 9.95 10.6 10.28 10.27M13.18 13.18C12 14.03 10.56 14.5 9 14.5C5.18 14.5 1.94 12.24 0.46 9C1.15 7.56 2.19 6.37 3.47 5.5M6.82 2.52C7.52 2.18 8.24 2 9 2C12.82 2 16.06 4.26 17.54 7.5C17.06 8.53 16.38 9.44 15.56 10.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="bg-[#fff1f0] border border-[#ffa39e] rounded-xl p-3.5 flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
      <div className="w-5 h-5 rounded-full bg-[#ff4d4f] text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
        !
      </div>
      <div>
        <p className="text-[#cf1322] font-bold text-xs">Login Error</p>
        <p className="text-[#a8071a] text-xs leading-relaxed mt-0.5">{msg}</p>
      </div>
    </div>
  );
}

function SuccessBox({ msg }: { msg: string }) {
  return (
    <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl p-3.5 flex items-start gap-2.5">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
        <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM6.5 11.5L3 8L4.06 6.94L6.5 9.37L11.94 3.93L13 5L6.5 11.5Z" fill="#047857" />
      </svg>
      <p className="text-[#047857] text-xs leading-relaxed">{msg}</p>
    </div>
  );
}

const FIELD_CLS = "w-full bg-[#f8fafb] border border-[#e4ede2] rounded-xl px-4 py-3 text-sm text-[#073b4c] placeholder:text-[#c0ccc0] focus:outline-none transition-all";

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const { signIn, signUp, resetPassword, pendingApprovalInfo, clearPendingApproval } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [selectedRole, setSelectedRole] = useState<UserRole>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-populate remembered credentials on mount
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem("subhone_remember_email");
      const savedRole = localStorage.getItem("subhone_remember_role") as UserRole | null;
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
        if (savedRole && (savedRole === "admin" || savedRole === "retailer" || savedRole === "customer")) {
          setSelectedRole(savedRole);
        }
      }
    } catch {
      // LocalStorage access restricted
    }
  }, []);

  // Forgot password modal state
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotError, setForgotError] = useState("");

  // Signup-only fields
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupShop, setSignupShop] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");

  // Check Retailer Approval Status modal state
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

  const cfg = ROLES[selectedRole];

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
    setSignupShop(""); setSignupConfirm(""); setError(""); setSuccess("");
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError("");
    setSuccess("");
  };

  const switchMode = (m: "login" | "signup") => {
    setMode(m);
    resetForm();
    // Admin cannot self-register — force to customer if switching to signup
    if (m === "signup" && selectedRole === "admin") setSelectedRole("customer");
  };

  // ── Real Supabase Login ────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!password) { setError("Please enter your password."); return; }

    // Save or clear remember credentials
    try {
      if (rememberMe) {
        localStorage.setItem("subhone_remember_email", email.trim());
        localStorage.setItem("subhone_remember_role", selectedRole);
      } else {
        localStorage.removeItem("subhone_remember_email");
        localStorage.removeItem("subhone_remember_role");
      }
    } catch {
      // Ignore storage error
    }

    setLoading(true);
    const { error: authError } = await signIn(email.trim(), password, selectedRole);
    setLoading(false);

    if (authError) {
      setError(authError);
    }
    // On success, AuthContext updates appUser → App.tsx re-renders automatically
  };

  // ── Real Supabase Signup ───────────────────────────────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Client-side validation
    if (!signupName.trim()) { setError("Please enter your full name."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email address."); return; }
    if (selectedRole === "retailer" && !signupShop.trim()) { setError("Please enter your shop or business name."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== signupConfirm) { setError("Passwords do not match."); return; }

    // Security: only customer and retailer allowed via public signup
    const safeRole: "customer" | "retailer" = selectedRole === "retailer" ? "retailer" : "customer";

    setLoading(true);

    // If retailer, immediately persist application to Supabase retailer_approvals
    if (safeRole === "retailer") {
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
    }

    const { error: authError, emailConfirmationRequired } = await signUp({
      email: email.trim(),
      password,
      fullName: signupName.trim(),
      phone: signupPhone || undefined,
      shopName: selectedRole === "retailer" ? signupShop.trim() : undefined,
      role: safeRole,
    });
    setLoading(false);

    if (authError) {
      setError(authError);
      return;
    }

    if (emailConfirmationRequired) {
      setSuccess(
        `Account created! We've sent a confirmation link to ${email}. ` +
        "Please check your inbox (and spam folder) and click the link to activate your account."
      );
      resetForm();
      setMode("login");
    }
    // If no email confirmation needed, AuthContext fires and App re-renders
  };

  // Roles available for signup (no admin — admin is created manually via Supabase dashboard)
  const signupRoles: UserRole[] = ["retailer", "customer"];

  return (
    <div className="min-h-screen flex">
      {/* Brand Panel */}
      <div
        className="hidden lg:flex w-[44%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: "linear-gradient(155deg, #073b4c 0%, #0a5568 50%, #006a39 100%)" }}
      >
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-[0.08]" style={{ backgroundColor: "white" }} />
        <div className="absolute top-1/3 -left-32 w-80 h-80 rounded-full opacity-[0.06]" style={{ backgroundColor: "white" }} />
        <div className="absolute -bottom-16 right-16 w-64 h-64 rounded-full opacity-[0.07]" style={{ backgroundColor: "white" }} />
        <div className="absolute bottom-48 -right-16 w-48 h-48 rounded-full opacity-[0.05]" style={{ backgroundColor: "white" }} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 1L1 5V11C1 17.55 5.84 22.74 11 24C16.16 22.74 21 17.55 21 11V5L11 1Z" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <div>
            <p className="font-['Manrope',sans-serif] font-extrabold text-white text-2xl tracking-tight leading-none">SubhOne</p>
            <p className="text-white/50 text-[11px] tracking-[1px] uppercase mt-0.5">Healthcare Platform</p>
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-8">
          <div>
            <h2 className="font-['Manrope',sans-serif] font-bold text-white text-[32px] leading-[40px]">
              {mode === "signup" ? "Join thousands\nof partners" : "Your trusted\nhealth partner"}
            </h2>
            <p className="text-white/65 text-[15px] mt-3 leading-relaxed max-w-xs">
              {mode === "signup"
                ? "Medicines, wellness products, and B2B supply — all streamlined on one platform."
                : "Medicines, lab tests, consultations, and wellness products — all in one platform."}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {(mode === "signup"
              ? ["Fast account setup in under 2 minutes", "Exclusive retailer pricing available", "Dedicated support from day one"]
              : ["Genuine, certified products only", "24/7 healthcare support available", "Fast & reliable doorstep delivery"]
            ).map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 4.5L3.5 7L8 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <span className="text-white/75 text-[13px]">{f}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[{ n: "84+", l: "Products" }, { n: "8", l: "Cities" }, { n: "500+", l: "Retailers" }].map((s) => (
              <div key={s.l} className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 text-center border border-white/10">
                <p className="font-['Manrope',sans-serif] font-extrabold text-white text-2xl">{s.n}</p>
                <p className="text-white/55 text-[11px] mt-0.5 tracking-wide">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-white/30 text-xs">© 2026 SubhOne Healthcare. All rights reserved.</p>
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-8 py-8 sm:py-12 overflow-y-auto min-h-screen">
        <div className="w-full max-w-[440px] flex flex-col gap-5 sm:gap-6">
          <div className="lg:hidden font-['Manrope',sans-serif] font-extrabold text-[#006a39] text-2xl sm:text-3xl">SubhOne</div>

          {/* Mode toggle */}
          <div className="flex bg-[#f8fafb] border border-[#e4ede2] rounded-xl p-1">
            {(["login", "signup"] as const).map((m) => (
              <button key={m} onClick={() => switchMode(m)}
                className="flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all"
                style={mode === m ? { backgroundColor: "white", color: "#073b4c", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" } : { color: "#9aa89b" }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {/* Header */}
          <div>
            <h1 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-2xl sm:text-[26px] leading-tight">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-[#6d7a6f] text-xs sm:text-sm mt-1">
              {mode === "login"
                ? "Sign in to your SubhOne account to continue"
                : "Join SubhOne as a retailer or customer — free to start"}
            </p>
          </div>

          {/* Role selector */}
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[1px]">Select your role</p>
            <div className={`grid gap-2 sm:gap-2.5 ${mode === "signup" ? "grid-cols-2" : "grid-cols-3"}`}>
              {(mode === "signup" ? signupRoles : (["admin", "retailer", "customer"] as UserRole[])).map((role) => {
                const r = ROLES[role];
                const active = selectedRole === role;
                return (
                  <button key={role} onClick={() => handleRoleSelect(role)}
                    className="relative flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3.5 rounded-xl border-2 transition-all duration-200"
                    style={{ borderColor: active ? r.accent : "#e4ede2", backgroundColor: active ? r.lightBg : "white" }}>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-colors"
                      style={{ backgroundColor: active ? r.accent : "#f0f4f0" }}>
                      {role === "admin" && <ShieldIcon color={active ? "white" : r.accent} />}
                      {role === "retailer" && <StoreIcon color={active ? "white" : r.accent} />}
                      {role === "customer" && <PersonIcon color={active ? "white" : r.accent} />}
                    </div>
                    <p className="font-bold text-[10px] sm:text-[11px]" style={{ color: active ? r.accent : "#6d7a6f" }}>{r.label}</p>
                    <p className="text-[8px] sm:text-[9px] text-center leading-[11px] sm:leading-[12px] hidden sm:block" style={{ color: active ? r.accent + "bb" : "#b0bcb2" }}>{r.desc}</p>
                    {active && (
                      <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: r.accent }}>
                        <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M1 3.5L3 5.5L6 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {mode === "signup" && (
              <p className="text-[10px] text-[#9aa89b] mt-0.5">Admin accounts are created by platform management only.</p>
            )}
          </div>

          {/* ── PENDING RETAILER APPROVAL NOTICE ── */}
          {pendingApprovalInfo && (
            <div className="bg-[#fffbeb] border border-[#fde68a] rounded-2xl p-4 sm:p-5 mb-4 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#fef3c7] text-[#d97706] flex items-center justify-center text-xl shrink-0">
                  ⏳
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-['Manrope',sans-serif] font-extrabold text-[#92400e] text-sm sm:text-base">
                      {pendingApprovalInfo.status === "rejected" ? "Application Declined" : "Retailer Account Pending Approval"}
                    </h4>
                    <span className="text-[10px] bg-[#fef3c7] text-[#b45309] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {pendingApprovalInfo.status === "rejected" ? "Declined" : "Pending Verification"}
                    </span>
                  </div>
                  <p className="text-xs text-[#b45309] mt-1.5 leading-relaxed">
                    Retailer application for <strong>{pendingApprovalInfo.shopName}</strong> ({pendingApprovalInfo.email}) is currently awaiting administrator verification.
                  </p>
                  <p className="text-[11px] text-[#78350f] mt-1 font-medium">
                    Once approved by the SubhOne Admin in the dashboard, you will be granted full access to the Retailer Wholesale portal.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-[#fde68a]">
                    <button
                      type="button"
                      onClick={() => {
                        setStatusQuery(pendingApprovalInfo.email);
                        setShowStatusModal(true);
                        handleCheckStatus(undefined, pendingApprovalInfo.email);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#d97706] hover:bg-[#b45309] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <span>🔍</span>
                      <span>View Live Status Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={clearPendingApproval}
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-[#fde68a] text-[#92400e] hover:bg-[#fef3c7] text-xs font-bold transition-all cursor-pointer"
                    >
                      Sign In with Another Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Check Retailer Approval Status Banner */}
          {selectedRole === "retailer" && !pendingApprovalInfo && (
            <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3 mb-3.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">🏪</span>
                <p className="text-xs text-[#166534] font-medium truncate">
                  Already registered as a Retailer? Check your approval progress.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStatusQuery(email || "");
                  setShowStatusModal(true);
                  if (email) handleCheckStatus(undefined, email);
                }}
                className="text-xs font-bold text-[#006a39] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Check Status →
              </button>
            </div>
          )}

          {/* ── LOGIN FORM ── */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="flex flex-col gap-3.5 sm:gap-4">
              <div>
                <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">Email Address</label>
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="you@example.com" required className={`${FIELD_CLS} ${error ? "!border-[#ef4444] !bg-[#fff8f8]" : ""}`}
                  onFocus={(e) => (e.target.style.borderColor = error ? "#ef4444" : cfg.accent)} onBlur={(e) => (e.target.style.borderColor = error ? "#ef4444" : "#e4ede2")} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px]">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotError("");
                      setForgotSuccess("");
                      setShowForgot(true);
                    }}
                    className="text-[11px] font-semibold text-[#006a39] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="Enter your password" required className={`${FIELD_CLS} pr-12 ${error ? "!border-[#ef4444] !bg-[#fff8f8]" : ""}`}
                    onFocus={(e) => (e.target.style.borderColor = error ? "#ef4444" : cfg.accent)} onBlur={(e) => (e.target.style.borderColor = error ? "#ef4444" : "#e4ede2")} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9aa89b] hover:text-[#073b4c] transition-colors">
                    {showPass ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between py-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#e4ede2] text-[#006a39] focus:ring-[#006a39] accent-[#006a39] cursor-pointer"
                  />
                  <span className="text-xs text-[#6d7a6f] font-medium hover:text-[#073b4c] transition-colors">
                    Remember my credentials
                  </span>
                </label>
              </div>

              {error && <ErrorBox msg={error} />}
              {success && <SuccessBox msg={success} />}
              <button type="submit" disabled={loading}
                className="w-full py-3 sm:py-3.5 rounded-xl font-['Manrope',sans-serif] font-bold text-sm sm:text-[15px] text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 mt-1 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                style={{ backgroundColor: cfg.accent }}>
                {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {loading ? "Signing in…" : `Sign In as ${cfg.label}`}
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-[#e4ede2]" />
                <span className="text-[10px] text-[#9aa89b] uppercase font-bold tracking-wider">or fast sign in</span>
                <div className="flex-1 h-px bg-[#e4ede2]" />
              </div>

              <SignInButton mode="modal" fallbackRedirectUrl="/" forceRedirectUrl="/">
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem("subhone_signing_up_role", selectedRole);
                  }}
                  className="w-full py-3 px-4 rounded-xl border border-[#e4ede2] bg-[#f8fafb] hover:bg-[#f0f4f0] text-[#073b4c] text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Continue with Clerk</span>
                </button>
              </SignInButton>
            </form>
          )}

          {/* ── SIGNUP FORM ── */}
          {mode === "signup" && (
            <form onSubmit={handleSignup} className="flex flex-col gap-3.5 sm:gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">Full Name *</label>
                  <input type="text" value={signupName} onChange={(e) => { setSignupName(e.target.value); setError(""); }}
                    placeholder="Your full name" required className={FIELD_CLS}
                    onFocus={(e) => (e.target.style.borderColor = cfg.accent)} onBlur={(e) => (e.target.style.borderColor = "#e4ede2")} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">Email *</label>
                  <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="you@example.com" required className={FIELD_CLS}
                    onFocus={(e) => (e.target.style.borderColor = cfg.accent)} onBlur={(e) => (e.target.style.borderColor = "#e4ede2")} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">Phone Number</label>
                  <input type="tel" value={signupPhone} onChange={(e) => setSignupPhone(e.target.value.replace(/[^0-9+]/g, ""))}
                    placeholder="9876543210 (10-digit number)" className={FIELD_CLS}
                    onFocus={(e) => (e.target.style.borderColor = cfg.accent)} onBlur={(e) => (e.target.style.borderColor = "#e4ede2")} />
                </div>
                {selectedRole === "retailer" && (
                  <div className="sm:col-span-2">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px]">Shop / Business Name *</label>
                      <span className="text-[9px] bg-[#e8f5ee] text-[#006a39] font-bold px-1.5 py-0.5 rounded uppercase">Required</span>
                    </div>
                    <input type="text" value={signupShop} onChange={(e) => { setSignupShop(e.target.value); setError(""); }}
                      placeholder="e.g. Sharma Medical Store" required className={FIELD_CLS}
                      onFocus={(e) => (e.target.style.borderColor = cfg.accent)} onBlur={(e) => (e.target.style.borderColor = "#e4ede2")} />
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">Password *</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder="Min. 6 characters" required className={`${FIELD_CLS} pr-10`}
                      onFocus={(e) => (e.target.style.borderColor = cfg.accent)} onBlur={(e) => (e.target.style.borderColor = "#e4ede2")} />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa89b] hover:text-[#073b4c] transition-colors">
                      {showPass ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">Confirm Password *</label>
                  <input type="password" value={signupConfirm} onChange={(e) => { setSignupConfirm(e.target.value); setError(""); }}
                    placeholder="Repeat password" required className={FIELD_CLS}
                    onFocus={(e) => (e.target.style.borderColor = cfg.accent)} onBlur={(e) => (e.target.style.borderColor = "#e4ede2")} />
                </div>
              </div>
              {error && <ErrorBox msg={error} />}
              {success && <SuccessBox msg={success} />}
              <button type="submit" disabled={loading}
                className="w-full py-3 sm:py-3.5 rounded-xl font-['Manrope',sans-serif] font-bold text-sm sm:text-[15px] text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
                style={{ backgroundColor: cfg.accent }}>
                {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {loading ? "Creating account…" : `Create ${cfg.label} Account`}
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-[#e4ede2]" />
                <span className="text-[10px] text-[#9aa89b] uppercase font-bold tracking-wider">or sign up with</span>
                <div className="flex-1 h-px bg-[#e4ede2]" />
              </div>

              <SignUpButton mode="modal" fallbackRedirectUrl="/" forceRedirectUrl="/">
                <button
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem("subhone_signing_up_role", selectedRole);
                    if (signupShop.trim()) {
                      sessionStorage.setItem("subhone_signing_up_shop", signupShop.trim());
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl border border-[#e4ede2] bg-[#f8fafb] hover:bg-[#f0f4f0] text-[#073b4c] text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Sign Up with Clerk</span>
                </button>
              </SignUpButton>

              <p className="text-center text-[11px] text-[#9aa89b]">
                By signing up you agree to SubhOne&apos;s terms of service and privacy policy.
              </p>
            </form>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForgot(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowForgot(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f0f4f0] flex items-center justify-center text-[#073b4c] hover:bg-[#e4ede2] transition-colors"
            >
              ✕
            </button>
            <div className="w-12 h-12 rounded-2xl bg-[#e8f5ee] text-[#006a39] flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </div>
            <h3 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-xl">Reset Your Password</h3>
            <p className="text-[#6d7a6f] text-xs sm:text-sm mt-1 mb-5">
              Enter your registered email address and we will send you instructions to reset your password.
            </p>

            <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">Registered Email</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => { setForgotEmail(e.target.value); setForgotError(""); }}
                  placeholder="name@example.com"
                  required
                  className={FIELD_CLS}
                />
              </div>

              {forgotError && <ErrorBox msg={forgotError} />}
              {forgotSuccess && <SuccessBox msg={forgotSuccess} />}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#e4ede2] text-[#6d7a6f] font-bold text-xs sm:text-sm hover:bg-[#f8fafb]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 py-2.5 rounded-xl bg-[#006a39] text-white font-bold text-xs sm:text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {forgotLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {forgotLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Check Retailer Approval Status Modal ── */}
      {showStatusModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg p-6 sm:p-7 shadow-2xl relative border border-[#e4ede2] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowStatusModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f0f4f0] flex items-center justify-center text-[#073b4c] hover:bg-[#e4ede2] transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#e8f5ee] text-[#006a39] flex items-center justify-center text-2xl shrink-0">
                🏪
              </div>
              <div>
                <h3 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-lg sm:text-xl">
                  Retailer Approval Status Checker
                </h3>
                <p className="text-xs text-[#6d7a6f]">
                  Real-time lookup for SubhOne wholesale partner applications
                </p>
              </div>
            </div>

            <form onSubmit={handleCheckStatus} className="flex flex-col gap-3">
              <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px]">
                Enter Registered Email or Phone Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={statusQuery}
                  onChange={(e) => setStatusQuery(e.target.value)}
                  placeholder="e.g. your-shop@gmail.com or 9836000000"
                  required
                  className="flex-1 bg-[#f8fafb] border border-[#e4ede2] rounded-xl px-4 py-2.5 text-sm text-[#073b4c] placeholder:text-[#c0ccc0] focus:outline-none focus:border-[#006a39]"
                />
                <button
                  type="submit"
                  disabled={statusLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#006a39] hover:bg-[#005a30] text-white text-xs sm:text-sm font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 active:scale-95 shrink-0"
                >
                  {statusLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{statusLoading ? "Checking…" : "Check Live Status"}</span>
                </button>
              </div>
            </form>

            {/* Results Display */}
            {statusResult.searched && (
              <div className="mt-5 pt-4 border-t border-[#e4ede2] animate-in fade-in duration-200">
                {statusResult.found && statusResult.retailer ? (
                  <div className="flex flex-col gap-3">
                    {/* Status Banner */}
                    <div
                      className={`p-4 rounded-xl border flex items-start gap-3 ${
                        statusResult.retailer.approvalStatus === "approved"
                          ? "bg-[#ecfdf5] border-[#a7f3d0]"
                          : statusResult.retailer.approvalStatus === "pending"
                          ? "bg-[#fffbeb] border-[#fde68a]"
                          : "bg-[#fef2f2] border-[#fecaca]"
                      }`}
                    >
                      <div className="text-2xl shrink-0">
                        {statusResult.retailer.approvalStatus === "approved"
                          ? "🎉"
                          : statusResult.retailer.approvalStatus === "pending"
                          ? "⏳"
                          : "❌"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className={`font-['Manrope',sans-serif] font-bold text-sm ${
                              statusResult.retailer.approvalStatus === "approved"
                                ? "text-[#065f46]"
                                : statusResult.retailer.approvalStatus === "pending"
                                ? "text-[#92400e]"
                                : "text-[#991b1b]"
                            }`}
                          >
                            {statusResult.retailer.approvalStatus === "approved"
                              ? "Account Approved & Active!"
                              : statusResult.retailer.approvalStatus === "pending"
                              ? "Application Under Admin Review"
                              : "Application Declined"}
                          </h4>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              statusResult.retailer.approvalStatus === "approved"
                                ? "bg-[#d1fae5] text-[#047857]"
                                : statusResult.retailer.approvalStatus === "pending"
                                ? "bg-[#fef3c7] text-[#d97706] animate-pulse"
                                : "bg-[#fee2e2] text-[#b91c1c]"
                            }`}
                          >
                            {statusResult.retailer.approvalStatus}
                          </span>
                        </div>

                        <p
                          className={`text-xs mt-1 leading-relaxed ${
                            statusResult.retailer.approvalStatus === "approved"
                              ? "text-[#047857]"
                              : statusResult.retailer.approvalStatus === "pending"
                              ? "text-[#b45309]"
                              : "text-[#b91c1c]"
                          }`}
                        >
                          {statusResult.retailer.approvalStatus === "approved"
                            ? "Your retailer wholesale account has been verified by the SubhOne Admin. You can sign in now to access retailer wholesale prices."
                            : statusResult.retailer.approvalStatus === "pending"
                            ? "Your wholesale partner request is in the review queue. The administrator will activate your account shortly."
                            : "Your retailer application was declined or is suspended. Please reach out to admin@subhone.com for assistance."}
                        </p>
                      </div>
                    </div>

                    {/* Details Box */}
                    <div className="bg-[#f8fafb] border border-[#e4ede2] rounded-xl p-3.5 text-xs text-[#073b4c] flex flex-col gap-1.5">
                      <div className="flex justify-between">
                        <span className="text-[#9aa89b]">Shop Name:</span>
                        <span className="font-bold">{statusResult.retailer.shopName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#9aa89b]">Contact Person:</span>
                        <span className="font-semibold">{statusResult.retailer.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#9aa89b]">Registered Email:</span>
                        <span className="font-mono">{statusResult.retailer.email}</span>
                      </div>
                      {statusResult.retailer.phone && (
                        <div className="flex justify-between">
                          <span className="text-[#9aa89b]">Phone:</span>
                          <span>{statusResult.retailer.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Action button if approved */}
                    {statusResult.retailer.approvalStatus === "approved" && (
                      <button
                        type="button"
                        onClick={() => {
                          setEmail(statusResult.retailer!.email);
                          setSelectedRole("retailer");
                          setMode("login");
                          setShowStatusModal(false);
                        }}
                        className="w-full py-3 rounded-xl bg-[#006a39] hover:bg-[#005a30] text-white text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <span>Sign In as Retailer Now →</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-[#f8fafb] rounded-xl border border-[#e4ede2]">
                    <p className="text-xs font-bold text-[#073b4c]">No Retailer Application Found</p>
                    <p className="text-[11px] text-[#9aa89b] mt-0.5">
                      No retailer account matched <strong>&ldquo;{statusQuery}&rdquo;</strong>.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole("retailer");
                        setMode("signup");
                        setEmail(statusQuery.includes("@") ? statusQuery : "");
                        setShowStatusModal(false);
                      }}
                      className="mt-2.5 px-4 py-1.5 rounded-lg bg-[#006a39] text-white text-xs font-bold hover:bg-[#005a30] transition-colors cursor-pointer"
                    >
                      Sign Up as Retailer
                    </button>
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
