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
    accent: "#2563eb",
    gradient: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  },
  admin: {
    label: "Admin / Staff",
    badge: "Operations & Logistics",
    accent: "#073b4c",
    gradient: "linear-gradient(135deg, #073b4c 0%, #1e3a8a 100%)",
  },
};

// ─── Modern Luxury Icons ──────────────────────────────────────────────────────

function MailIcon({ className }: { className?: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" />
      <path d="M16 10h.01" /><path d="M8 14h.01" /><path d="M16 14h.01" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function PillIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-5.65a1 1 0 0 0-.29-.71l-3.35-3.35A1 1 0 0 0 17.65 7H14v11" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  );
}



// ─── Floating Medical Cross Background Accent ─────────────────────────────────

function MedicalCross({ className, size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`pointer-events-none ${className || ""}`}
    >
      <path d="M19 10.5h-5.5V5a1.5 1.5 0 0 0-3 0v5.5H5a1.5 1.5 0 0 0 0 3h5.5V19a1.5 1.5 0 0 0 3 0v-5.5H19a1.5 1.5 0 0 0 0-3z" />
    </svg>
  );
}

// ─── Simple Alert Boxes ───────────────────────────────────────────────────────

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="bg-red-50/90 border border-red-200/90 rounded-2xl p-3.5 flex items-start gap-2.5 text-left animate-in fade-in duration-150 shadow-xs">
      <span className="text-red-600 font-black text-sm leading-none mt-0.5">!</span>
      <p className="text-red-700 text-xs leading-relaxed flex-1 break-words font-medium">{msg}</p>
    </div>
  );
}

