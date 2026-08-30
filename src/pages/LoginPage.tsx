import { useEffect, useState } from "react";
import type { UserRole } from "../App";
import { useAuth } from "../contexts/AuthContext";
import { lookupRetailerApprovalStatus, registerOrUpdateRetailer, RetailerAccount } from "../lib/retailers";

// ─── Role UI configuration ────────────────────────────────────────────────────

type RoleCfg = {
  label: string;
  badge: string;
  desc: string;
  accent: string;
  gradient: string;
  glow: string;
  lightBg: string;
  border: string;
};

const ROLES: Record<UserRole, RoleCfg> = {
  admin: {
    label: "Admin",
    badge: "Executive",
    desc: "Platform & approvals management",
    accent: "#073b4c",
    gradient: "linear-gradient(135deg, #073b4c 0%, #0c566d 100%)",
    glow: "rgba(7, 59, 76, 0.35)",
    lightBg: "rgba(7, 59, 76, 0.06)",
    border: "rgba(7, 59, 76, 0.25)",
  },
  retailer: {
    label: "Retailer",
    badge: "B2B Wholesale",
    desc: "Wholesale stock & order portal",
    accent: "#006a39",
    gradient: "linear-gradient(135deg, #006a39 0%, #008749 100%)",
    glow: "rgba(0, 106, 57, 0.35)",
    lightBg: "rgba(0, 106, 57, 0.06)",
    border: "rgba(0, 106, 57, 0.25)",
  },
  customer: {
    label: "Customer",
    badge: "Personal",
    desc: "Prescriptions & doorstep delivery",
    accent: "#0369a1",
    gradient: "linear-gradient(135deg, #0369a1 0%, #0284c7 100%)",
    glow: "rgba(3, 105, 161, 0.35)",
    lightBg: "rgba(3, 105, 161, 0.06)",
    border: "rgba(3, 105, 161, 0.25)",
  },
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function ShieldIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function StoreIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
    </svg>
  );
}

function PersonIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

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

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
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
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" />
      <path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

// ─── Feedback Boxes ───────────────────────────────────────────────────────────

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="bg-red-50/90 backdrop-blur-md border border-red-200/80 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs shadow-xs">
        !
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-red-900 font-bold text-xs tracking-wide">Authentication Notice</p>
        <p className="text-red-700 text-xs leading-relaxed mt-0.5 break-words">{msg}</p>
      </div>
    </div>
  );
}

