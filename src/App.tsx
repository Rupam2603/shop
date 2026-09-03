import { useState, useEffect, useRef } from "react";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import InsurancePage from "./pages/InsurancePage";
import VaccinesPage from "./pages/VaccinesPage";
import LabTestsPage from "./pages/LabTestsPage";
import MedicinesPage from "./pages/MedicinesPage";
import OffersPage from "./pages/OffersPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import ProfilePage from "./pages/ProfilePage";
import CartDrawer from "./components/CartDrawer";
import CheckoutModal from "./components/CheckoutModal";
import OrderTrackingModal from "./components/OrderTrackingModal";
import InfinityLoader from "./components/InfinityLoader";
import SupportChatbot from "./components/SupportChatbot";
import { useAuth, toLegacyUser } from "./contexts/AuthContext";
import { parseHashToState, pushPageState, replacePageState } from "./lib/navigation";
import { supabase } from "./lib/supabase";

export type Page = "home" | "medicines" | "category" | "insurance" | "vaccines" | "lab-tests" | "consult" | "offers" | "profile" | "checkout";
export type UserRole = "admin" | "retailer" | "customer";

export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface CurrentUser {
  id?: string;
  role: UserRole;
  email: string;
  name: string;
  phone?: string;
  profileImage?: string;
  shopName?: string;
  addresses?: Address[];
  joinedDate?: string;
}

function ConsultPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center bg-[#f5fbf2] px-4 sm:px-6">
      <div className="text-center flex flex-col items-center gap-4 w-full">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[rgba(0,134,73,0.15)] rounded-full flex items-center justify-center">
          <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8 sm:w-10 sm:h-10">
            <path d="M20 4C11.16 4 4 11.16 4 20C4 28.84 11.16 36 20 36C28.84 36 36 28.84 36 20C36 11.16 28.84 4 20 4ZM22 28H18V18H22V28ZM22 14H18V10H22V14Z" fill="#006A39" />
          </svg>
        </div>
        <h2 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-2xl sm:text-3xl lg:text-4xl px-2">Consult a Doctor</h2>
        <p className="text-[#3e4a3f] text-base sm:text-lg max-w-md leading-relaxed">
          Connect with certified healthcare professionals for expert advice and online consultations.
        </p>
        <button className="bg-[#006a39] text-white font-bold text-sm tracking-[0.7px] px-6 sm:px-8 py-3 rounded-lg hover:bg-[#005a30] transition-colors mt-2 w-full sm:w-auto max-w-xs">
          Book Consultation
        </button>
      </div>
    </div>
  );
}

/**
 * Loading screen shown while Auth checks for an existing session.
 */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5fbf2]">
      <InfinityLoader size={130} text="Loading SubhOne…" />
    </div>
  );
}

/**
 * Landing page for the "reset your password" email link
 * (`?token=...`, from `resetPassword()` in AuthContext). Better Auth's
 * password-reset confirmation isn't part of the Supabase-compatible API
 * surface, so it's called via the adapter's `getBetterAuthInstance()`
 * escape hatch.
 */
function ResetPasswordScreen({ token }: { token: string }) {
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) return setError("Password must be at least 6 characters.");
    if (newPass !== confirmPass) return setError("Passwords don't match.");

    setStatus("saving");
    setError("");
    try {
      const betterAuth = (supabase.auth as any).getBetterAuthInstance?.();
      if (!betterAuth) throw new Error("Password reset isn't available right now.");
      const { error: resetError } = await betterAuth.resetPassword({ newPassword: newPass, token });
      if (resetError) throw new Error(resetError.message || "Failed to reset password.");
      setStatus("done");
    } catch (err: any) {
      setStatus("error");
      setError(err?.message || "Failed to reset password. The link may have expired — request a new one.");
    }
  };

  if (status === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5fbf2] px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <p className="text-[#073b4c] font-bold text-lg mb-2">Password updated</p>
          <p className="text-sm text-gray-600 mb-4">You can now sign in with your new password.</p>
          <a href="/" className="inline-block bg-[#006a39] text-white font-bold text-sm px-6 py-3 rounded-lg">
            Go to Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5fbf2] px-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
        <p className="text-[#073b4c] font-bold text-lg mb-1">Set a new password</p>
        <p className="text-sm text-gray-600 mb-4">Enter a new password for your account.</p>
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <input
          type="password"
          placeholder="New password"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-3 text-sm"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 mb-4 text-sm"
        />
        <button
          type="submit"
          disabled={status === "saving"}
          className="w-full bg-[#006a39] text-white font-bold text-sm px-6 py-3 rounded-lg disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : "Set New Password"}
        </button>
      </form>
    </div>
  );
}

