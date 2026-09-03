import { useEffect, useRef } from "react";
import type { Page } from "../App";

export interface NavigationState {
  page: Page;
  category?: string;
  query?: string;
  modal?: string | null;
  timestamp: number;
}

/**
 * Parse current window.location into active page, category, and search query
 */
export function parseHashToState(): { page: Page; category: string; query: string } {
  const path = window.location.pathname.replace(/^\//, "");
  const searchParams = new URLSearchParams(window.location.search);
  const qFromUrl = searchParams.get("q");

  const hash = window.location.hash.replace(/^#/, "");
  const cleanHash = hash.split("-modal")[0];
  const [pagePart, queryPart] = cleanHash.split("?");

  const validPages: Page[] = [
    "home",
    "medicines",
    "category",
    "insurance",
    "vaccines",
    "lab-tests",
    "consult",
    "offers",
    "profile",
    "checkout",
    "search",
  ];

  let page: Page = "home";
  if (path === "search" || (qFromUrl && path !== "login")) {
    page = "search";
  } else if (validPages.includes(pagePart as Page)) {
    page = pagePart as Page;
  }

  const hashParams = new URLSearchParams(queryPart || "");
  const category = hashParams.get("cat") || "All";
  const query = hashParams.get("q") || qFromUrl || "";

  return { page, category, query };
}

/**
 * Push a new page state into window.history
 */
export function pushPageState(page: Page, category = "All", query = "") {
  let hash = `#${page}`;
  const params = new URLSearchParams();
  if (page === "search" && query) {
    params.set("q", query);
  } else if (category && category !== "All") {
    params.set("cat", category);
  }

  const paramStr = params.toString();
  if (paramStr) {
    hash += `?${paramStr}`;
  }

  const state: NavigationState = {
    page,
    category,
    query,
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
export function replacePageState(page: Page, category = "All", query = "") {
  let hash = `#${page}`;
  const params = new URLSearchParams();
  if (page === "search" && query) {
    params.set("q", query);
  } else if (category && category !== "All") {
    params.set("cat", category);
  }

  const paramStr = params.toString();
  if (paramStr) {
    hash += `?${paramStr}`;
  }

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
