import { useEffect, useRef } from "react";
import type { Page } from "../App";

export interface NavigationState {
  page: Page;
  category?: string;
  modal?: string | null;
  timestamp: number;
}

/**
 * Parse current window.location.hash into active page and category
 */
export function parseHashToState(): { page: Page; category: string } {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return { page: "home", category: "All" };

  // Remove any modal suffix if present in hash
  const cleanHash = hash.split("-modal")[0];
  const [pagePart, queryPart] = cleanHash.split("?");
  const validPages: Page[] = ["home", "medicines", "lab-tests", "consult", "offers", "profile", "checkout"];
  const page = validPages.includes(pagePart as Page) ? (pagePart as Page) : "home";

  let category = "All";
  if (queryPart) {
    const params = new URLSearchParams(queryPart);
    category = params.get("cat") || "All";
  }

  return { page, category };
}

/**
 * Push a new page state into window.history
 */
export function pushPageState(page: Page, category = "All") {
  const hash = category && category !== "All"
    ? `#${page}?cat=${encodeURIComponent(category)}`
    : `#${page}`;

  const state: NavigationState = {
    page,
    category,
    modal: null,
    timestamp: Date.now(),
  };

  if (window.location.hash !== hash) {
    window.history.pushState(state, "", hash);
  }
}

/**
 * Replace the current history state with the base page state
 */
export function replacePageState(page: Page, category = "All") {
  const hash = category && category !== "All"
    ? `#${page}?cat=${encodeURIComponent(category)}`
    : `#${page}`;

  const state: NavigationState = {
    page,
    category,
    modal: null,
    timestamp: Date.now(),
  };

  window.history.replaceState(state, "", hash);
}

/**
 * Custom hook to trap mobile back-button for any open modal or drawer.
 * When `isOpen` is true:
 * 1. Pushes a modal state to window.history so mobile back closes the modal.
 * 2. Listens for popstate and triggers `onClose` if popped.
 * 3. If closed programmatically by user clicking X/backdrop, cleans up history via replaceState.
 */
export function useModalBackHandler(isOpen: boolean, onClose: () => void, modalId: string) {
  const isPushedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (isOpen) {
      isPushedRef.current = true;
      const currentHash = window.location.hash || "#home";
      const baseHash = currentHash.split("-modal")[0];
      const modalHash = `${baseHash}-modal-${modalId}`;

      if (window.location.hash !== modalHash) {
        window.history.pushState(
          { modal: modalId, originalHash: baseHash, timestamp: Date.now() },
          "",
          modalHash
        );
      }

      const handlePopState = (e: PopStateEvent) => {
        if (isPushedRef.current && e.state?.modal !== modalId) {
          isPushedRef.current = false;
          onCloseRef.current();
        }
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
        // If modal was closed programmatically, replace hash cleanly without dispatching unexpected popstate to sibling modals
        if (isPushedRef.current) {
          isPushedRef.current = false;
          const currentH = window.location.hash;
          if (currentH.includes(`-modal-${modalId}`)) {
            const clean = currentH.replace(`-modal-${modalId}`, "");
            window.history.replaceState(
              { modal: null, timestamp: Date.now() },
              "",
              clean || "#home"
            );
          }
        }
      };
    }
  }, [isOpen, modalId]);
}
