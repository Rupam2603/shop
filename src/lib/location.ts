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
  city: "Mumbai",
  area: "Bandra West",
  pincode: "400050",
  state: "Maharashtra",
  formattedAddress: "Bandra West, Mumbai 400050",
  isAutoDetected: false,
  timestamp: Date.now(),
};

export const POPULAR_CITIES = [
  { city: "Mumbai", state: "Maharashtra", pincode: "400050", area: "Bandra West" },
  { city: "New Delhi", state: "Delhi", pincode: "110001", area: "Connaught Place" },
  { city: "Kolkata", state: "West Bengal", pincode: "700091", area: "Salt Lake Sector V" },
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
 * Reverse geocode latitude and longitude to city, area, state, and pincode
 */
export async function reverseGeocode(lat: number, lng: number): Promise<UserLocation> {
  try {
    // OpenStreetMap Nominatim reverse geocoding API
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en",
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const area =
        addr.suburb ||
        addr.neighbourhood ||
        addr.residential ||
        addr.quarter ||
        addr.village ||
        addr.road ||
        "Central Area";

      const city =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.city_district ||
        addr.county ||
        "Mumbai";

      const state = addr.state || "India";
      const pincode = addr.postcode || (city.toLowerCase().includes("mumbai") ? "400050" : "110001");

      const formatted = `${area}, ${city} ${pincode}`.replace(/^,\s*/, "");

      const userLoc: UserLocation = {
        city,
        area,
        pincode,
        state,
        formattedAddress: formatted,
        lat,
        lng,
        isAutoDetected: true,
        timestamp: Date.now(),
      };

      saveLocation(userLoc);
      return userLoc;
    }
  } catch (err) {
    console.warn("Reverse geocode error:", err);
  }

  // Fallback if network blocked
  const fallback: UserLocation = {
    ...DEFAULT_LOCATION,
    lat,
    lng,
    isAutoDetected: true,
    timestamp: Date.now(),
  };
  saveLocation(fallback);
  return fallback;
}

/**
 * Trigger GPS browser location lookup and reverse geocoding
 */
export function detectBrowserLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          resolve(loc);
        } catch (e) {
          resolve({
            ...DEFAULT_LOCATION,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            isAutoDetected: true,
            timestamp: Date.now(),
          });
        }
      },
      (err) => {
        console.warn("Geolocation permission error or timeout:", err.message);
        reject(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  });
}
