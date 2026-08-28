import React, { useState, useEffect } from "react";
import { fetchUserAddresses, DbAddress } from "../lib/addresses";
import { createLabBooking, DbLabPackage, DbLabBooking } from "../lib/labTests";

interface Props {
  open: boolean;
  packageItem: DbLabPackage | null;
  onClose: () => void;
  onBookingSuccess: (booking: DbLabBooking) => void;
  user?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

const TIME_SLOTS = [
  "06:00 AM - 08:00 AM",
  "08:00 AM - 10:00 AM",
  "10:00 AM - 12:00 PM",
  "02:00 PM - 04:00 PM",
  "04:00 PM - 06:00 PM",
];

export default function LabBookingModal({
  open,
  packageItem,
  onClose,
  onBookingSuccess,
  user,
}: Props) {
  const [step, setStep] = useState<"details" | "schedule" | "address" | "success">("details");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<DbLabBooking | null>(null);

  // Patient Details
  const [patientName, setPatientName] = useState(user?.name || "");
  const [patientAge, setPatientAge] = useState("28");
  const [patientGender, setPatientGender] = useState("Male");
  const [patientPhone, setPatientPhone] = useState(user?.phone || "");
  const [fastingConfirmed, setFastingConfirmed] = useState(false);

  // Schedule
  const [collectionDate, setCollectionDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);

  // Addresses
  const [addresses, setAddresses] = useState<DbAddress[]>([]);
  const [selectedAddrId, setSelectedAddrId] = useState<string>("");
  const [customAddress, setCustomAddress] = useState({
    line1: "",
    line2: "",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "",
  });

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<"Cash on Sample Collection" | "Online (UPI / Card)">(
    "Cash on Sample Collection"
  );

  useEffect(() => {
    if (open) {
      setStep("details");
      setError(null);
      setConfirmedBooking(null);
      fetchUserAddresses().then((data) => {
        setAddresses(data);
        const def = data.find((a) => a.is_default) || data[0];
        if (def) setSelectedAddrId(def.id);
      });
    }
  }, [open]);

  if (!open || !packageItem) return null;

  const handleBook = async () => {
    setError(null);
    if (!patientName.trim()) {
      setError("Please enter the patient name");
      setStep("details");
      return;
    }
    if (!patientPhone.trim()) {
      setError("Please enter a valid contact phone number");
      setStep("details");
      return;
    }

    let finalAddress = customAddress;
    if (selectedAddrId && selectedAddrId !== "new") {
      const matched = addresses.find((a) => a.id === selectedAddrId);
      if (matched) {
        finalAddress = {
          line1: matched.line1,
          line2: matched.line2 || "",
          city: matched.city,
          state: matched.state,
          pincode: matched.pincode,
        };
      }
    }

    if (!finalAddress.line1.trim() || !finalAddress.pincode.trim()) {
      setError("Please provide a complete sample collection address");
      setStep("address");
      return;
    }

    setSubmitting(true);
    const res = await createLabBooking({
      package_id: packageItem.id,
      package_name: packageItem.name,
      patient_name: patientName.trim(),
      patient_age: parseInt(patientAge, 10) || 30,
      patient_gender: patientGender,
      patient_phone: patientPhone.trim(),
      collection_address: finalAddress,
      collection_date: collectionDate,
      collection_time_slot: timeSlot,
      fasting_confirmed: fastingConfirmed,
      total_amount: packageItem.price,
      payment_method: paymentMethod,
    });

    setSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else if (res.data) {
      setConfirmedBooking(res.data);
      setStep("success");
      onBookingSuccess(res.data);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-[#e4ede2]">
        {/* Header */}
        <div className="bg-[#eff6ec] p-5 sm:p-6 border-b border-[#e4ede2] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#006a39] text-white flex items-center justify-center font-bold shadow-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M9 3H6v6L2 15c-.83 1.39-.83 3.08 0 4.47C2.83 20.86 4.33 22 6 22h12c1.67 0 3.17-1.14 4-2.53.83-1.39.83-3.08 0-4.47L18 9V3h-3M9 3v6l-4 6h14L15 9V3M9 3h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#006a39] bg-[#d1fae5] px-2 py-0.5 rounded-full">Home Sample Collection</span>
              <h3 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-lg sm:text-xl leading-snug">{packageItem.name}</h3>
              <p className="text-xs text-[#6d7a6f] mt-0.5">₹{packageItem.price.toLocaleString()} · {packageItem.tests_count} Tests Included</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#9aa89b] hover:text-[#073b4c] p-1.5 rounded-xl hover:bg-white/80 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Step Indicator */}
        {step !== "success" && (
          <div className="flex items-center justify-around border-b border-[#f0f4f0] px-6 py-2.5 bg-[#fbfdfb] text-xs font-semibold">
            {[
              { id: "details", label: "1. Patient Info" },
              { id: "schedule", label: "2. Slot & Date" },
              { id: "address", label: "3. Address & Pay" },
            ].map((s) => (
              <span
                key={s.id}
                className={`transition-colors ${
                  step === s.id
                    ? "text-[#006a39] font-bold border-b-2 border-[#006a39] pb-1 -mb-[11px]"
                    : "text-[#9aa89b]"
                }`}
              >
                {s.label}
              </span>
            ))}
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-4 text-sm">
          {error && (
            <div className="bg-[#fee2e2] text-[#b91c1c] text-xs p-3 rounded-xl flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              {error}
            </div>
          )}

          {/* STEP 1: PATIENT DETAILS */}
          {step === "details" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-[#073b4c] block mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-[#f8fafb] border border-[#e4ede2] rounded-xl px-3.5 py-2.5 text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#073b4c] block mb-1">Age (Years) *</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    className="w-full bg-[#f8fafb] border border-[#e4ede2] rounded-xl px-3.5 py-2.5 text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#073b4c] block mb-1">Gender *</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="w-full bg-[#f8fafb] border border-[#e4ede2] rounded-xl px-3.5 py-2.5 text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#073b4c] block mb-1">Contact Phone Number *</label>
                <input
                  type="tel"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#f8fafb] border border-[#e4ede2] rounded-xl px-3.5 py-2.5 text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                />
              </div>

              {packageItem.fasting_required && (
                <div className="bg-[#fffbeb] border border-[#fef3c7] p-3.5 rounded-2xl flex items-start gap-2.5 mt-1">
                  <input
                    type="checkbox"
                    id="fastingCheck"
                    checked={fastingConfirmed}
                    onChange={(e) => setFastingConfirmed(e.target.checked)}
                    className="mt-0.5 rounded accent-[#006a39]"
                  />
                  <label htmlFor="fastingCheck" className="text-xs text-[#92400e] cursor-pointer leading-snug">
                    <strong className="block text-[#b45309]">Fasting of {packageItem.fasting_hours || 10} hours required</strong>
                    I confirm that the patient will maintain required overnight water-only fasting before morning sample collection.
                  </label>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SCHEDULE */}
          {step === "schedule" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-[#073b4c] block mb-1.5">Collection Date *</label>
                <input
                  type="date"
                  value={collectionDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setCollectionDate(e.target.value)}
                  className="w-full bg-[#f8fafb] border border-[#e4ede2] rounded-xl px-3.5 py-2.5 text-[#073b4c] focus:outline-none focus:border-[#006a39]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#073b4c] block mb-2">Preferred Morning Slot *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTimeSlot(slot)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                        timeSlot === slot
                          ? "border-[#006a39] bg-[#f0fdf4] text-[#006a39] shadow-xs"
                          : "border-[#e4ede2] bg-white text-[#3e4a3f] hover:border-[#bbf7d0]"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#f0f9ff] border border-[#e0f2fe] p-3.5 rounded-2xl text-xs text-[#0369a1] flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>A certified phlebotomist with temperature-controlled sample kits will arrive at your chosen slot.</span>
              </div>
            </div>
          )}

          {/* STEP 3: ADDRESS & PAYMENT */}
          {step === "address" && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-[#073b4c] block mb-1.5">Select Sample Collection Address</label>
                {addresses.length > 0 && (
                  <div className="flex flex-col gap-2 mb-3">
                    {addresses.map((a) => (
                      <label
                        key={a.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedAddrId === a.id ? "border-[#006a39] bg-[#f0fdf4]" : "border-[#e4ede2] bg-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="labAddress"
                          checked={selectedAddrId === a.id}
                          onChange={() => setSelectedAddrId(a.id)}
                          className="mt-0.5 accent-[#006a39]"
                        />
                        <div className="text-xs">
                          <span className="font-bold text-[#073b4c]">{a.label}</span> · {a.name} ({a.phone})
                          <p className="text-[#6d7a6f] mt-0.5">{a.line1}, {a.city} - {a.pincode}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedAddrId(selectedAddrId === "new" ? (addresses[0]?.id || "") : "new")}
                  className="text-xs font-bold text-[#006a39] hover:underline"
                >
                  {selectedAddrId === "new" ? "← Choose from saved addresses" : "+ Use a different address for this test"}
                </button>
              </div>

              {selectedAddrId === "new" && (
                <div className="bg-[#f8fafb] p-3.5 rounded-2xl border border-[#e4ede2] flex flex-col gap-2.5">
                  <input
                    type="text"
                    placeholder="House / Flat / Street Address *"
                    value={customAddress.line1}
                    onChange={(e) => setCustomAddress({ ...customAddress, line1: e.target.value })}
                    className="w-full bg-white border border-[#e4ede2] rounded-xl px-3 py-2 text-xs text-[#073b4c]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="City *"
                      value={customAddress.city}
                      onChange={(e) => setCustomAddress({ ...customAddress, city: e.target.value })}
                      className="w-full bg-white border border-[#e4ede2] rounded-xl px-3 py-2 text-xs text-[#073b4c]"
                    />
                    <input
                      type="text"
                      placeholder="Pincode *"
                      value={customAddress.pincode}
                      onChange={(e) => setCustomAddress({ ...customAddress, pincode: e.target.value })}
                      className="w-full bg-white border border-[#e4ede2] rounded-xl px-3 py-2 text-xs text-[#073b4c]"
                    />
                  </div>
                </div>
              )}

              {/* Payment selection */}
              <div>
                <label className="text-xs font-bold text-[#073b4c] block mb-1.5">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "Cash on Sample Collection", label: "Pay on Collection (Cash/UPI)" },
                    { id: "Online (UPI / Card)", label: "Pay Online Now" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPaymentMethod(p.id as typeof paymentMethod)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                        paymentMethod === p.id
                          ? "border-[#006a39] bg-[#f0fdf4] text-[#006a39] font-bold"
                          : "border-[#e4ede2] bg-white text-[#3e4a3f]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === "success" && confirmedBooking && (
            <div className="py-6 flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#dcfce7] text-[#15803d] flex items-center justify-center shadow-xs">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <h4 className="font-['Manrope',sans-serif] font-bold text-[#073b4c] text-xl">Booking Confirmed!</h4>
                <p className="text-[#006a39] font-mono font-bold text-sm mt-1">{confirmedBooking.booking_number}</p>
                <p className="text-xs text-[#6d7a6f] mt-1 max-w-sm">
                  Home collection scheduled for <strong>{confirmedBooking.patient_name}</strong> on{" "}
                  <strong>{confirmedBooking.collection_date}</strong> ({confirmedBooking.collection_time_slot}).
                </p>
              </div>

              <div className="w-full bg-[#f8fafb] border border-[#e4ede2] rounded-2xl p-4 text-left text-xs flex flex-col gap-1.5">
                <div className="flex justify-between">
                  <span className="text-[#9aa89b]">Package:</span>
                  <span className="font-bold text-[#073b4c]">{confirmedBooking.package_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9aa89b]">Total Payable:</span>
                  <span className="font-bold text-[#006a39]">₹{Number(confirmedBooking.total_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9aa89b]">Payment Mode:</span>
                  <span className="font-semibold text-[#073b4c]">{confirmedBooking.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9aa89b]">Reports Delivery:</span>
                  <span className="font-semibold text-[#073b4c]">{packageItem.report_turnaround}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full bg-[#006a39] text-white font-bold py-3 rounded-xl hover:bg-[#005a30] transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {step !== "success" && (
          <div className="p-4 sm:p-5 bg-[#f8fafb] border-t border-[#e4ede2] flex items-center justify-between gap-3">
            {step === "details" ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-[#e4ede2] text-xs font-bold text-[#6d7a6f] hover:bg-white transition-colors"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStep(step === "address" ? "schedule" : "details")}
                className="px-4 py-2.5 rounded-xl border border-[#e4ede2] text-xs font-bold text-[#6d7a6f] hover:bg-white transition-colors"
              >
                ← Back
              </button>
            )}

            {step !== "address" ? (
              <button
                type="button"
                onClick={() => {
                  if (!patientName.trim()) {
                    setError("Please enter the patient name");
                    return;
                  }
                  setError(null);
                  setStep(step === "details" ? "schedule" : "address");
                }}
                className="bg-[#006a39] text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-[#005a30] transition-colors"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBook}
                disabled={submitting}
                className="bg-[#006a39] text-white text-xs sm:text-sm font-bold px-7 py-2.5 rounded-xl hover:bg-[#005a30] transition-colors disabled:opacity-50"
              >
                {submitting ? "Booking Collection…" : `Confirm Booking (₹${packageItem.price.toLocaleString()})`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
