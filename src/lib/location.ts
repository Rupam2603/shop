export interface UserLocation {
  city: string;
  area: string;
  pincode: string;
  state: string;
  formattedAddress: string;
  lat?: number;
  lng?: number;
  isAutoDetected: boolean;
  timestamp: number;
}

const LOCATION_STORAGE_KEY = "subhone_user_location";

export const DEFAULT_LOCATION: UserLocation = {
  city: "Kolkata",
  area: "Central Avenue",
  pincode: "700012",
  state: "West Bengal",
  formattedAddress: "Central Avenue, Kolkata - 700012",
  isAutoDetected: false,
  timestamp: Date.now(),
};

export const POPULAR_CITIES = [
  { city: "Kolkata", state: "West Bengal", pincode: "700091", area: "Salt Lake Sector V" },
  { city: "Howrah", state: "West Bengal", pincode: "711101", area: "Shibpur" },
  { city: "Mumbai", state: "Maharashtra", pincode: "400050", area: "Bandra West" },
  { city: "New Delhi", state: "Delhi", pincode: "110001", area: "Connaught Place" },
  { city: "Bengaluru", state: "Karnataka", pincode: "560038", area: "Indiranagar" },
  { city: "Hyderabad", state: "Telangana", pincode: "500081", area: "HITEC City" },
  { city: "Chennai", state: "Tamil Nadu", pincode: "600028", area: "R.A. Puram" },
  { city: "Pune", state: "Maharashtra", pincode: "411004", area: "Shivajinagar" },
  { city: "Ahmedabad", state: "Gujarat", pincode: "380015", area: "Satellite" },
];

/**
 * Get stored location from localStorage or default
 */
export function getSavedLocation(): UserLocation {
  try {
    const saved = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.city) return parsed;
    }
  } catch (e) {
    console.warn("Could not parse saved location:", e);
  }
  return DEFAULT_LOCATION;
}

/**
 * Save user location to localStorage and dispatch custom event for instant UI sync
 */
export function saveLocation(loc: UserLocation): void {
  try {
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(loc));
    window.dispatchEvent(new CustomEvent("subhone:location_changed", { detail: loc }));
  } catch (e) {
    console.warn("Could not save location:", e);
  }
}

/**
 * Reverse geocode latitude and longitude to city, area, state, and pincode with India-specific normalization
 */
export async function reverseGeocode(lat: number, lng: number): Promise<UserLocation> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en",
        },
      }
    );

    if (!res.ok) {
      throw new Error("Reverse geocoding failed");
    }

    const data = await res.json();
    const addr = data.address || {};

    // Normalize city
    const rawCity =
      (addr.city ||
        addr.town ||
        addr.municipality ||
        addr.village ||
        addr.district ||
        addr.county ||
        addr.state_district ||
        "") as string;

    // Normalize area / suburb
    const rawArea =
      (addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.quarter ||
        addr.subdistrict ||
        addr.road ||
        "Local Area") as string;

    const rawState = (addr.state || "West Bengal") as string;
    let pincode = (addr.postcode || "").toString().trim();

    // If pincode missing or invalid, infer from known cities
    const cityLower = (rawCity + " " + rawArea).toLowerCase();
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      if (cityLower.includes("howrah")) {
        pincode = "711101";
      } else if (cityLower.includes("kolkata") || cityLower.includes("calcutta")) {
        pincode = "700001";
      } else if (cityLower.includes("mumbai") || cityLower.includes("bombay")) {
        pincode = "400001";
      } else if (cityLower.includes("delhi")) {
        pincode = "110001";
      } else if (cityLower.includes("bengaluru") || cityLower.includes("bangalore")) {
        pincode = "560001";
      } else if (cityLower.includes("hyderabad")) {
        pincode = "500001";
      } else if (cityLower.includes("chennai") || cityLower.includes("madras")) {
        pincode = "600001";
      } else if (cityLower.includes("pune")) {
        pincode = "411001";
      } else if (cityLower.includes("ahmedabad")) {
        pincode = "380001";
      } else {
        pincode = "";
      }
    }

    const city = rawCity || "Howrah";
    const area = rawArea || "Local Area";
    const state = rawState || "West Bengal";

    const formattedAddress = pincode
      ? `${area}, ${city} - ${pincode}`
      : `${area}, ${city}, ${state}`;

    const userLoc: UserLocation = {
      city,
      area,
      pincode: pincode || "",
      state,
      formattedAddress,
      lat,
      lng,
      isAutoDetected: true,
      timestamp: Date.now(),
    };

    saveLocation(userLoc);
    return userLoc;
  } catch (err) {
    console.warn("Reverse geocode error, using fallback", err);
    // Robust fallback location
    const fallback: UserLocation = {
      city: "Howrah",
      area: "Local Area",
      pincode: "711101",
      state: "West Bengal",
      formattedAddress: "Howrah, West Bengal - 711101",
      lat,
      lng,
      isAutoDetected: true,
      timestamp: Date.now(),
    };
    saveLocation(fallback);
    return fallback;
  }
}

/**
 * Trigger GPS browser location lookup and reverse geocoding
 */
export function detectBrowserLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          resolve(loc);
        } catch (e) {
          reject(e);
        }
      },
      (err) => {
        console.warn("Geolocation permission error or timeout:", err.message);
        reject(
          new Error("Location access denied or timed out. Please enter your pincode manually.")
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000,
      }
    );
  });
}