function SuccessBox({ msg }: { msg: string }) {
  return (
    <div className="bg-emerald-50/90 backdrop-blur-md border border-emerald-200/80 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs shadow-xs">
        ✓
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-emerald-900 font-bold text-xs tracking-wide">Success</p>
        <p className="text-emerald-700 text-xs leading-relaxed mt-0.5 break-words">{msg}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LoginPage({ onBackToStore }: { onBackToStore?: () => void }) {
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
    if (role === "admin" && mode === "login") {
      setEmail("subhonehealthgroup@gmail.com");
      setPassword("Subhone@2026");
    }
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
  };

  const signupRoles: UserRole[] = ["retailer", "customer"];

  return (
    <div className="min-h-screen min-h-[100dvh] relative overflow-x-hidden flex items-center justify-center p-3 sm:p-6 lg:p-10 bg-[#07242e]">
      {/* ── AMBIENT GLASS BACKGROUND CANVAS ── */}
      {/* Deep gradient background layers */}
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: "radial-gradient(ellipse 80% 80% at 50% -20%, rgba(0, 106, 57, 0.45), rgba(7, 36, 46, 0.95) 75%), linear-gradient(180deg, #051a22 0%, #082933 50%, #03141a 100%)",
        }}
      />

      {/* Dynamic floating glass orbs */}
      <div className="fixed top-12 left-10 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none animate-float-slow z-0" />
      <div className="fixed bottom-10 right-10 w-[480px] h-[480px] rounded-full bg-teal-400/15 blur-3xl pointer-events-none animate-float-reverse z-0" />
      <div className="fixed top-1/2 right-1/4 w-72 h-72 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none animate-pulse-soft z-0" />
      <div className="fixed -bottom-20 left-1/3 w-80 h-80 rounded-full bg-amber-400/10 blur-3xl pointer-events-none animate-float-slow z-0" />

      {/* Delicate geometric mesh overlay */}
      <div 
        className="fixed inset-0 opacity-[0.035] pointer-events-none z-0"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.8) 1px, transparent 0)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* ── MASTER GLASS CONTAINER ── */}
      <div className="relative z-10 w-full max-w-6xl my-auto">
        
        {/* Top Floating Glass Header with Trust Indicators */}
        <div className="flex items-center justify-between px-2 sm:px-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/25 flex items-center justify-center shadow-lg shadow-emerald-950/20">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 6.5V12C3 17.5 6.8 22.2 12 23.5C17.2 22.2 21 17.5 21 12V6.5L12 2Z" fill="#10b981" />
                <path d="M12 7V17M7 12H17" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-['Manrope',sans-serif] font-extrabold text-white text-xl sm:text-2xl tracking-tight">
                  Subh<span className="text-emerald-400">One</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Health OS
                </span>
              </div>
              <p className="text-white/60 text-[11px] hidden sm:block">Integrated Healthcare & B2B Wholesale Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/80 text-xs font-medium shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>256-Bit SSL Secured</span>
            </div>
            <a 
              href="#/home" 
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Explore Store</span>
              <span>→</span>
            </a>
          </div>
        </div>

        {/* ── DUAL PANE GLASS CARD ── */}
        <div className="w-full rounded-3xl overflow-hidden glass-master-card border border-white/40 shadow-2xl flex flex-col lg:flex-row">
          
          {/* ── LEFT SHOWCASE PANE (Glassmorphic Deep Ambient Panel) ── */}
          <div 
            className="hidden lg:flex lg:w-5/12 p-10 flex-col justify-between relative overflow-hidden text-white"
            style={{
              background: "linear-gradient(160deg, rgba(7, 59, 76, 0.95) 0%, rgba(6, 44, 56, 0.92) 50%, rgba(0, 106, 57, 0.88) 100%)",
            }}
          >
            {/* Ambient specular highlight lines inside panel */}
            <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

            {/* Top Showcase Header */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white/90 text-xs font-semibold mb-6">
                <SparklesIcon className="text-emerald-300 animate-pulse" />
                <span>Next-Gen Healthcare Commerce</span>
              </div>

              <h2 className="font-['Manrope',sans-serif] font-extrabold text-white text-3xl xl:text-4xl leading-tight">
                {mode === "signup" ? (
                  <>
                    Accelerate Your <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-200">
                      Medical Business
                    </span>
                  </>
                ) : (
                  <>
                    Trusted Health & <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-200">
                      Wholesale Supply
                    </span>
                  </>
                )}
              </h2>

              <p className="text-white/75 text-sm leading-relaxed mt-4 max-w-sm">
                {mode === "signup"
                  ? "Access verified wholesale pricing, instant invoice generation, and seamless doorstep replenishment across 8+ cities."
                  : "Sign in to manage prescriptions, real-time inventory orders, multi-branch invoicing, and live shipment tracking."}
              </p>
            </div>

            {/* Middle Feature Cards */}
            <div className="relative z-10 my-8 flex flex-col gap-3.5">
              {(mode === "signup"
                ? [
                    { t: "Fast 2-Minute Onboarding", d: "Instant account activation with wholesale verification" },
                    { t: "Exclusive Wholesale Pricing", d: "Up to 35% margin on genuine certified pharmaceuticals" },
                    { t: "Dedicated Account Support", d: "24/7 dedicated supply desk for registered pharmacies" },
                  ]
                : [
                    { t: "100% Genuine & Certified", d: "Direct factory sourcing from licensed pharma partners" },
                    { t: "Real-Time Order Tracking", d: "Live temperature-controlled logistics & dispatch alerts" },
                    { t: "Unified Multi-Role Dashboard", d: "Manage retail operations and personal health seamlessly" },
                  ]
              ).map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 transition-all hover:bg-white/15"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-['Manrope',sans-serif] font-bold text-white text-xs tracking-wide">{item.t}</p>
                    <p className="text-white/60 text-[11px] leading-tight mt-0.5">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Glass Metric Badges */}
            <div className="relative z-10 pt-4 border-t border-white/15">
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { val: "84+", lbl: "Verified Meds" },
                  { val: "500+", lbl: "Pharmacies" },
                  { val: "99.8%", lbl: "On-Time Dispatch" },
                ].map((stat, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
                    <p className="font-['Manrope',sans-serif] font-extrabold text-white text-lg tracking-tight">{stat.val}</p>
                    <p className="text-white/60 text-[10px] uppercase font-bold tracking-wider mt-0.5">{stat.lbl}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ── RIGHT INTERACTIVE FORM PANE (Luminous Glassmorphism) ── */}
          <div className="flex-1 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white/85 backdrop-blur-2xl">
            
            <div className="max-w-xl mx-auto w-full flex flex-col gap-6">

              {/* Back to Store Action for Guests */}
              {onBackToStore && (
                <button
                  type="button"
                  onClick={onBackToStore}
                  className="self-start inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#f0f7f2] hover:bg-[#e4efe6] text-[#006a39] text-xs font-extrabold border border-[#cfe1d2] transition-all cursor-pointer shadow-2xs group"
                >
                  <span className="transition-transform group-hover:-translate-x-0.5">←</span>
                  <span>Explore Pharmacy Store as Guest</span>
                </button>
              )}

              {/* Mode Switcher Tabs (Segmented Glass Pill) */}
              <div className="flex p-1.5 rounded-2xl bg-[#f0f5f2] border border-[#d6e4d8] shadow-inner relative">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold font-['Manrope',sans-serif] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                    mode === "login"
                      ? "bg-white text-[#073b4c] shadow-md shadow-[#073b4c]/10 border border-white"
                      : "text-[#657969] hover:text-[#073b4c]"
                  }`}
                >
                  <LockIcon className={mode === "login" ? "text-[#006a39]" : "text-[#8ea292]"} />
                  <span>Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold font-['Manrope',sans-serif] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                    mode === "signup"
                      ? "bg-white text-[#073b4c] shadow-md shadow-[#073b4c]/10 border border-white"
                      : "text-[#657969] hover:text-[#073b4c]"
                  }`}
                >
                  <SparklesIcon className={mode === "signup" ? "text-[#006a39]" : "text-[#8ea292]"} />
                  <span>Create Account</span>
                </button>
              </div>

              {/* Header Title & Subtitle */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span 
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cfg.accent }} 
                  />
                  <span className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: cfg.accent }}>
                    {mode === "login" ? `Sign In as ${cfg.label}` : `New ${cfg.label} Registration`}
                  </span>
                </div>
                <h1 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-2xl sm:text-3xl tracking-tight">
                  {mode === "login" ? "Welcome back to SubhOne" : "Join the Healthcare Platform"}
                </h1>
                <p className="text-[#596b5e] text-xs sm:text-sm mt-1 leading-relaxed">
                  {mode === "login"
                    ? "Enter your verified credentials to access your secure portal"
                    : "Select your role below to configure your tailored dashboard access"}
                </p>
              </div>

              {/* ── ROLE SELECTOR CARDS ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[1px]">
                    Select Portal Role
                  </label>
                  {mode === "signup" && (
                    <span className="text-[10px] text-[#88998b] italic">
                      * Admin accounts are provisioned internally
                    </span>
                  )}
                </div>

                <div className={`grid gap-2.5 ${mode === "signup" ? "grid-cols-2" : "grid-cols-3"}`}>
                  {(mode === "signup" ? signupRoles : (["customer", "retailer", "admin"] as UserRole[])).map((role) => {
                    const r = ROLES[role];
                    const active = selectedRole === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRoleSelect(role)}
                        className={`group relative text-left p-3 sm:p-3.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                          active
                            ? "bg-white shadow-lg shadow-emerald-950/5 scale-[1.02]"
                            : "bg-white/60 hover:bg-white/90 border-[#e2ece0] hover:border-[#ccdccd]"
                        }`}
                        style={{
                          borderColor: active ? r.accent : undefined,
                          boxShadow: active ? `0 10px 25px -5px ${r.glow}` : undefined,
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div 
                            className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                            style={{ 
                              backgroundColor: active ? r.accent : r.lightBg,
                            }}
                          >
                            {role === "admin" && <ShieldIcon color={active ? "white" : r.accent} />}
                            {role === "retailer" && <StoreIcon color={active ? "white" : r.accent} />}
                            {role === "customer" && <PersonIcon color={active ? "white" : r.accent} />}
                          </div>

                          <span 
                            className="text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider"
                            style={{ 
                              backgroundColor: active ? r.accent : "#eef4ee",
                              color: active ? "white" : "#6c8070",
                            }}
                          >
                            {r.badge}
                          </span>
                        </div>

                        <div>
                          <p className="font-['Manrope',sans-serif] font-bold text-xs sm:text-sm text-[#073b4c]">
                            {r.label}
                          </p>
                          <p className="text-[10px] text-[#6c8070] leading-tight line-clamp-1 mt-0.5">
                            {r.desc}
                          </p>
                        </div>

                        {/* Active check bubble */}
                        {active && (
                          <div 
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white flex items-center justify-center shadow-md text-[10px] font-bold"
                            style={{ backgroundColor: r.accent }}
                          >
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── PENDING RETAILER APPROVAL NOTICE ── */}
              {pendingApprovalInfo && (
                <div className="bg-amber-50/90 backdrop-blur-md border border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-sm animate-in fade-in duration-200">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl shrink-0 shadow-xs">
                      ⏳
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-['Manrope',sans-serif] font-extrabold text-amber-900 text-sm sm:text-base">
                          {pendingApprovalInfo.status === "rejected" ? "Application Declined" : "Retailer Account Under Review"}
                        </h4>
                        <span className="text-[10px] bg-amber-200/80 text-amber-900 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {pendingApprovalInfo.status === "rejected" ? "Declined" : "Pending Verification"}
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 mt-1.5 leading-relaxed">
                        Wholesale access for <strong>{pendingApprovalInfo.shopName}</strong> ({pendingApprovalInfo.email}) is currently awaiting executive verification.
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t border-amber-200">
                        <button
                          type="button"
                          onClick={() => {
                            setStatusQuery(pendingApprovalInfo.email);
                            setShowStatusModal(true);
                            handleCheckStatus(undefined, pendingApprovalInfo.email);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <span>🔍</span>
                          <span>View Live Verification Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={clearPendingApproval}
                          className="px-3.5 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/50 text-xs font-bold transition-all cursor-pointer"
                        >
                          Switch Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Check Retailer Approval Status Banner */}
              {selectedRole === "retailer" && !pendingApprovalInfo && (
                <div className="bg-emerald-50/90 backdrop-blur-md border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center text-sm shrink-0">
                      🏪
                    </div>
                    <p className="text-xs text-emerald-900 font-medium truncate">
                      Applied as a Retailer? Check your real-time approval status.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusQuery(email || "");
                      setShowStatusModal(true);
                      if (email) handleCheckStatus(undefined, email);
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1"
                  >
                    <span>Check Status</span>
                    <span>→</span>
                  </button>
                </div>
              )}

              {/* Quick Admin Demo Credentials Banner */}
              {selectedRole === "admin" && (
                <div className="bg-gradient-to-r from-[#073b4c]/10 via-[#006a39]/10 to-[#073b4c]/10 border border-[#073b4c]/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#073b4c] text-white flex items-center justify-center text-sm shrink-0 font-extrabold shadow-xs">
                      🛡️
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-[#073b4c] leading-tight">
                        Executive Admin: <span className="font-mono text-emerald-800">subhonehealthgroup@gmail.com</span>
                      </p>
                      <p className="text-[11px] text-[#596b5e] font-semibold mt-0.5">
                        Password: <span className="font-mono text-[#073b4c]">Subhone@2026</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={async () => {
                        setEmail("subhonehealthgroup@gmail.com");
                        setPassword("Subhone@2026");
                        setError("");
                        setLoading(true);
                        const { error: authErr } = await signIn("subhonehealthgroup@gmail.com", "Subhone@2026", "admin");
                        setLoading(false);
                        if (authErr) setError(authErr);
                      }}
                      className="px-4 py-2 rounded-xl bg-[#006a39] hover:bg-[#005a30] text-white text-xs font-extrabold transition-all shadow-md cursor-pointer active:scale-95 flex items-center gap-1.5"
                    >
                      <span>⚡ Instant Admin Login</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── FORM: SIGN IN ── */}
              {mode === "login" && (
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8fa092] pointer-events-none">
                        <MailIcon />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        placeholder="e.g. yourname@domain.com"
                        required
                        className="w-full bg-white/70 backdrop-blur-md border border-[#dce7db] rounded-2xl pl-11 pr-4 py-3 text-sm text-[#073b4c] placeholder:text-[#a8b8aa] focus:outline-none focus:bg-white focus:border-[#006a39] focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px]">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setForgotEmail(email);
                          setForgotError("");
                          setForgotSuccess("");
                          setShowForgot(true);
                        }}
                        className="text-[11px] font-bold text-[#006a39] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8fa092] pointer-events-none">
                        <LockIcon />
                      </div>
                      <input
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        placeholder="Enter your secure password"
                        required
                        className="w-full bg-white/70 backdrop-blur-md border border-[#dce7db] rounded-2xl pl-11 pr-12 py-3 text-sm text-[#073b4c] placeholder:text-[#a8b8aa] focus:outline-none focus:bg-white focus:border-[#006a39] focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8fa092] hover:text-[#073b4c] p-1 rounded-lg transition-colors cursor-pointer"
                      >
                        {showPass ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center justify-between py-0.5">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded-md border-[#c9d9ca] text-[#006a39] focus:ring-[#006a39] accent-[#006a39] cursor-pointer transition-all"
                      />
                      <span className="text-xs text-[#596b5e] font-medium group-hover:text-[#073b4c] transition-colors">
                        Remember credentials on this browser
                      </span>
                    </label>
                  </div>

                  {error && <ErrorBox msg={error} />}
                  {success && <SuccessBox msg={success} />}

                  {/* Primary Login Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl font-['Manrope',sans-serif] font-bold text-sm sm:text-base text-white transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2.5 shadow-lg cursor-pointer"
                    style={{
                      background: cfg.gradient,
                      boxShadow: `0 12px 28px -6px ${cfg.glow}`,
                    }}
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Sign In as {cfg.label}</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ── FORM: SIGN UP ── */}
              {mode === "signup" && (
                <form onSubmit={handleSignup} className="flex flex-col gap-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">
                        Full Name *
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8fa092] pointer-events-none">
                          <UserIcon />
                        </div>
                        <input
                          type="text"
                          value={signupName}
                          onChange={(e) => { setSignupName(e.target.value); setError(""); }}
                          placeholder="Dr. / Mr. / Ms. Full Name"
                          required
                          className="w-full bg-white/70 backdrop-blur-md border border-[#dce7db] rounded-2xl pl-11 pr-4 py-2.5 text-sm text-[#073b4c] placeholder:text-[#a8b8aa] focus:outline-none focus:bg-white focus:border-[#006a39] focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">
                        Email Address *
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8fa092] pointer-events-none">
                          <MailIcon />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setError(""); }}
                          placeholder="you@domain.com"
                          required
                          className="w-full bg-white/70 backdrop-blur-md border border-[#dce7db] rounded-2xl pl-11 pr-4 py-2.5 text-sm text-[#073b4c] placeholder:text-[#a8b8aa] focus:outline-none focus:bg-white focus:border-[#006a39] focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8fa092] pointer-events-none">
                          <PhoneIcon />
                        </div>
                        <input
                          type="tel"
                          value={signupPhone}
                          onChange={(e) => setSignupPhone(e.target.value.replace(/[^0-9+]/g, ""))}
                          placeholder="9876543210 (10-digits)"
                          className="w-full bg-white/70 backdrop-blur-md border border-[#dce7db] rounded-2xl pl-11 pr-4 py-2.5 text-sm text-[#073b4c] placeholder:text-[#a8b8aa] focus:outline-none focus:bg-white focus:border-[#006a39] focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-xs"
                        />
                      </div>
                    </div>

                    {selectedRole === "retailer" && (
                      <div className="sm:col-span-2">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px]">
                            Pharmacy / Store Trade Name *
                          </label>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Required for Wholesale
                          </span>
                        </div>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8fa092] pointer-events-none">
                            <BuildingIcon />
                          </div>
                          <input
                            type="text"
                            value={signupShop}
                            onChange={(e) => { setSignupShop(e.target.value); setError(""); }}
                            placeholder="e.g. LifeCare Pharmacy & Surgical"
                            required
                            className="w-full bg-white/70 backdrop-blur-md border border-[#dce7db] rounded-2xl pl-11 pr-4 py-2.5 text-sm text-[#073b4c] placeholder:text-[#a8b8aa] focus:outline-none focus:bg-white focus:border-[#006a39] focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-xs"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">
                        Password *
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8fa092] pointer-events-none">
                          <LockIcon />
                        </div>
                        <input
                          type={showPass ? "text" : "password"}
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setError(""); }}
                          placeholder="Min. 6 chars"
                          required
                          className="w-full bg-white/70 backdrop-blur-md border border-[#dce7db] rounded-2xl pl-11 pr-10 py-2.5 text-sm text-[#073b4c] placeholder:text-[#a8b8aa] focus:outline-none focus:bg-white focus:border-[#006a39] focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8fa092] hover:text-[#073b4c] p-1 rounded transition-colors cursor-pointer"
                        >
                          {showPass ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8fa092] pointer-events-none">
                          <LockIcon />
                        </div>
                        <input
                          type="password"
                          value={signupConfirm}
                          onChange={(e) => { setSignupConfirm(e.target.value); setError(""); }}
                          placeholder="Repeat password"
                          required
                          className="w-full bg-white/70 backdrop-blur-md border border-[#dce7db] rounded-2xl pl-11 pr-4 py-2.5 text-sm text-[#073b4c] placeholder:text-[#a8b8aa] focus:outline-none focus:bg-white focus:border-[#006a39] focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {error && <ErrorBox msg={error} />}
                  {success && <SuccessBox msg={success} />}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-2xl font-['Manrope',sans-serif] font-bold text-sm sm:text-base text-white transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2.5 shadow-lg cursor-pointer mt-1"
                    style={{
                      background: cfg.gradient,
                      boxShadow: `0 12px 28px -6px ${cfg.glow}`,
                    }}
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Create {cfg.label} Account</span>
                        <span>→</span>
                      </>
                    )}
                  </button>

                  <p className="text-center text-[10px] text-[#869989] leading-normal mt-2">
                    By signing up, you agree to SubhOne&apos;s Terms of Service and Medical Data Privacy Policy.
                  </p>
                </form>
              )}

            </div>

            {/* Bottom Footer Note inside form card */}
            <div className="pt-6 mt-4 border-t border-[#e2ede1] flex items-center justify-between text-[11px] text-[#7a8d7e]">
              <span>© 2026 SubhOne Health Tech</span>
              <div className="flex items-center gap-3">
                <a href="#/home" className="hover:text-[#006a39] font-medium">Home</a>
                <span>•</span>
                <a href="#/medicines" className="hover:text-[#006a39] font-medium">Medicines</a>
                <span>•</span>
                <span className="font-semibold text-emerald-800">ISO-27001 Certified</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ── FORGOT PASSWORD MODAL (Frosted Glass Overlay) ── */}
      {showForgot && (
        <div 
          className="fixed inset-0 bg-[#07242e]/70 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" 
          onClick={() => setShowForgot(false)}
        >
          <div 
            className="bg-white/90 backdrop-blur-2xl border border-white/70 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-150" 
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowForgot(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f0f5f1] hover:bg-[#e2ede4] flex items-center justify-center text-[#073b4c] transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 shadow-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>

            <h3 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-xl sm:text-2xl">
              Reset Your Password
            </h3>
            <p className="text-[#596b5e] text-xs sm:text-sm mt-1 mb-5 leading-relaxed">
              Enter your registered email address and we will immediately send a secure recovery link.
            </p>

            <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px] block mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8fa092] pointer-events-none">
                    <MailIcon />
                  </div>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => { setForgotEmail(e.target.value); setForgotError(""); }}
                    placeholder="name@domain.com"
                    required
                    className="w-full bg-white/80 border border-[#dce7db] rounded-2xl pl-11 pr-4 py-3 text-sm text-[#073b4c] placeholder:text-[#a8b8aa] focus:outline-none focus:border-[#006a39] focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-xs"
                  />
                </div>
              </div>

              {forgotError && <ErrorBox msg={forgotError} />}
              {forgotSuccess && <SuccessBox msg={forgotSuccess} />}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="flex-1 py-3 rounded-2xl border border-[#dce7db] text-[#596b5e] font-bold text-xs sm:text-sm hover:bg-white/80 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#006a39] to-[#008749] text-white font-bold text-xs sm:text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-emerald-950/20 cursor-pointer"
                >
                  {forgotLoading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{forgotLoading ? "Sending..." : "Send Reset Link"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CHECK RETAILER APPROVAL STATUS MODAL (Frosted Glass Dialog) ── */}
      {showStatusModal && (
        <div
          className="fixed inset-0 bg-[#07242e]/70 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="bg-white/90 backdrop-blur-2xl border border-white/70 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowStatusModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f0f5f1] hover:bg-[#e2ede4] flex items-center justify-center text-[#073b4c] transition-colors cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                🏪
              </div>
              <div>
                <h3 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-lg sm:text-xl">
                  Retailer Live Status Lookup
                </h3>
                <p className="text-xs text-[#596b5e]">
                  Instant verification check for wholesale store partner applications
                </p>
              </div>
            </div>

            <form onSubmit={handleCheckStatus} className="flex flex-col gap-3">
              <label className="text-[10px] font-extrabold text-[#073b4c] uppercase tracking-[0.8px]">
                Registered Email or 10-Digit Phone
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={statusQuery}
                  onChange={(e) => setStatusQuery(e.target.value)}
                  placeholder="e.g. store@gmail.com or 9836000000"
                  required
                  className="flex-1 bg-white/80 border border-[#dce7db] rounded-2xl px-4 py-2.5 text-sm text-[#073b4c] placeholder:text-[#a8b8aa] focus:outline-none focus:border-[#006a39] focus:ring-4 focus:ring-emerald-500/10"
                />
                <button
                  type="submit"
                  disabled={statusLoading}
                  className="px-5 py-2.5 rounded-2xl bg-[#006a39] hover:bg-[#005a30] text-white text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-95 shrink-0"
                >
                  {statusLoading && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{statusLoading ? "Checking…" : "Lookup Live Status"}</span>
                </button>
              </div>
            </form>

            {/* Results Display */}
            {statusResult.searched && (
              <div className="mt-5 pt-4 border-t border-[#e2ece0] animate-in fade-in duration-200">
                {statusResult.found && statusResult.retailer ? (
                  <div className="flex flex-col gap-3.5">
                    {/* Status Banner */}
                    <div
                      className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                        statusResult.retailer.approvalStatus === "approved"
                          ? "bg-emerald-50/90 border-emerald-200"
                          : statusResult.retailer.approvalStatus === "pending"
                          ? "bg-amber-50/90 border-amber-200"
                          : "bg-red-50/90 border-red-200"
                      }`}
                    >
                      <div className="text-2xl shrink-0">
                        {statusResult.retailer.approvalStatus === "approved"
                          ? "🎉"
                          : statusResult.retailer.approvalStatus === "pending"
                          ? "⏳"
                          : "❌"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className={`font-['Manrope',sans-serif] font-bold text-sm ${
                              statusResult.retailer.approvalStatus === "approved"
                                ? "text-emerald-900"
                                : statusResult.retailer.approvalStatus === "pending"
                                ? "text-amber-900"
                                : "text-red-900"
                            }`}
                          >
                            {statusResult.retailer.approvalStatus === "approved"
                              ? "Wholesale Account Verified & Active!"
                              : statusResult.retailer.approvalStatus === "pending"
                              ? "Application In Review Queue"
                              : "Application Declined"}
                          </h4>
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              statusResult.retailer.approvalStatus === "approved"
                                ? "bg-emerald-200 text-emerald-900"
                                : statusResult.retailer.approvalStatus === "pending"
                                ? "bg-amber-200 text-amber-900 animate-pulse"
                                : "bg-red-200 text-red-900"
                            }`}
                          >
                            {statusResult.retailer.approvalStatus}
                          </span>
                        </div>

                        <p
                          className={`text-xs mt-1.5 leading-relaxed ${
                            statusResult.retailer.approvalStatus === "approved"
                              ? "text-emerald-800"
                              : statusResult.retailer.approvalStatus === "pending"
                              ? "text-amber-800"
                              : "text-red-800"
                          }`}
                        >
                          {statusResult.retailer.approvalStatus === "approved"
                            ? "Your retailer wholesale account has been verified by the SubhOne Admin. You can sign in now to access B2B wholesale prices."
                            : statusResult.retailer.approvalStatus === "pending"
                            ? "Your wholesale partner request is in the administrator verification queue. You will receive an update shortly."
                            : "Your retailer application was declined or suspended. Please contact admin@subhone.com for assistance."}
                        </p>
                      </div>
                    </div>

                    {/* Details Box */}
                    <div className="bg-[#f5f9f6] border border-[#dce8dc] rounded-2xl p-4 text-xs text-[#073b4c] flex flex-col gap-2">
                      <div className="flex justify-between">
                        <span className="text-[#728575]">Shop Name:</span>
                        <span className="font-bold">{statusResult.retailer.shopName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#728575]">Contact Person:</span>
                        <span className="font-semibold">{statusResult.retailer.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#728575]">Registered Email:</span>
                        <span className="font-mono text-emerald-800 font-bold">{statusResult.retailer.email}</span>
                      </div>
                      {statusResult.retailer.phone && (
                        <div className="flex justify-between">
                          <span className="text-[#728575]">Phone:</span>
                          <span className="font-mono">{statusResult.retailer.phone}</span>
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
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#006a39] to-[#008749] hover:opacity-95 text-white text-xs sm:text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <span>Sign In as Retailer Now →</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-5 bg-[#f5f9f6] rounded-2xl border border-[#dce8dc]">
                    <p className="text-xs font-bold text-[#073b4c]">No Retailer Application Found</p>
                    <p className="text-[11px] text-[#728575] mt-1">
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
                      className="mt-3 px-4 py-2 rounded-xl bg-[#006a39] text-white text-xs font-bold hover:bg-[#005a30] transition-colors cursor-pointer"
                    >
                      Sign Up as Retailer Now
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
