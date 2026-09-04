"use client";

import { useEffect, useRef } from "react";

/**
 * Shared polling hook (frontend spec section 20A). Calls `fetcher` immediately
 * and then every `intervalMs`, pausing while the tab is backgrounded (Page
 * Visibility API) and resuming with an immediate refresh when it becomes
 * visible again. Automatically cleans up on unmount.
 */
export function usePolling(fetcher: () => void | Promise<void>, intervalMs: number) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    function run() {
      if (!cancelled) void fetcherRef.current();
    }

    function start() {
      if (timer) return;
      run();
      timer = setInterval(run, intervalMs);
    }

    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        start();
      } else {
        stop();
      }
    }

    if (document.visibilityState === "visible") start();

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [intervalMs]);
}
