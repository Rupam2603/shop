import React, { useState, useRef, useEffect } from "react";

export type ChatMessage = {
  id: string;
  from: "user" | "bot";
  text: string;
  time: string;
  actions?: Array<{ label: string; href?: string; actionKey?: string }>;
};

type QuickReply = {
  id: string;
  label: string;
  query: string;
};

const QUICK_REPLIES: QuickReply[] = [
  { id: "delivery", label: "⚡ Delivery Time & Charges", query: "delivery time & charges" },
  { id: "pincode", label: "📍 Pincodes Served", query: "which pincodes are served" },
  { id: "prescription", label: "💊 Prescription Policy", query: "do i need a prescription" },
  { id: "track", label: "📦 How to Track Order", query: "how to track order" },
  { id: "wholesale", label: "🏪 Retailer Wholesale", query: "wholesale & retailer pricing" },
  { id: "human", label: "📞 Human Support", query: "talk to human support" },
];

export function BotIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2v3" />
      <rect width="18" height="13" x="3" y="6" rx="4" />
      <circle cx="9" cy="12" r="1.5" fill="currentColor" />
      <circle cx="15" cy="12" r="1.5" fill="currentColor" />
      <path d="M10 15h4" />
      <path d="M2 13h1" />
      <path d="M21 13h1" />
    </svg>
  );
}

function nowTime() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function botReplyFor(query: string): { text: string; actions?: ChatMessage["actions"] } {
  const q = query.toLowerCase();

  if (q.includes("delivery") || q.includes("shipping") || q.includes("charge") || q.includes("fast")) {
    return {
      text:
        "🚀 **Fast & Reliable Delivery**:\n" +
        "• Express 30–45 minute delivery across Kolkata & Howrah metro.\n" +
        "• Standard delivery within 24 hours for other serviceable zones.\n" +
        "• Delivery is **FREE** for orders above ₹150, or wholesale orders for verified retailers.\n" +
        "• Live real-time temperature-monitored fleet dispatched from 14/B Central Avenue.",
    };
  }

  if (q.includes("pincode") || q.includes("area") || q.includes("service") || q.includes("location") || q.includes("kolkata") || q.includes("howrah")) {
    return {
      text:
        "📍 **Service Coverage**:\n" +
        "We serve major pincodes in West Bengal including **Kolkata (700001–700150)**, **Howrah (711101–711109)**, and surrounding medical hubs.\n\n" +
        "You can check your exact address anytime by tapping the **Location selector** at the top of your screen!",
    };
  }

  if (q.includes("prescription") || q.includes("rx") || q.includes("doctor")) {
    return {
      text:
        "💊 **Prescription Guidance**:\n" +
        "• OTC wellness products, vitamins, and healthcare devices require **no prescription**.\n" +
        "• Scheduled medicines marked with an **Rx badge** legally require a valid doctor's prescription.\n" +
        "• You can easily upload your prescription during Checkout or through WhatsApp support.",
      actions: [
        { label: "💬 Send Rx on WhatsApp", href: "https://wa.me/919876543210?text=Hi%20SubhOne,%20here%20is%20my%20prescription" },
      ],
    };
  }

  if (q.includes("track") || q.includes("order") || q.includes("status")) {
    return {
      text:
        "📦 **Live Order Tracking**:\n" +
        "You can track any active shipment in real time!\n" +
        "1. Click **Track Order** in the top navigation bar or menu.\n" +
        "2. Enter your Order ID (e.g. `ORD-XXXXXX`) or view your recent orders in your Profile.\n" +
        "3. See live vehicle dispatch, driver phone, and ETA.",
    };
  }

  if (q.includes("wholesale") || q.includes("retail") || q.includes("bulk") || q.includes("margin") || q.includes("b2b")) {
    return {
      text:
        "🏪 **SubhOne Wholesale for Pharmacies**:\n" +
        "• Up to 35% margin on genuine certified pharmaceuticals.\n" +
        "• Direct manufacturer sourcing with GST invoices.\n" +
        "• Register as a **Retailer** on our Sign Up screen to apply for verified wholesale access.",
    };
  }

  if (q.includes("return") || q.includes("refund") || q.includes("cancel") || q.includes("damage")) {
    return {
      text:
        "🔄 **Hassle-Free Returns & Refunds**:\n" +
        "• Unopened, sealed medicines can be returned within 48 hours of delivery.\n" +
        "• Instant refund initiation to your original payment method or UPI.\n" +
        "• Temperature-sensitive vaccines or opened items are non-returnable per pharma safety regulations.",
    };
  }

  if (q.includes("human") || q.includes("contact") || q.includes("support") || q.includes("phone") || q.includes("whatsapp") || q.includes("email") || q.includes("agent") || q.includes("person")) {
    return {
      text:
        "🤝 **Connect with SubhOne Support Desk (24/7)**:\n" +
        "Our pharmacists and care team are standing by to assist you:\n\n" +
        "• **Direct Phone**: +91 98765 43210\n" +
        "• **WhatsApp Care**: +91 98765 43210\n" +
        "• **Email**: support@subhone.com\n" +
        "• **Central Pharmacy**: 14/B Central Avenue, Kolkata",
      actions: [
        { label: "📞 Call +91 98765 43210", href: "tel:+919876543210" },
        { label: "💬 Chat on WhatsApp", href: "https://wa.me/919876543210?text=Hi%20SubhOne,%20I%20need%20help%20with%20my%20order" },
      ],
    };
  }

  // Default fallback
  return {
    text:
      "Hello! I am your SubhOne 24/7 Health Assistant. You can ask me anything about:\n" +
      "• ⚡ Delivery times & fees\n" +
      "• 📍 Serviceable pincodes\n" +
      "• 💊 Prescription requirements\n" +
      "• 📦 Live order tracking\n" +
      "• 🏪 Retailer wholesale access\n\n" +
      "Or type **'human support'** to reach our round-the-clock desk!",
    actions: [
      { label: "⚡ Delivery Times", actionKey: "delivery" },
      { label: "📍 Pincodes", actionKey: "pincode" },
      { label: "📞 Contact Team", actionKey: "human" },
    ],
  };
}