export default function App() {
  const resetToken = new URLSearchParams(window.location.search).get("token");
  const { appUser, loading, signOut, updateProfile } = useAuth();
  const [activePage, setActivePage] = useState<Page>(() => parseHashToState().page);
  const [initialCategory, setInitialCategory] = useState<string>(() => parseHashToState().category);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [trackingModal, setTrackingModal] = useState<{ open: boolean; orderNumber: string | null }>({
    open: false,
    orderNumber: null,
  });

  useEffect(() => {
    const current = parseHashToState();
    replacePageState(current.page, current.category);

    const handlePopState = (e: PopStateEvent) => {
      if (e.state?.modal) return;
      const { page, category } = parseHashToState();
      setActivePage(page);
      setInitialCategory(category);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const prevUserRef = useRef(appUser);

  useEffect(() => {
    // When transitioning from not logged in to logged in, always open the Home page
    if (!prevUserRef.current && appUser) {
      if (appUser.profile?.role !== "admin") {
        setActivePage("home");
        replacePageState("home", "All");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
    prevUserRef.current = appUser;
  }, [appUser]);

  const navigateTo = (page: Page, category = "All") => {
    pushPageState(page, category);
    setInitialCategory(category);
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openTracking = (orderNumber?: string) => {
    setTrackingModal({ open: true, orderNumber: orderNumber || null });
  };

  // ── Password reset link landing page (works regardless of auth state) ────
  if (resetToken) return <ResetPasswordScreen token={resetToken} />;

  // ── Show spinner while resolving the session (max 1s due to timeout in AuthContext) ──
  if (loading) return <LoadingScreen />;

  // ── Not logged in → show Login page ──────────────────────────────────────
  if (!appUser) return <LoginPage />;

  // ── Convert profile to the shape existing components expect ───────────────
  const currentUser: CurrentUser = toLegacyUser(appUser);

  // ── Admin → redirect to admin dashboard ──────────────────────────────────
  if (currentUser.role === "admin") {
    return (
      <AdminDashboard
        user={currentUser}
        onLogout={signOut}
      />
    );
  }

  // ── Handle profile updates from ProfilePage ───────────────────────────────
  const handleUpdateUser = async (updates: Partial<CurrentUser>) => {
    await updateProfile({
      full_name: updates.name,
      phone: updates.phone ?? null,
      shop_name: updates.shopName ?? null,
      avatar_url: updates.profileImage ?? null,
    });
  };

  const renderPage = () => {
    switch (activePage) {
      case "home": return <HomePage onNavigate={navigateTo} userRole={currentUser.role} />;
      case "insurance": return <InsurancePage userRole={currentUser.role} onNavigate={navigateTo} />;
      case "vaccines": return <VaccinesPage userRole={currentUser.role} onNavigate={navigateTo} />;
      case "lab-tests": return <LabTestsPage user={currentUser} onNavigate={navigateTo} />;
      case "category": return <CategoryPage categoryId={initialCategory || "all"} userRole={currentUser.role} onNavigate={navigateTo} />;
      case "checkout":
      case "medicines": return <MedicinesPage initialCategory={initialCategory} userRole={currentUser.role} onNavigate={navigateTo} />;
      case "offers": return <OffersPage userRole={currentUser.role} onNavigate={navigateTo} />;
      case "consult": return <ConsultPage />;
      case "profile": return (
        <ProfilePage
          user={currentUser}
          onUpdateUser={handleUpdateUser}
          onNavigate={navigateTo}
          onTrackOrder={openTracking}
        />
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5fbf2]">
      <NavBar
        activePage={activePage}
        onNavigate={(p) => navigateTo(p)}
        user={currentUser}
        onLogout={signOut}
        onProfile={() => navigateTo("profile")}
        onTrackOrder={openTracking}
      />
      <main className="flex-1">{renderPage()}</main>
      <Footer />

      {/* Cart Drawer */}
      <CartDrawer
        onCheckout={() => setCheckoutOpen(true)}
        onBrowse={() => navigateTo("medicines")}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        open={checkoutOpen || activePage === "checkout"}
        onClose={() => {
          setCheckoutOpen(false);
          if (activePage === "checkout") {
            navigateTo("medicines");
          }
        }}
        onOrderSuccess={(_orderId, orderNum) => {
          setCheckoutOpen(false);
          if (orderNum) {
            openTracking(orderNum);
          } else {
            navigateTo("profile");
          }
        }}
        user={{
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone,
          role: currentUser.role,
          shopName: currentUser.shopName,
        }}
      />

      {/* Real-Time Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={trackingModal.open}
        onClose={() => setTrackingModal({ open: false, orderNumber: null })}
        initialOrderNumber={trackingModal.orderNumber}
        userRole={currentUser.role}
        userPhone={currentUser.phone}
        userName={currentUser.name}
      />

      {/* 24/7 Live Customer Support Chatbot */}
      <SupportChatbot onTrackOrder={() => openTracking()} />
    </div>
  );
}
