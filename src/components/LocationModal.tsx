import React, { useState, useEffect } from "react";
import {
  UserLocation,
  DEFAULT_LOCATION,
  POPULAR_CITIES,
  detectBrowserLocation,
  saveLocation,
} from "../lib/location";
import { DbAddress, fetchUserAddresses } from "../lib/addresses";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: UserLocation;
  onLocationChange: (loc: UserLocation) => void;
  userId?: string;
}

export default function LocationModal({
  isOpen,
  onClose,
  currentLocation,
  onLocationChange,
  userId,
}: LocationModalProps) {
  const [detecting, setDetecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<DbAddress[]>([]);
  const [manualPincode, setManualPincode] = useState("");

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserAddresses(userId).then(setSavedAddresses);
    }
  }, [isOpen, userId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAutoDetect = async () => {
    setDetecting(true);
    setErrorMsg("");
    try {
      const loc = await detectBrowserLocation();
      onLocationChange(loc);
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.message || "Location access was denied. Please select your city or enter your pincode manually."
      );
    } finally {
      setDetecting(false);
    }
  };

  const handleSelectCity = (item: (typeof POPULAR_CITIES)[0]) => {
    const loc: UserLocation = {
      city: item.city,
      area: item.area,
      pincode: item.pincode,
      state: item.state,
      formattedAddress: `${item.area}, ${item.city} ${item.pincode}`,
      isAutoDetected: false,
      timestamp: Date.now(),
    };
    saveLocation(loc);
    onLocationChange(loc);
    onClose();
  };

  const handleSelectAddress = (addr: DbAddress) => {
    const loc: UserLocation = {
      city: addr.city,
      area: addr.line1,
      pincode: addr.pincode,
      state: addr.state,
      formattedAddress: `${addr.line1}, ${addr.city} ${addr.pincode}`,
      isAutoDetected: false,
      timestamp: Date.now(),
    };
    saveLocation(loc);
    onLocationChange(loc);
    onClose();
  };

  const handlePincodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = manualPincode.trim();
    if (!pin || pin.length < 6) {
      setErrorMsg("Please enter a valid 6-digit Indian Pincode.");
      return;
    }

    // Lookup matching popular city or create custom location
    const matched = POPULAR_CITIES.find((c) => c.pincode === pin);
    const loc: UserLocation = {
      city: matched ? matched.city : "Delivery Location",
      area: matched ? matched.area : `Pincode ${pin}`,
      pincode: pin,
      state: matched ? matched.state : "India",
      formattedAddress: matched
        ? `${matched.area}, ${matched.city} ${pin}`
        : `Area Pin ${pin}, India`,
      isAutoDetected: false,
      timestamp: Date.now(),
    };

    saveLocation(loc);
    onLocationChange(loc);
    onClose();
  };

  const filteredCities = POPULAR_CITIES.filter(
    (c) =>
      c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.pincode.includes(searchQuery)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 border border-[#e4ede2]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#e4ede2] flex items-center justify-between bg-[#f8fafb]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#e8f5ee] text-[#006a39] flex items-center justify-center shadow-xs">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div>
              <h2 className="font-['Manrope',sans-serif] font-extrabold text-[#073b4c] text-lg leading-tight">
                Select Delivery Location
              </h2>
              <p className="text-xs text-[#6d7a6f]">
                Order medicines & healthcare for fastest 30-min express delivery
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#e4ede2] flex items-center justify-center text-[#073b4c] hover:bg-[#f0f4f0] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M1 1L11 11M11 1L1 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5 max-h-[75vh] overflow-y-auto">
          {/* 1. Detect Exact GPS Location Button */}
          <button
            type="button"
            onClick={handleAutoDetect}
            disabled={detecting}
            className="w-full py-3.5 px-4 rounded-2xl bg-linear-to-r from-[#006a39] to-[#047857] text-white font-['Manrope',sans-serif] font-bold text-sm shadow-md hover:shadow-lg hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-75"
          >
            {detecting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Locating your exact address…</span>
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" fill="currentColor" />
                  <path
                    d="M12 2v3M12 19v3M2 12h3M19 12h3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>Detect Exact Current Location (GPS)</span>
              </>
            )}
          </button>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 2. Manual Pincode Input */}
          <form onSubmit={handlePincodeSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[#6d7a6f]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <input
                type="text"
                maxLength={6}
                value={manualPincode}
                onChange={(e) => setManualPincode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Enter 6-digit Pincode (e.g. 400050)"
                className="w-full pl-10 pr-4 py-2.5 bg-[#f0f4f0] border border-transparent rounded-xl text-xs sm:text-sm text-[#073b4c] placeholder:text-[#9aa89b] focus:bg-white focus:border-[#006a39] focus:outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={manualPincode.length < 6}
              className="px-5 py-2.5 bg-[#073b4c] text-white font-bold text-xs rounded-xl hover:bg-[#052b38] disabled:opacity-40 transition-colors cursor-pointer"
            >
              Apply
            </button>
          </form>

          {/* 3. Saved Addresses Section (if logged in and has saved addresses) */}
          {savedAddresses.length > 0 && (
            <div>
              <h3 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <span>🏠 Saved Addresses</span>
              </h3>
              <div className="flex flex-col gap-2">
                {savedAddresses.map((addr) => {
                  const isSelected =
                    currentLocation.pincode === addr.pincode &&
                    currentLocation.city.toLowerCase() === addr.city.toLowerCase();

                  return (
                    <div
                      key={addr.id}
                      onClick={() => handleSelectAddress(addr)}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "border-[#006a39] bg-[#f0fdf4]"
                          : "border-[#e4ede2] bg-white hover:border-[#bbf7d0]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#e8f5ee] text-[#006a39] flex items-center justify-center font-bold text-xs shrink-0">
                          {addr.label?.[0]?.toUpperCase() || "H"}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#073b4c]">{addr.label || "Home"}</p>
                          <p className="text-[11px] text-[#6d7a6f] line-clamp-1">
                            {addr.line1}, {addr.city} - {addr.pincode}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-xs font-bold text-[#006a39] bg-[#d1fae5] px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Popular Cities Quick Select */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-xs uppercase tracking-wider">
                🏙️ Popular Cities
              </h3>
              <span className="text-[10px] text-[#006a39] font-bold">30-min express available</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {filteredCities.map((item) => {
                const isSelected =
                  currentLocation.city.toLowerCase() === item.city.toLowerCase() &&
                  currentLocation.pincode === item.pincode;

                return (
                  <button
                    key={item.city}
                    type="button"
                    onClick={() => handleSelectCity(item)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#006a39] bg-[#f0fdf4] ring-1 ring-[#006a39]"
                        : "border-[#e4ede2] bg-[#f8fafb] hover:border-[#006a39] hover:bg-white"
                    }`}
                  >
                    <p className="text-xs font-bold text-[#073b4c] leading-tight truncate">
                      {item.city}
                    </p>
                    <p className="text-[10px] text-[#9aa89b] truncate">{item.area}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3.5 bg-[#f8fafb] border-t border-[#e4ede2] flex items-center justify-between text-[11px] text-[#6d7a6f]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
            <span>Currently delivering in <strong>{currentLocation.city}</strong></span>
          </span>
          <span className="font-bold text-[#006a39]">Pincode: {currentLocation.pincode}</span>
        </div>
      </div>
    </div>
  );
}
