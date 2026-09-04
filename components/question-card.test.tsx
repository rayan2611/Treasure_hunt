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

function mockFetchOnce(body: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body
    })
  );
}

async function answerAndSubmit(value: string) {
  fireEvent.change(screen.getByLabelText(/your answer/i), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: /submit answer/i }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("QuestionCard answer submission states", () => {
  it("shows the DEFAULT state initially with the submit button enabled once typed", () => {
    render(<QuestionCard question={question} onSolved={vi.fn()} />);
    expect(screen.getByRole("button", { name: /submit answer/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/your answer/i), { target: { value: "krishna" } });
    expect(screen.getByRole("button", { name: /submit answer/i })).not.toBeDisabled();
  });

  it("renders CORRECT state with gold-glow class and CLUE SOLVED copy", async () => {
    mockFetchOnce({ correct: true, code: "OK", currentQuestion: 5, questionsCompleted: 4, finished: false });
    const { container } = render(<QuestionCard question={question} onSolved={vi.fn()} />);

    await answerAndSubmit("krishna");

    await waitFor(() => expect(screen.getByText(/CLUE SOLVED/i)).toBeInTheDocument());
    expect(container.querySelector(".animate-gold-glow")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue to next clue/i })).toBeInTheDocument();
  });

  it("renders INCORRECT state with shake class and does not reveal the answer", async () => {
    mockFetchOnce({ correct: false, code: "WRONG_ANSWER" }, 400);
    render(<QuestionCard question={question} onSolved={vi.fn()} />);

    await answerAndSubmit("wrong-guess");

    await waitFor(() => expect(screen.getByText(/isn't the answer/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/your answer/i)).toHaveClass("animate-shake");
    expect(screen.queryByText(/wrong-guess/i)).not.toBeInTheDocument();
  });

  it("renders LOADING state: disables input/button while the request is in flight", async () => {
    let resolveFetch: (v: unknown) => void = () => {};
    vi.stubGlobal(
      "fetch",
      vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
      )
    );

    render(<QuestionCard question={question} onSolved={vi.fn()} />);
    await answerAndSubmit("krishna");

    expect(screen.getByRole("button", { name: /checking/i })).toBeDisabled();
    expect(screen.getByLabelText(/your answer/i)).toBeDisabled();

    resolveFetch({ ok: true, status: 200, json: async () => ({ correct: true, code: "OK", currentQuestion: 5, questionsCompleted: 4, finished: false }) });
  });

  it("renders a distinct RATE_LIMITED message, not treated as a wrong answer", async () => {
    mockFetchOnce({ code: "RATE_LIMITED" }, 429);
    render(<QuestionCard question={question} onSolved={vi.fn()} />);

    await answerAndSubmit("krishna");

    await waitFor(() => expect(screen.getByText(/slow down/i)).toBeInTheDocument());
    expect(screen.queryByText(/isn't the answer/i)).not.toBeInTheDocument();
  });
});
