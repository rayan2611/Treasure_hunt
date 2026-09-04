import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { usePolling } from "./use-polling";

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { value: state, configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
}

function Harness({ fetcher, intervalMs }: { fetcher: () => void; intervalMs: number }) {
  usePolling(fetcher, intervalMs);
  return null;
}

describe("usePolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility("visible");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches immediately and then on each interval while visible", () => {
    const fetcher = vi.fn();
    render(<Harness fetcher={fetcher} intervalMs={1000} />);

    expect(fetcher).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(3000);
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it("stops polling when the tab is backgrounded", () => {
    const fetcher = vi.fn();
    render(<Harness fetcher={fetcher} intervalMs={1000} />);
    expect(fetcher).toHaveBeenCalledTimes(1);

    setVisibility("hidden");
    vi.advanceTimersByTime(5000);

    // No additional calls once hidden.
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("resumes polling (with an immediate refresh) when the tab becomes visible again", () => {
    const fetcher = vi.fn();
    render(<Harness fetcher={fetcher} intervalMs={1000} />);
    expect(fetcher).toHaveBeenCalledTimes(1);

    setVisibility("hidden");
    vi.advanceTimersByTime(5000);
    expect(fetcher).toHaveBeenCalledTimes(1);

    setVisibility("visible");
    expect(fetcher).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(1000);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
});
