import { useState } from "react";
import type { UserRole, CurrentUser } from "../App";

interface Props {
  onLogin: (user: CurrentUser) => void;
}

type RoleCfg = {
  label: string;
  desc: string;
  accent: string;
  lightBg: string;
  demoEmail: string;
  demoPass: string;
  name: string;
};

const ROLES: Record<UserRole, RoleCfg> = {
  admin: {
    label: "Admin",
    desc: "Full platform access",
    accent: "#073b4c",
    lightBg: "#e8f4f8",
    demoEmail: "admin@subhone.com",
    demoPass: "admin123",
    name: "Admin User",
  },
  retailer: {
    label: "Retailer",
    desc: "Manage your storefront",
    accent: "#006a39",
    lightBg: "#e8f5ee",
    demoEmail: "retailer@subhone.com",
    demoPass: "retail123",
    name: "Retailer Partner",
  },
  customer: {
    label: "Customer",
    desc: "Shop & track orders",
    accent: "#0369a1",
    lightBg: "#e0f2fe",
    demoEmail: "customer@subhone.com",
    demoPass: "any password",
    name: "Valued Customer",
  },
};

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

const DEMO_PROFILES: Partial<Record<UserRole, { phone: string; shopName?: string; joinedDate: string; addresses: import("../App").Address[] }>> = {
  retailer: {
    phone: "+91 98765 43210",
    shopName: "Sharma Medical Store",
    joinedDate: "Jan 15, 2025",
    addresses: [{
      id: "r1", label: "Shop", name: "Sharma Medical Store", phone: "+91 98765 43210",
      line1: "Shop No. 4, Laxmi Market", line2: "Dadar West", city: "Mumbai",
      state: "Maharashtra", pincode: "400028", isDefault: true,
    }],
  },
  customer: {
    phone: "+91 87654 32109",
    joinedDate: "Mar 8, 2025",
    addresses: [{
      id: "c1", label: "Home", name: "Priya Singh", phone: "+91 87654 32109",
      line1: "Flat 4B, Sunrise Apartments", line2: "Viman Nagar", city: "Pune",
      state: "Maharashtra", pincode: "411014", isDefault: true,
    }],
  },
};