export default function SupportChatbot({ onTrackOrder }: { onTrackOrder?: () => void }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      from: "bot",
      text: "👋 Hi there! Welcome to SubhOne Health Group. How can I help you today? Ask me about orders, deliveries, prescriptions, or wholesale supplies.",
      time: nowTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleOpenChat = () => setOpen(true);
    window.addEventListener("subhone:open_support_chat", handleOpenChat);
    return () => window.removeEventListener("subhone:open_support_chat", handleOpenChat);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 150);
    }
  }, [open, messages, isTyping]);

  function addMessage(from: "user" | "bot", text: string, actions?: ChatMessage["actions"]) {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        from,
        text,
        time: nowTime(),
        actions,
      },
    ]);
  }

  function handleSend(textToSend?: string) {
    const query = (textToSend ?? input).trim();
    if (!query) return;

    addMessage("user", query);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const res = botReplyFor(query);
      addMessage("bot", res.text, res.actions);
    }, 450);
  }

  function handleQuickReply(qr: QuickReply) {
    handleSend(qr.query);
  }

  return (
    <div className="relative font-['Inter',sans-serif]">
      {/* ── Chat Window Overlay / Container ── */}
      {open && (
        <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-[1000] w-[calc(100vw-24px)] sm:w-96 bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl border border-[#d6e4d8] overflow-hidden flex flex-col max-h-[82vh] h-[520px] animate-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#006a39] to-[#047857] text-white px-4 py-3.5 flex items-center justify-between shadow-xs select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/15 flex items-center justify-center text-white border border-white/20">
                <BotIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-['Manrope',sans-serif] font-black text-xs sm:text-sm tracking-tight flex items-center gap-1.5">
                  SubhOne Support Bot
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <p className="text-[10px] text-emerald-100 font-medium">24/7 Live Customer Care</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
              title="Close chat window"
            >
              ✕
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#f8faf8]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.from === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-2xs ${
                    m.from === "user"
                      ? "bg-[#006a39] text-white rounded-br-xs"
                      : "bg-white text-[#073b4c] border border-[#e2ece0] rounded-bl-xs"
                  }`}
                >
                  <p className="whitespace-pre-line">{m.text}</p>

                  {/* Actions / Links */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-emerald-100/70">
                      {m.actions.map((act, i) =>
                        act.href ? (
                          <a
                            key={i}
                            href={act.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f0f7f2] hover:bg-[#e4efe6] text-[#006a39] font-bold text-[11px] border border-[#cfe1d2] transition-colors"
                          >
                            {act.label}
                          </a>
                        ) : (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              if (act.actionKey === "track" && onTrackOrder) {
                                onTrackOrder();
                              } else if (act.actionKey) {
                                handleSend(act.actionKey);
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f0f7f2] hover:bg-[#e4efe6] text-[#006a39] font-bold text-[11px] border border-[#cfe1d2] transition-colors cursor-pointer"
                          >
                            {act.label}
                          </button>
                        )
                      )}
                    </div>
                  )}

                  <span
                    className={`block text-[9px] mt-1.5 font-medium ${
                      m.from === "user" ? "text-white/70 text-right" : "text-[#7b8f7e]"
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-1.5 p-2 bg-white border border-[#e2ece0] rounded-2xl w-fit text-[#006a39] animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#006a39] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#006a39] animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#006a39] animate-bounce [animation-delay:0.3s]" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Carousel */}
          <div className="px-3 py-2 bg-white border-t border-[#edf2ee]">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr.id}
                  type="button"
                  onClick={() => handleQuickReply(qr)}
                  className="whitespace-nowrap px-2.5 py-1 rounded-full bg-[#f0f5f2] hover:bg-[#e2ede4] text-[#073b4c] text-[10px] font-bold border border-[#d6e4d8] transition-colors cursor-pointer shrink-0"
                >
                  {qr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input & Send Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-white border-t border-[#edf2ee] flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything or type a question..."
              className="flex-1 bg-[#f7faf8] border border-[#d6e4d8] rounded-xl px-3 py-2 text-xs text-[#073b4c] placeholder:text-[#9bb09f] focus:outline-none focus:border-[#006a39] focus:ring-2 focus:ring-emerald-500/10"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-3 py-2 rounded-xl bg-[#006a39] hover:bg-[#00522c] disabled:opacity-50 text-white font-bold text-xs transition-colors flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Send</span>
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
