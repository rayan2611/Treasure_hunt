import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventState } from "./event-state";

describe("EventState banners", () => {
  it("renders a distinct 'not started' banner for DRAFT/REGISTRATION (before)", () => {
    render(<EventState status="REGISTRATION" huntStartTime="2026-09-06T17:00:00+05:30" />);
    expect(screen.getByText(/HASN'T STARTED YET/i)).toBeInTheDocument();
    expect(screen.getByRole("timer")).toBeInTheDocument();
  });

  it("renders a distinct paused banner", () => {
    render(<EventState status="PAUSED" />);
    expect(screen.getByText(/TEMPORARILY PAUSED/i)).toBeInTheDocument();
  });

  it("renders a distinct ended banner with a leaderboard link", () => {
    render(<EventState status="ENDED" />);
    expect(screen.getByText(/HUNT HAS ENDED/i)).toBeInTheDocument();
    expect(screen.getByText(/View Leaderboard/i)).toBeInTheDocument();
  });

  it("tags the banner with the current status for styling/testing hooks", () => {
    render(<EventState status="PAUSED" />);
    expect(screen.getByTestId("event-state-banner")).toHaveAttribute("data-status", "PAUSED");
  });

  // LIVE is intentionally not one of this component's states: the hunt shell
  // (app/hunt/page.tsx) renders <QuestionCard> instead of <EventState> when
  // the event status is LIVE, so there is no "live" banner to assert on here.
});