const FIELD_CLS = "w-full bg-[#f8fafb] border border-[#e4ede2] rounded-xl px-4 py-3 text-sm text-[#073b4c] placeholder:text-[#c0ccc0] focus:outline-none transition-all";

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [selectedRole, setSelectedRole] = useState<UserRole>("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Signup-only fields
  const [signupName, setSignupName]       = useState("");
  const [signupPhone, setSignupPhone]     = useState("");
  const [signupShop, setSignupShop]       = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");

  const cfg = ROLES[selectedRole];

  const resetForm = () => { setEmail(""); setPassword(""); setSignupName(""); setSignupPhone(""); setSignupShop(""); setSignupConfirm(""); setError(""); };

  const handleRoleSelect = (role: UserRole) => { setSelectedRole(role); setError(""); setEmail(""); setPassword(""); };
  const switchMode = (m: "login" | "signup") => { setMode(m); resetForm(); if (m === "signup" && selectedRole === "admin") setSelectedRole("customer"); };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      let valid = false;
      if (selectedRole === "customer") valid = /\S+@\S+\.\S+/.test(email) && password.length >= 3;
      else valid = email === cfg.demoEmail && password === cfg.demoPass;
      if (valid) {
        const demo = DEMO_PROFILES[selectedRole];
        onLogin({
          role: selectedRole, email, name: cfg.name,
          phone: demo?.phone, shopName: demo?.shopName,
          addresses: demo?.addresses ?? [],
          joinedDate: demo?.joinedDate,
        });
      } else {
        setError(selectedRole === "customer"
          ? "Invalid credentials. Use any valid email and a password with 3+ characters."
          : `Wrong credentials. Demo: ${cfg.demoEmail} / ${cfg.demoPass}`
        );
        setLoading(false);
      }
    }, 600);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!signupName.trim())                         { setError("Please enter your full name."); return; }
    if (!/\S+@\S+\.\S+/.test(email))               { setError("Please enter a valid email address."); return; }
    if (selectedRole === "retailer" && !signupShop.trim()) { setError("Please enter your shop or business name."); return; }
    if (password.length < 6)                        { setError("Password must be at least 6 characters."); return; }
    if (password !== signupConfirm)                 { setError("Passwords do not match."); return; }
    setLoading(true);
    setTimeout(() => {
      onLogin({
        role: selectedRole, email, name: signupName.trim(),
        phone: signupPhone || undefined,
        shopName: selectedRole === "retailer" ? signupShop.trim() : undefined,
        addresses: [],
        joinedDate: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      });
    }, 700);
  };

  const fillDemo = () => {
    setEmail(cfg.demoEmail);
    setPassword(cfg.demoPass === "any password" ? "pass123" : cfg.demoPass);
    setError("");
  };

  const signupRoles = (["retailer", "customer"] as UserRole[]);

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
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 4.5L3.5 7L8 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
                      {role === "admin"    && <ShieldIcon color={active ? "white" : r.accent} />}
                      {role === "retailer" && <StoreIcon color={active ? "white" : r.accent} />}
                      {role === "customer" && <PersonIcon color={active ? "white" : r.accent} />}
                    </div>
                    <p className="font-bold text-[10px] sm:text-[11px]" style={{ color: active ? r.accent : "#6d7a6f" }}>{r.label}</p>
                    <p className="text-[8px] sm:text-[9px] text-center leading-[11px] sm:leading-[12px] hidden sm:block" style={{ color: active ? r.accent + "bb" : "#b0bcb2" }}>{r.desc}</p>
                    {active && (
                      <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: r.accent }}>
                        <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><path d="M1 3.5L3 5.5L6 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
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

          {/* ── LOGIN FORM ── */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="flex flex-col gap-3.5 sm:gap-4">
              <div>
                <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">Email Address</label>
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder={cfg.demoEmail} required className={FIELD_CLS}
                  onFocus={(e) => (e.target.style.borderColor = cfg.accent)} onBlur={(e) => (e.target.style.borderColor = "#e4ede2")} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="Enter your password" required className={`${FIELD_CLS} pr-12`}
                    onFocus={(e) => (e.target.style.borderColor = cfg.accent)} onBlur={(e) => (e.target.style.borderColor = "#e4ede2")} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9aa89b] hover:text-[#073b4c] transition-colors">
                    {showPass ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              {error && <ErrorBox msg={error} />}
              <button type="submit" disabled={loading}
                className="w-full py-3 sm:py-3.5 rounded-xl font-['Manrope',sans-serif] font-bold text-sm sm:text-[15px] text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60 mt-1"
                style={{ backgroundColor: cfg.accent }}>
                {loading ? "Signing in…" : `Sign In as ${cfg.label}`}
              </button>
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
                  <label className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">Phone</label>
                  <input type="tel" value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX" className={FIELD_CLS}
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
              <button type="submit" disabled={loading}
                className="w-full py-3 sm:py-3.5 rounded-xl font-['Manrope',sans-serif] font-bold text-sm sm:text-[15px] text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                style={{ backgroundColor: cfg.accent }}>
                {loading ? "Creating account…" : `Create ${cfg.label} Account`}
              </button>
              <p className="text-center text-[11px] text-[#9aa89b]">
                By signing up you agree to SubhOne's terms of service and privacy policy.
              </p>
            </form>
          )}

          {/* Demo credentials — login only */}
          {mode === "login" && (
            <div className="bg-[#f8fafb] border border-[#e4ede2] rounded-xl p-3.5 sm:p-4">
              <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                <p className="text-[10px] font-bold text-[#073b4c] uppercase tracking-[0.8px]">Demo Credentials</p>
                <button onClick={fillDemo} className="text-[11px] font-bold hover:underline transition-colors" style={{ color: cfg.accent }}>
                  Auto-fill ↗
                </button>
              </div>
              <div className="grid grid-cols-[64px_1fr] gap-y-1.5 gap-x-3 text-xs">
                <span className="text-[#9aa89b]">Email</span>
                <span className="text-[#073b4c] font-medium">{cfg.demoEmail}</span>
                <span className="text-[#9aa89b]">Password</span>
                <span className="text-[#073b4c] font-medium">{cfg.demoPass}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="bg-[#fff0ee] border border-[#ffd5cf] rounded-xl p-3.5 flex items-start gap-2.5">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-0.5">
        <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8C1.5 11.59 4.41 14.5 8 14.5C11.59 14.5 14.5 11.59 14.5 8C14.5 4.41 11.59 1.5 8 1.5ZM8.75 11H7.25V9.5H8.75V11ZM8.75 8H7.25V5H8.75V8Z" fill="#c0392b"/>
      </svg>
      <p className="text-[#c0392b] text-xs leading-relaxed">{msg}</p>
    </div>
  );
}
