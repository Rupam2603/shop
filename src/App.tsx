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
    <div className="min-h-[60vh] flex items-center justify-center bg-[#f5fbf2]">
      <div className="text-center flex flex-col items-center gap-4">
        <div className="w-20 h-20 bg-[rgba(0,134,73,0.15)] rounded-full flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M20 4C11.16 4 4 11.16 4 20C4 28.84 11.16 36 20 36C28.84 36 36 28.84 36 20C36 11.16 28.84 4 20 4ZM22 28H18V18H22V28ZM22 14H18V10H22V14Z" fill="#006A39" />
          </svg>
        </div>
        <h2 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-3xl">Consult a Doctor</h2>
        <p className="text-[#3e4a3f] text-lg max-w-md">
          Connect with certified healthcare professionals for expert advice and online consultations.
        </p>
        <button className="bg-[#006a39] text-white font-bold text-sm tracking-[0.7px] px-8 py-3 rounded-lg hover:bg-[#005a30] transition-colors mt-2">
          Book Consultation
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState<Page>("home");
  const [initialCategory, setInitialCategory] = useState<string>("All");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const handleLogin = (user: CurrentUser) => setCurrentUser(user);
  const handleLogout = () => setCurrentUser(null);
  const handleUpdateUser = (updates: Partial<CurrentUser>) =>
    setCurrentUser((prev) => (prev ? { ...prev, ...updates } : null));

  const navigateTo = (page: Page, category = "All") => {
    setInitialCategory(category);
    setActivePage(page);
  };

  if (!currentUser) return <LoginPage onLogin={handleLogin} />;
  if (currentUser.role === "admin") return <AdminDashboard user={currentUser} onLogout={handleLogout} />;

  const renderPage = () => {
    switch (activePage) {
      case "home":      return <HomePage onNavigate={navigateTo} userRole={currentUser.role} />;
      case "lab-tests": return <LabTestsPage />;
      case "medicines": return <MedicinesPage initialCategory={initialCategory} userRole={currentUser.role} />;
      case "offers":    return <OffersPage />;
      case "consult":   return <ConsultPage />;
      case "profile":   return <ProfilePage user={currentUser} onUpdateUser={handleUpdateUser} onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5fbf2]">
      <NavBar activePage={activePage} onNavigate={(p) => navigateTo(p)} user={currentUser} onLogout={handleLogout} onProfile={() => navigateTo("profile")} />
      <main className="flex-1">{renderPage()}</main>
      <Footer />
    </div>
  );
}
