import { useState } from "react";
import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import LabTestsPage from "./pages/LabTestsPage";
import MedicinesPage from "./pages/MedicinesPage";
import OffersPage from "./pages/OffersPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import ProfilePage from "./pages/ProfilePage";
import CartDrawer from "./components/CartDrawer";
import CheckoutModal from "./components/CheckoutModal";
import { useAuth, toLegacyUser } from "./contexts/AuthContext";

export type Page = "home" | "medicines" | "lab-tests" | "consult" | "offers" | "profile";
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
 * Loading screen shown while Supabase checks for an existing session.
 * This prevents the login page from flashing before auth state is resolved.
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
  const [activePage, setActivePage] = useState<Page>("home");
  const [initialCategory, setInitialCategory] = useState<string>("All");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const navigateTo = (page: Page, category = "All") => {
    setInitialCategory(category);
    setActivePage(page);
  };

  // ── Show spinner while Supabase resolves the session ──────────────────────
  if (loading || appUser === undefined) return <LoadingScreen />;

  // ── Not logged in → show Login page ──────────────────────────────────────
  if (!appUser) return <LoginPage />;

  // ── Convert Supabase profile to the shape existing components expect ──────
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
      case "home":      return <HomePage onNavigate={navigateTo} userRole={currentUser.role} />;
      case "lab-tests": return <LabTestsPage user={currentUser} />;
      case "medicines": return <MedicinesPage initialCategory={initialCategory} userRole={currentUser.role} />;
      case "offers":    return <OffersPage />;
      case "consult":   return <ConsultPage />;
      case "profile":   return (
        <ProfilePage
          user={currentUser}
          onUpdateUser={handleUpdateUser}
          onNavigate={navigateTo}
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
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onOrderSuccess={() => {
          navigateTo("profile");
        }}
        user={{
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone,
        }}
      />
    </div>
  );
}