function SuccessBox({ msg }: { msg: string }) {
  return (
    <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-3.5 flex items-start gap-2.5 text-left animate-in fade-in duration-150 shadow-xs">
      <span className="text-emerald-600 font-black text-sm leading-none mt-0.5">✓</span>
      <p className="text-emerald-800 text-xs leading-relaxed flex-1 break-words font-medium">{msg}</p>
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
        if (savedRole && (savedRole === "admin" || savedRole === "retailer" || savedRole === "delivery_partner")) {
          setSelectedRole(savedRole === "delivery_partner" ? "admin" : savedRole);
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
    const expectedRoleToPass = selectedRole === "admin" ? "staff" : selectedRole;
    const { error: authError } = await signIn(email.trim(), password, expectedRoleToPass);
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

  const roleList: UserRole[] = mode === "signup" ? ["retailer"] : ["retailer", "admin"];

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-[#dbeafe] via-[#eff6ff] to-[#e0f2fe] flex items-center justify-center p-3 sm:p-6 lg:p-10 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* ── Ambient Background Glow & Floating Medical Cross Elements ── */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/4 w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />

      <MedicalCross size={48} className="absolute top-12 left-1/4 text-blue-300/40 animate-pulse hidden md:block" />
      <MedicalCross size={64} className="absolute top-1/2 left-8 text-blue-300/35 hidden lg:block" />
      <MedicalCross size={40} className="absolute bottom-24 right-1/3 text-blue-400/30 hidden md:block" />
      <MedicalCross size={72} className="absolute top-20 right-12 text-blue-300/25 hidden lg:block" />

      {/* Decorative Botanical Leaf Accent (Bottom-Left) */}
      <div className="absolute bottom-0 left-0 w-44 sm:w-64 h-44 sm:h-64 pointer-events-none opacity-40 lg:opacity-60">
        <svg viewBox="0 0 200 200" fill="none" className="w-full h-full text-teal-600/30">
          <path d="M10 190C15 130 50 80 110 50C100 90 85 140 10 190Z" fill="currentColor" />
          <path d="M30 195C55 150 90 120 150 100C130 140 100 170 30 195Z" fill="currentColor" opacity="0.7" />
          <path d="M10 170C40 120 70 80 130 70C110 100 80 140 10 170Z" fill="currentColor" opacity="0.5" />
        </svg>
      </div>

      {/* ── Main Canvas Wrapper ── */}
      <div className="w-full max-w-[1240px] relative z-10 flex flex-col gap-4 sm:gap-6 my-auto">
        
        {/* Top Navigation Row */}
        {onBackToStore && (
          <div className="w-full flex items-center justify-between px-2 sm:px-4">
            <button
              type="button"
              onClick={onBackToStore}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#1d4ed8] hover:text-[#1e40af] bg-white/70 hover:bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-white/80 shadow-xs transition-all cursor-pointer group"
            >
              <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
              <span>Back to Store</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span className="text-[11px] sm:text-xs font-bold text-slate-600 tracking-wide">
                Verified Health Platform
              </span>
            </div>
          </div>
        )}

        {/* ── Split Screen Card Container ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ════════ LEFT COLUMN: Brand Hero & Value Proposition ════════ */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-between h-full px-2 sm:px-6 lg:px-4">
            
            {/* Top Brand Logo - PRESERVED EXISTING LOGO */}
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <img
                src="/logo.png"
                alt="SubhOne Health Group"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-contain bg-white shadow-md p-1.5 border border-white/80 shrink-0"
              />
              <div className="flex flex-col text-left">
                <span className="font-['Manrope',sans-serif] font-black text-[#0f172a] text-xl sm:text-2xl tracking-tight leading-tight">
                  SubhOne
                </span>
                <span className="font-['Manrope',sans-serif] font-bold text-[#e11d48] text-base sm:text-lg tracking-tight leading-none">
                  Health Group
                </span>
                <span className="text-[9px] sm:text-[10px] font-extrabold text-[#0284c7] tracking-[2px] uppercase mt-1">
                  Pharmacy & Diagnostic
                </span>
              </div>
            </div>

            {/* Welcome Pill Badge */}
            <div className="mb-4">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-blue-200/70 text-[#2563eb] text-xs font-black shadow-2xs">
                <ShieldCheckIcon className="text-[#2563eb]" />
                <span>{mode === "login" ? "Welcome Back" : "Fast & Secure Registration"}</span>
              </span>
            </div>

            {/* Luxury Hero Headline */}
            <div className="mb-4 sm:mb-6">
              <h1 className="font-['Plus_Jakarta_Sans',sans-serif] font-black text-3xl sm:text-4xl md:text-5xl lg:text-[52px] text-[#0f172a] leading-[1.1] tracking-tight">
                Your Health <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563eb] via-[#1d4ed8] to-[#0284c7]">
                  Our Priority
                </span>
              </h1>
              <p className="text-slate-600 text-sm sm:text-base font-medium mt-3 sm:mt-4 max-w-lg leading-relaxed">
                {mode === "login"
                  ? "Log in to access your account and continue your health journey with verified genuine medicines."
                  : "Join SubhOne Health Group to unlock wholesale medicine rates, direct distributor billing, and fast dispatch."}
              </p>
            </div>

            {/* 3 Luxury Value Bullets */}
            <div className="flex flex-col gap-3.5 sm:gap-4 mb-8">
              {/* Bullet 1 */}
              <div className="flex items-center gap-3.5 group">
                <div className="w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md border border-blue-200/60 shadow-xs flex items-center justify-center text-[#2563eb] group-hover:scale-105 group-hover:shadow-md transition-all shrink-0">
                  <PillIcon />
                </div>
                <div className="flex flex-col">
                  <span className="font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-sm sm:text-base text-[#0f172a]">
                    Wide Range
                  </span>
                  <span className="text-xs sm:text-sm text-slate-500 font-medium">
                    of Health Products & Certified Brands
                  </span>
                </div>
              </div>

              {/* Bullet 2 */}
              <div className="flex items-center gap-3.5 group">
                <div className="w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md border border-blue-200/60 shadow-xs flex items-center justify-center text-[#2563eb] group-hover:scale-105 group-hover:shadow-md transition-all shrink-0">
                  <ShieldCheckIcon />
                </div>
                <div className="flex flex-col">
                  <span className="font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-sm sm:text-base text-[#0f172a]">
                    Trusted
                  </span>
                  <span className="text-xs sm:text-sm text-slate-500 font-medium">
                    Quality, Lab Certified & 100% Genuine Care
                  </span>
                </div>
              </div>

              {/* Bullet 3 */}
              <div className="flex items-center gap-3.5 group">
                <div className="w-11 h-11 rounded-2xl bg-white/90 backdrop-blur-md border border-blue-200/60 shadow-xs flex items-center justify-center text-[#2563eb] group-hover:scale-105 group-hover:shadow-md transition-all shrink-0">
                  <TruckIcon />
                </div>
                <div className="flex flex-col">
                  <span className="font-['Plus_Jakarta_Sans',sans-serif] font-extrabold text-sm sm:text-base text-[#0f172a]">
                    Fast & Reliable
                  </span>
                  <span className="text-xs sm:text-sm text-slate-500 font-medium">
                    Doorstep Express Delivery Across Pin Codes
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Partner Hero Visual Illustration */}
            <div className="relative rounded-3xl overflow-hidden shadow-xl shadow-blue-900/10 border border-white/80 max-w-[420px] bg-gradient-to-t from-white via-white/80 to-transparent p-2 group">
              <img
                src="/delivery-hero.jpg"
                alt="SubhOne Delivery Executive"
                className="w-full h-48 sm:h-56 object-cover object-top rounded-2xl group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-[#0f172a]">SubhOne Express Fleet</p>
                  <p className="text-[11px] text-slate-500 font-medium">Safe cold-chain & tamper-proof medicine boxes</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#2563eb] text-[10px] font-black uppercase">
                  Active
                </span>
              </div>
            </div>

          </div>

          {/* ════════ RIGHT COLUMN: Luxury Glassmorphic Form Card ════════ */}
          <div className="lg:col-span-6 xl:col-span-6 flex justify-center w-full">
            <div className="w-full max-w-[490px] bg-white/95 backdrop-blur-2xl border border-white/90 rounded-[32px] sm:rounded-[38px] shadow-2xl shadow-blue-950/10 p-6 sm:p-10 flex flex-col gap-5 relative transition-all">
              
              {/* Card Top Brand Header - PRESERVED EXISTING LOGO */}
              <div className="text-center flex flex-col items-center">
                <img
                  src="/logo.png"
                  alt="SubhOne Health Group"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-contain bg-white shadow-md p-1.5 border border-slate-100 mb-2.5"
                />
                <div className="flex flex-col items-center leading-none">
                  <span className="font-['Manrope',sans-serif] font-black text-[#0f172a] text-lg sm:text-xl">
                    SubhOne
                  </span>
                  <span className="font-['Manrope',sans-serif] font-bold text-[#e11d48] text-sm sm:text-base">
                    Health Group
                  </span>
                  <span className="text-[9px] font-extrabold text-[#0284c7] tracking-[2px] uppercase mt-1">
                    Pharmacy & Diagnostic
                  </span>
                </div>
              </div>

              {/* Form Headline */}
              <div className="text-center mt-1">
                <h2 className="font-['Plus_Jakarta_Sans',sans-serif] font-black text-2xl sm:text-[28px] text-[#0f172a] tracking-tight">
                  {mode === "login" ? "Login to Your Account" : "Create an Account"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  {mode === "login"
                    ? "Welcome back! Please enter your details."
                    : "Please enter your details to set up your account."}
                </p>
              </div>

              {/* Segmented Sign In / Sign Up Mode Switcher */}
              <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-100/80 border border-slate-200/70 text-xs font-extrabold">
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className={`py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    mode === "login"
                      ? "bg-white text-[#0f172a] shadow-sm font-black"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className={`py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                    mode === "signup"
                      ? "bg-white text-[#0f172a] shadow-sm font-black"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {/* Account Type Selector (Retailer vs Admin) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  <span>Select Portal</span>
                  <span className="text-[#2563eb] font-extrabold">{ROLES[selectedRole]?.label}</span>
                </div>

                <div className={`grid gap-1.5 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/70 ${roleList.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
                  {roleList.map((r) => {
                    const active = selectedRole === r;
                    const roleInfo = ROLES[r] || ROLES["retailer"];
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => { setSelectedRole(r); setError(""); setSuccess(""); }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center cursor-pointer ${
                          active
                            ? "bg-white text-[#0f172a] shadow-sm font-black border border-white"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        <span>{roleInfo.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pending Retailer Notice (if any) */}
              {pendingApprovalInfo && (
                <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 flex flex-col gap-2 shadow-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span>Retailer Application In Review</span>
                    <span className="text-[10px] uppercase bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-extrabold">
                      Pending
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-normal">
                    Wholesale account for <strong>{pendingApprovalInfo.shopName}</strong> ({pendingApprovalInfo.email}) is currently being reviewed.
                  </p>
                  <div className="flex items-center gap-2 pt-2 border-t border-amber-200/80">
                    <button
                      type="button"
                      onClick={() => {
                        setStatusQuery(pendingApprovalInfo.email);
                        setShowStatusModal(true);
                        handleCheckStatus(undefined, pendingApprovalInfo.email);
                      }}
                      className="text-[11px] font-extrabold text-blue-700 hover:underline"
                    >
                      View Status Details →
                    </button>
                    <button
                      type="button"
                      onClick={clearPendingApproval}
                      className="text-[11px] text-slate-500 hover:underline ml-auto"
                    >
                      Switch Account
                    </button>
                  </div>
                </div>
              )}

              {/* ── Sign In Form ── */}
              {mode === "login" && (
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  {/* Email */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1.5">
                      Email Address *
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <MailIcon />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        autoComplete="email"
                        required
                        className="w-full bg-[#f8fafc] border border-slate-200/90 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/15 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1.5">
                      Password *
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <LockIcon />
                      </div>
                      <input
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                        className="w-full bg-[#f8fafc] border border-slate-200/90 rounded-2xl pl-11 pr-11 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/15 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                        tabIndex={-1}
                        aria-label={showPass ? "Hide password" : "Show password"}
                      >
                        {showPass ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password Row */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-[#2563eb] focus:ring-blue-500 cursor-pointer accent-[#2563eb]"
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
                      className="font-bold text-[#2563eb] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {error && <ErrorBox msg={error} />}
                  {success && <SuccessBox msg={success} />}

                  {/* Primary CTA Button: Login -> */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Login</span>
                        <span className="text-base font-bold">→</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ── Sign Up Form ── */}
              {mode === "signup" && (
                <form onSubmit={handleSignup} className="flex flex-col gap-3.5">
                  {/* Full Name */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <UserIcon />
                      </div>
                      <input
                        type="text"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="w-full bg-[#f8fafc] border border-slate-200/90 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/15 transition-all"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <MailIcon />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        required
                        className="w-full bg-[#f8fafc] border border-slate-200/90 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/15 transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Phone Number (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <PhoneIcon />
                      </div>
                      <input
                        type="tel"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value.replace(/[^0-9+]/g, ""))}
                        placeholder="+91 98765 43210"
                        className="w-full bg-[#f8fafc] border border-slate-200/90 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/15 transition-all"
                      />
                    </div>
                  </div>

                  {/* Shop / Pharmacy Name */}
                  <div>
                    <label className="text-xs font-bold text-slate-800 block mb-1">
                      Shop / Pharmacy Name *
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <BuildingIcon />
                      </div>
                      <input
                        type="text"
                        value={signupShop}
                        onChange={(e) => setSignupShop(e.target.value)}
                        placeholder="e.g. Apollo Chemist, LifeCare Pharmacy"
                        required
                        className="w-full bg-[#f8fafc] border border-slate-200/90 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/15 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Password *
                      </label>
                      <input
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 6 chars"
                        required
                        className="w-full bg-[#f8fafc] border border-slate-200/90 rounded-2xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/15 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Confirm Password *
                      </label>
                      <input
                        type={showPass ? "text" : "password"}
                        value={signupConfirm}
                        onChange={(e) => setSignupConfirm(e.target.value)}
                        placeholder="Confirm"
                        required
                        className="w-full bg-[#f8fafc] border border-slate-200/90 rounded-2xl px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/15 transition-all"
                      />
                    </div>
                  </div>

                  {error && <ErrorBox msg={error} />}
                  {success && <SuccessBox msg={success} />}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-60"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Create Account</span>
                        <span className="text-base font-bold">→</span>
                      </>
                    )}
                  </button>
                </form>
              )}



              {/* ── Switch Mode Link: Don't have an account? Create Account ── */}
              <div className="text-center text-xs text-slate-600 pt-1">
                {mode === "login" ? (
                  <p>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("signup")}
                      className="font-black text-[#2563eb] hover:underline cursor-pointer"
                    >
                      Create Account
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className="font-black text-[#2563eb] hover:underline cursor-pointer"
                    >
                      Sign In
                    </button>
                  </p>
                )}
              </div>

              {/* ── Retailer Status Link ── */}
              {selectedRole === "retailer" && (
                <div className="pt-2 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStatusQuery(email || "");
                      setShowStatusModal(true);
                      if (email) handleCheckStatus(undefined, email);
                    }}
                    className="text-xs font-bold text-[#0284c7] hover:underline cursor-pointer"
                  >
                    Applied as Retailer? Check your verification status →
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* ── Forgot Password Modal (Matching Luxury Glassmorphism) ── */}
      {showForgot && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowForgot(false)}
        >
          <div
            className="bg-white/95 backdrop-blur-2xl border border-white/90 rounded-[32px] w-full max-w-sm p-6 sm:p-7 shadow-2xl relative animate-in zoom-in-95 duration-150 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-black text-lg text-slate-900">
                Reset Password
              </h3>
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs text-slate-700 cursor-pointer transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Enter your registered email address and we will send you a password reset link.
            </p>

            <form onSubmit={handleForgotSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-[#f8fafc] border border-slate-200/90 rounded-2xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/15"
              />

              {forgotError && <ErrorBox msg={forgotError} />}
              {forgotSuccess && <SuccessBox msg={forgotSuccess} />}

              <div className="flex gap-2.5 mt-1">
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white text-xs font-bold hover:opacity-95 transition-all disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/25"
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
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setShowStatusModal(false)}
        >
          <div
            className="bg-white/95 backdrop-blur-2xl border border-white/90 rounded-[32px] w-full max-w-md p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 duration-150 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-black text-lg text-slate-900">
                Retailer Application Status
              </h3>
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs text-slate-700 cursor-pointer transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCheckStatus} className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-800">
                Registered Email or Phone Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={statusQuery}
                  onChange={(e) => setStatusQuery(e.target.value)}
                  placeholder="email@example.com or 9876543210"
                  required
                  className="flex-1 bg-[#f8fafc] border border-slate-200/90 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/15"
                />
                <button
                  type="submit"
                  disabled={statusLoading}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white text-xs font-bold transition-all disabled:opacity-60 flex items-center gap-1.5 cursor-pointer shrink-0 shadow-md shadow-blue-600/25"
                >
                  {statusLoading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{statusLoading ? "Checking..." : "Check"}</span>
                </button>
              </div>
            </form>

            {/* Results */}
            {statusResult.searched && (
              <div className="pt-3 border-t border-slate-100 animate-in fade-in duration-150">
                {statusResult.found && statusResult.retailer ? (
                  <div className="flex flex-col gap-3">
                    <div
                      className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-bold ${
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
                      <span className="uppercase text-[10px] px-2 py-0.5 rounded-full bg-white/80 font-black">
                        {statusResult.retailer.approvalStatus}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs flex flex-col gap-1.5 text-slate-600">
                      <div className="flex justify-between">
                        <span>Shop:</span>
                        <strong className="text-slate-900">{statusResult.retailer.shopName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Contact:</span>
                        <span className="text-slate-900">{statusResult.retailer.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Email:</span>
                        <span className="font-mono text-blue-700">{statusResult.retailer.email}</span>
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
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white text-xs font-black shadow-md shadow-blue-600/25 transition-all cursor-pointer"
                      >
                        Sign In as Retailer Now →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                    <p className="font-bold text-slate-800">No Application Found</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">
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
