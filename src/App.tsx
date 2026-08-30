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
import { useAuth, toLegacyUser } from "./contexts/AuthContext";
import { parseHashToState, pushPageState, replacePageState } from "./lib/navigation";

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
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-[#006a39] border-t-transparent animate-spin" />
        <p className="text-[#073b4c] font-semibold text-sm">Loading SubhOne…</p>
      </div>
    </div>
  );
}

export default function App() {
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
    // When transitioning from not logged in (null/undefined) to logged in, always open the Home page
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

  // ── Instant non-blocking rendering (fallback to customer/guest while session hydrates) ──
  const currentUser: CurrentUser | null = appUser ? toLegacyUser(appUser) : null;

  // ── Admin → redirect to admin dashboard ──────────────────────────────────
  if (currentUser?.role === "admin") {
    return (
      <AdminDashboard
        user={currentUser}
        onLogout={signOut}
      />
    );
  }

  // ── Non-logged in users accessing profile or explicit login ────────────────
  if (!appUser && activePage === "profile") {
    return <LoginPage onBackToStore={() => setActivePage("home")} />;
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

  const userRole = currentUser?.role || "customer";

  const renderPage = () => {
    switch (activePage) {
      case "home": return <HomePage onNavigate={navigateTo} userRole={userRole} />;
      case "insurance": return <InsurancePage userRole={userRole} onNavigate={navigateTo} />;
      case "vaccines": return <VaccinesPage userRole={userRole} onNavigate={navigateTo} />;
      case "lab-tests": return <LabTestsPage user={currentUser || { id: "guest", role: "customer", email: "", name: "Guest User" }} onNavigate={navigateTo} />;
      case "category": return <CategoryPage categoryId={initialCategory || "all"} userRole={userRole} onNavigate={navigateTo} />;
      case "checkout":
      case "medicines": return <MedicinesPage initialCategory={initialCategory} userRole={userRole} onNavigate={navigateTo} />;
      case "offers": return <OffersPage userRole={userRole} onNavigate={navigateTo} />;
      case "consult": return <ConsultPage />;
      case "profile":
        if (!currentUser) return <LoginPage onBackToStore={() => setActivePage("home")} />;
        return (
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
        onProfile={() => {
          if (!currentUser) {
            setActivePage("profile");
          } else {
            navigateTo("profile");
          }
        }}
        onTrackOrder={openTracking}
      />
      <main className="flex-1">{renderPage()}</main>
      <Footer />

      {/* Cart Drawer */}
      <CartDrawer
        onCheckout={() => {
          if (!currentUser) {
            setActivePage("profile");
          } else {
            setCheckoutOpen(true);
          }
        }}
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
    </div>
  );
}
