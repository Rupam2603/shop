import React, { useEffect, useState } from "react";
import { fetchAllUsers, updateUserAccountStatus, ManagedUser } from "../lib/users";

interface Props {
  currentUserId: string;
  isDeliveryPartner?: boolean;
}

export default function RetailerApprovalsManager({ currentUserId, isDeliveryPartner = false }: Props) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"pending" | "all" | "active" | "rejected">("pending");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const loadRetailers = async () => {
    setLoading(true);
    try {
      const all = await fetchAllUsers();
      // Filter to retailers only
      const retailers = all.filter((u) => u.role === "retailer");
      setUsers(retailers);
    } catch (err) {
      console.error("Error loading retailers for approval:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRetailers();
  }, []);

  const handleAction = async (userId: string, newStatus: "active" | "rejected") => {
    setActionInProgress(userId);
    try {
      const res = await updateUserAccountStatus(userId, newStatus, currentUserId);
      if (res.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
      } else {
        alert("Action failed: " + (res.error || "Please try again."));
      }
    } catch (err: any) {
      alert("Error: " + err?.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const displayedUsers = users.filter((u) => {
    if (filter === "all") return true;
    return u.status === filter;
  });

  const pendingCount = users.filter((u) => u.status === "pending").length;

  return (
    <div className="flex flex-col gap-5">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-[#073b4c] via-[#0b4d63] to-[#006a39] rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-['Manrope',sans-serif] font-black text-lg sm:text-xl">
              Retailer Account Verification
            </h3>
            {pendingCount > 0 && (
              <span className="bg-rose-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-white/80 text-xs sm:text-sm mt-1 max-w-xl">
            {isDeliveryPartner
              ? "Review and activate wholesale pharmacy retailer accounts on the ground during merchant visits."
              : "Review, approve, or reject registered wholesale retailer accounts requesting access."}
          </p>
        </div>

        <button
          onClick={loadRetailers}
          disabled={loading}
          className="self-start sm:self-center px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border border-white/20"
        >
          <span className={loading ? "animate-spin" : ""}>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(["pending", "all", "active", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
              filter === f
                ? "bg-[#006a39] text-white shadow-md shadow-emerald-950/20"
                : "bg-white text-[#073b4c] border border-[#dce7db] hover:bg-emerald-50"
            }`}
          >
            {f === "pending" ? `Pending (${pendingCount})` : f}
          </button>
        ))}
      </div>

      {/* Retailers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedUsers.map((u) => {
          const isPending = u.status === "pending";
          const isBusy = actionInProgress === u.id;

          return (
            <div
              key={u.id}
              className="bg-white rounded-3xl p-5 border border-[#dce7db] shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-800 flex items-center justify-center font-extrabold text-lg border border-emerald-200 shrink-0">
                    {(u.fullName?.[0] || "R").toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-['Manrope',sans-serif] font-bold text-sm sm:text-base text-[#073b4c]">
                        {u.fullName}
                      </h4>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          u.status === "active"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : u.status === "pending"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-rose-100 text-rose-800 border-rose-200"
                        }`}
                      >
                        {u.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#657969] font-mono">{u.email}</p>
                    {u.businessName && (
                      <p className="text-xs text-[#006a39] font-bold mt-1 flex items-center gap-1">
                        <span>🏬</span>
                        <span>{u.businessName}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-[#728575] border-t border-[#f0f4f0] pt-3 flex items-center justify-between">
                <span>Registered: {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                {u.approvedAt && <span className="text-emerald-700 font-semibold">Approved</span>}
              </div>

              {/* Action Buttons */}
              {isPending && (
                <div className="flex items-center gap-2 pt-1 border-t border-[#f0f4f0]">
                  <button
                    onClick={() => handleAction(u.id, "active")}
                    disabled={isBusy}
                    className="flex-1 py-2.5 rounded-xl bg-[#006a39] hover:bg-[#008749] active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-950/15 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <span>✓</span>
                    <span>Approve & Activate</span>
                  </button>

                  <button
                    onClick={() => handleAction(u.id, "rejected")}
                    disabled={isBusy}
                    className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 active:scale-95 font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {displayedUsers.length === 0 && (
          <div className="col-span-full py-16 text-center text-[#728575] bg-white/70 rounded-3xl border border-[#dce7db] flex flex-col items-center gap-2">
            <span className="text-3xl">📋</span>
            <p className="font-bold text-[#073b4c]">No retailers found with status "{filter}"</p>
            <p className="text-xs">All pending retailer applications are currently up to date.</p>
          </div>
        )}
      </div>
    </div>
  );
}
