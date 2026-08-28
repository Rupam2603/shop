import { useState } from "react";

type Page = "home" | "medicines" | "lab-tests" | "consult" | "offers" | "profile";

interface NavBarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  user?: { role: string; name: string; email: string } | null;
  onLogout?: () => void;
  onProfile?: () => void;
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M16.5 16.5L12.875 12.875M14.8333 8.16667C14.8333 11.8486 11.8486 14.8333 8.16667 14.8333C4.48477 14.8333 1.5 11.8486 1.5 8.16667C1.5 4.48477 4.48477 1.5 8.16667 1.5C11.8486 1.5 14.8333 4.48477 14.8333 8.16667Z"
        stroke="#073B4C"
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
      <path
        d="M7 0C3.13 0 0 3.13 0 7C0 12.25 7 18 7 18C7 18 14 12.25 14 7C14 3.13 10.87 0 7 0ZM7 9.5C5.62 9.5 4.5 8.38 4.5 7C4.5 5.62 5.62 4.5 7 4.5C8.38 4.5 9.5 5.62 9.5 7C9.5 8.38 8.38 9.5 7 9.5Z"
        fill="#006A39"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M1 1H3L3.4 3M5 11H17L19 3H3.4M5 11L3.4 3M5 11L2.7 14.3C2.31 14.87 2.72 15.67 3.4 15.67H17M17 15.67C16.07 15.67 15.33 16.41 15.33 17.33C15.33 18.26 16.07 19 17 19C17.93 19 18.67 18.26 18.67 17.33C18.67 16.41 17.93 15.67 17 15.67ZM7.67 17.33C7.67 18.26 6.93 19 6 19C5.07 19 4.33 18.26 4.33 17.33C4.33 16.41 5.07 15.67 6 15.67C6.93 15.67 7.67 16.41 7.67 17.33Z"
        stroke="#006A39"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M10 10C12.2091 10 14 8.20914 14 6C14 3.79086 12.2091 2 10 2C7.79086 2 6 3.79086 6 6C6 8.20914 7.79086 10 10 10Z"
        stroke="#006A39"
        strokeWidth="1.5"
      />
      <path
        d="M2 18C2 14.6863 5.58172 12 10 12C14.4183 12 18 14.6863 18 18"
        stroke="#006A39"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const navLinks: { label: string; page: Page }[] = [
  { label: "Home", page: "home" },
  { label: "OTC & Wellness", page: "medicines" },
  { label: "Lab Tests", page: "lab-tests" },
  { label: "Consult", page: "consult" },
  { label: "Offers", page: "offers" },
];

const ROLE_COLORS: Record<string, string> = {
  retailer: "#006a39",
  customer: "#0369a1",
  admin: "#073b4c",
};

export default function NavBar({ activePage, onNavigate, user, onLogout, onProfile }: NavBarProps) {
  const [searchValue, setSearchValue] = useState("");

  return (
    <header
      className="sticky top-0 z-50 bg-white border-b border-[#bdcabc]"
      style={{ boxShadow: "0px 1px 1px rgba(0,0,0,0.05)" }}
    >
      <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center gap-4">
        {/* Logo */}
        <button
          onClick={() => onNavigate("home")}
          className="shrink-0 font-['Manrope',sans-serif] font-extrabold text-[#006a39] text-2xl leading-8 tracking-tight"
        >
          SubhOne
        </button>

        {/* Search */}
        <div className="flex-1 max-w-xl relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search for medicines, lab tests..."
            className="w-full bg-[#f8fafb] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#6d7a6f] border border-[#e2e8df] focus:outline-none focus:border-[#006a39] focus:ring-1 focus:ring-[#006a39] transition-colors"
          />
        </div>

        {/* Nav links - desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ label, page }) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`relative pb-0.5 text-sm font-bold tracking-[0.7px] transition-colors ${
                activePage === page
                  ? "text-[#006a39]"
                  : "text-[#3e4a3f] hover:text-[#006a39]"
              }`}
            >
              {label}
              {activePage === page && (
                <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-[#006a39] rounded-full" />
              )}
            </button>
          ))}
        </nav>

        {/* Trailing icons */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <button className="p-2 rounded-full hover:bg-[#f0f7f0] transition-colors relative">
            <LocationIcon />
          </button>
          <button className="p-2 rounded-full hover:bg-[#f0f7f0] transition-colors relative">
            <CartIcon />
            <span className="absolute top-1 right-1 bg-[#0f9d58] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
              2
            </span>
          </button>
          {user ? (
            <div className="flex items-center gap-2.5 pl-3 border-l border-[#e2e8df]">
              <button
                onClick={onProfile}
                className="flex items-center gap-2 group"
                title="View profile"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-['Manrope',sans-serif] font-bold text-sm text-white shrink-0 group-hover:ring-2 group-hover:ring-offset-1 transition-all"
                  style={{ backgroundColor: ROLE_COLORS[user.role] ?? "#073b4c" }}
                >
                  {user.name[0].toUpperCase()}
                </div>
                <div className="hidden lg:flex flex-col leading-none text-left">
                  <span className="text-xs font-bold text-[#073b4c] group-hover:underline">{user.name}</span>
                  <span className="text-[10px] text-[#9aa89b] capitalize mt-0.5">{user.role}</span>
                </div>
              </button>
              <button
                onClick={onLogout}
                className="ml-1 text-xs font-bold text-[#c0392b] hover:text-[#9a2e1e] transition-colors whitespace-nowrap"
              >
                Logout
              </button>
            </div>
          ) : (
            <button className="p-2 rounded-full hover:bg-[#f0f7f0] transition-colors">
              <AccountIcon />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
