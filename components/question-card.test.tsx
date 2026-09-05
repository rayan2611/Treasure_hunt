import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QuestionCard } from "./question-card";
import type { CurrentQuestion } from "@/lib/types";

const question: CurrentQuestion = {
  questionId: "11111111-1111-1111-1111-111111111111",
  questionNumber: 4,
  title: "The moonlit courtyard",
  questionText: "When music calls where silence sleeps...",
  mediaUrl: null
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("QuestionCard idle/scan states", () => {
  it("shows location-guidance copy and a SCAN QR CODE button, with no free-text answer input", () => {
    render(<QuestionCard question={question} onSolved={vi.fn()} />);
    expect(screen.getByRole("button", { name: /scan qr code/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/your answer/i)).not.toBeInTheDocument();
  });

  it("shows a calm explanatory message when camera access is denied", async () => {
    vi.stubGlobal("navigator", {
      ...navigator,
      mediaDevices: {
        getUserMedia: vi.fn().mockRejectedValue(new Error("Permission denied"))
      }
    });

    render(<QuestionCard question={question} onSolved={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /scan qr code/i }));

    await waitFor(() => expect(screen.getByText(/camera access was blocked/i)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });
});
