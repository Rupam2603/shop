import React, { useEffect, useRef, useState } from "react";
import { fetchOrderDeliveryLocation, fetchAllOnDutyPartnerLocations, DeliveryLocationPing } from "../lib/deliveryLocation";

interface Props {
  orderId?: string;
  partnerId?: string;
  partnerName?: string;
  partnerPhone?: string;
  partnerAvatar?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  customerAddress?: string;
  mode?: "order" | "admin-all" | "self";
  allLocations?: DeliveryLocationPing[];
  height?: string;
}

// Dynamically loads leaflet from CDN if not already loaded in window
declare global {
  interface Window {
    L: any;
  }
}

export default function LiveDeliveryMap({
  orderId,
  partnerId,
  partnerName = "Delivery Partner",
  partnerPhone,
  partnerAvatar,
  vehicleType,
  vehicleNumber,
  customerAddress,
  mode = "order",
  allLocations,
  height = "380px",
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [currentLoc, setCurrentLoc] = useState<DeliveryLocationPing | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // 1. Ensure Leaflet JS is available
  useEffect(() => {
    let active = true;

    async function ensureLeaflet() {
      if (!window.L) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
          script.crossOrigin = "";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Leaflet JS"));
          document.head.appendChild(script);
        });
      }
      if (active) initMap();
    }

    ensureLeaflet().catch(console.error);

    return () => {
      active = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch { }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Initialize Leaflet Map
  const initMap = () => {
    if (!mapContainerRef.current || !window.L || mapInstanceRef.current) return;

    // Default center: Kolkata (or partner's current loc if available)
    const initialLat = currentLoc?.lat || 22.5726;
    const initialLng = currentLoc?.lng || 88.3639;

    const map = window.L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
    });

    window.L.control.zoom({ position: "bottomright" }).addTo(map);

    // High quality OpenStreetMap tiles
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    }).addTo(map);

    mapInstanceRef.current = map;
    setLoading(false);
  };

  // 3. Location Poll / Fetch
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      if (mode === "order" && orderId) {
        const loc = await fetchOrderDeliveryLocation(orderId);
        if (mounted && loc) {
          setCurrentLoc(loc);
          setLastUpdated(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        }
      }
    }

    loadData();

    // Poll every 8s for live location updates
    const timer = setInterval(loadData, 8000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [orderId, mode]);

  // 4. Update markers on the map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.L) return;

    // Clear previous markers
    markersRef.current.forEach((m) => {
      try {
        map.removeLayer(m);
      } catch { }
    });
    markersRef.current = [];

    const createDeliveryIcon = (avatar?: string, name?: string) => {
      return window.L.divIcon({
        className: "custom-delivery-pin",
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
            <div style="background: linear-gradient(135deg, #006a39 0%, #008749 100%); color: white; padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: 800; box-shadow: 0 4px 12px rgba(0,106,57,0.35); border: 2px solid white; white-space: nowrap; margin-bottom: 4px; display: flex; items-center; gap: 4px;">
              <span>🛵</span>
              <span>${name || "Partner"}</span>
            </div>
            <div style="width: 38px; height: 38px; border-radius: 50%; background: #006a39; border: 3px solid white; box-shadow: 0 6px 16px rgba(0,0,0,0.3); overflow: hidden; display: flex; align-items: center; justify-content: center;">
              ${avatar ? `<img src="${avatar}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<span style="color: white; font-size: 16px; font-weight: 900;">${(name?.[0] || "D").toUpperCase()}</span>`}
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #006a39; margin-top: -1px;"></div>
          </div>
        `,
        iconSize: [40, 60],
        iconAnchor: [20, 60],
      });
    };

    if (mode === "order" && currentLoc) {
      const marker = window.L.marker([currentLoc.lat, currentLoc.lng], {
        icon: createDeliveryIcon(currentLoc.avatarUrl || partnerAvatar, currentLoc.partnerName || partnerName),
      }).addTo(map);

      markersRef.current.push(marker);
      map.panTo([currentLoc.lat, currentLoc.lng]);
    } else if (mode === "admin-all" && allLocations && allLocations.length > 0) {
      const bounds = window.L.latLngBounds([]);
      allLocations.forEach((loc) => {
        const marker = window.L.marker([loc.lat, loc.lng], {
          icon: createDeliveryIcon(loc.avatarUrl, loc.partnerName),
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: 'Hanken Grotesk', sans-serif; min-width: 160px; padding: 4px;">
            <p style="font-weight: 800; color: #073b4c; margin: 0; font-size: 13px;">${loc.partnerName || "Delivery Partner"}</p>
            <p style="font-size: 11px; color: #657969; margin: 2px 0 6px 0;">${loc.partnerPhone || "No phone provided"}</p>
            <div style="display: flex; gap: 4px; font-size: 10px; font-weight: bold;">
              <span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px;">On Duty</span>
              ${loc.vehicleType ? `<span style="background: #f1f5f9; color: #334155; padding: 2px 6px; border-radius: 4px;">${loc.vehicleType}</span>` : ""}
            </div>
          </div>
        `);

        markersRef.current.push(marker);
        bounds.extend([loc.lat, loc.lng]);
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  }, [currentLoc, allLocations, mode, partnerAvatar, partnerName]);

  const effectivePhone = currentLoc?.partnerPhone || partnerPhone;
  const effectiveName = currentLoc?.partnerName || partnerName;
  const effectiveAvatar = currentLoc?.avatarUrl || partnerAvatar;
  const effectiveVehicle = currentLoc?.vehicleType || vehicleType || "Bike";
  const effectiveVehicleNum = currentLoc?.vehicleNumber || vehicleNumber;

  return (
    <div className="relative rounded-3xl overflow-hidden border border-[#dce7db] shadow-xl bg-white flex flex-col">
      {/* Top Banner: Reference Match: "Order is on the way / Arriving in 15-25 minutes" */}
      {mode === "order" && (
        <div className="bg-gradient-to-r from-[#006a39] via-[#008749] to-[#047857] text-white px-5 py-3.5 flex items-center justify-between shadow-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-lg shadow-xs animate-bounce">
              🛵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-['Manrope',sans-serif] font-black text-sm sm:text-base">Order is on the way</p>
                <span className="bg-white/25 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
                  Live GPS
                </span>
              </div>
              <p className="text-white/85 text-xs">Arriving in approx 15–25 mins</p>
            </div>
          </div>

          {lastUpdated && (
            <span className="text-[10px] text-white/70 font-mono hidden sm:inline-block">
              Updated: {lastUpdated}
            </span>
          )}
        </div>
      )}

      {/* Interactive Map Box */}
      <div className="relative w-full" style={{ height }}>
        <div ref={mapContainerRef} className="w-full h-full" />

        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center z-20">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-3 border-[#006a39] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-[#073b4c]">Connecting to live GPS map…</p>
            </div>
          </div>
        )}

        {!loading && mode === "order" && !currentLoc && (
          <div className="absolute top-3 left-3 right-3 sm:right-auto bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-[#e4ede2] z-[1000] text-xs text-[#073b4c] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Waiting for delivery partner's latest GPS ping…</span>
          </div>
        )}
      </div>

      {/* Driver Card (Reference image style matching user attachment): Driver Photo, Name, Vehicle & Call Button */}
      {mode === "order" && (
        <div className="p-4 sm:p-5 bg-white border-t border-[#e4ede2] flex items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            {effectiveAvatar ? (
              <img
                src={effectiveAvatar}
                alt={effectiveName}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-600 shadow-md shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#006a39] to-[#008749] text-white font-extrabold text-lg flex items-center justify-center shadow-md shrink-0 border border-white">
                {(effectiveName?.[0] || "D").toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-['Manrope',sans-serif] font-black text-sm sm:text-base text-[#073b4c] truncate">
                  {effectiveName}
                </h4>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  Verified Partner
                </span>
              </div>
              <p className="text-xs text-[#657969] truncate mt-0.5 flex items-center gap-1.5">
                <span>{effectiveVehicle}</span>
                {effectiveVehicleNum && (
                  <>
                    <span>•</span>
                    <span className="font-mono font-bold text-[#073b4c]">{effectiveVehicleNum}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {effectivePhone ? (
              <a
                href={`tel:${effectivePhone}`}
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/15 transition-all"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>Call Partner</span>
              </a>
            ) : (
              <button
                disabled
                className="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-400 font-bold text-xs sm:text-sm cursor-not-allowed"
              >
                Call Unavailable
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
