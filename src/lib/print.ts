import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * window.print() is blocked in installed/standalone PWA mode on iOS and
 * inconsistent on Android, since there is no browser chrome to host the
 * print sheet. Detect that case so callers can escape to a real browser tab.
 */
export function isStandalonePwa() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * Prints the current page, or — when running as a standalone PWA — opens
 * the same URL with `?print=1` in a real browser tab, where `useAutoPrint`
 * triggers the print dialog once the page has loaded.
 */
export function printOrOpenPrintTab() {
  if (isStandalonePwa()) {
    window.open(`${window.location.pathname}?print=1`, "_blank");
    return;
  }
  window.print();
}

/** Auto-triggers window.print() once when the page was opened with ?print=1. */
export function useAutoPrint(ready: boolean) {
  const [searchParams] = useSearchParams();
  const printed = useRef(false);

  useEffect(() => {
    if (!printed.current && ready && searchParams.get("print") === "1") {
      printed.current = true;
      window.print();
    }
  }, [ready, searchParams]);
}
