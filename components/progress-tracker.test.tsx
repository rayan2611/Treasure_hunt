import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressTracker } from "./progress-tracker";

describe("ProgressTracker", () => {
  it("renders the current completed/total count for a given question index", () => {
    render(<ProgressTracker completed={3} total={8} />);
    expect(screen.getByText("3/8")).toBeInTheDocument();
  });

  it("fills the bar proportionally to progress", () => {
    render(<ProgressTracker completed={4} total={8} />);
    const fill = screen.getByTestId("progress-fill");
    expect(fill.style.width).toBe("50%");
  });

  it("clamps to 100% when completed exceeds total", () => {
    render(<ProgressTracker completed={10} total={8} />);
    const fill = screen.getByTestId("progress-fill");
    expect(fill.style.width).toBe("100%");
  });
});
