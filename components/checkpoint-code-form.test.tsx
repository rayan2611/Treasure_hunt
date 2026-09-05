import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CheckpointCodeForm } from "./checkpoint-code-form";

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

async function enterAndSubmit(value: string) {
  fireEvent.change(screen.getByLabelText(/enter the 6-digit code/i), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: /submit code/i }));
}

const futureExpiry = new Date(Date.now() + 4 * 60 * 1000).toISOString();

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("CheckpointCodeForm", () => {
  it("shows the issued code and a countdown", () => {
    render(
      <CheckpointCodeForm issuedCode="042817" expiresAt={futureExpiry} onCorrect={vi.fn()} onExpired={vi.fn()} />
    );
    expect(screen.getByText("042817")).toBeInTheDocument();
    expect(screen.getByRole("timer")).toBeInTheDocument();
  });

  it("calls onCorrect with the advance-progress payload when the code is right", async () => {
    mockFetchOnce({ correct: true, code: "OK", currentQuestion: 5, questionsCompleted: 4, finished: false });
    const onCorrect = vi.fn();
    render(
      <CheckpointCodeForm issuedCode="042817" expiresAt={futureExpiry} onCorrect={onCorrect} onExpired={vi.fn()} />
    );

    await enterAndSubmit("042817");

    await waitFor(() =>
      expect(onCorrect).toHaveBeenCalledWith({ currentQuestion: 5, questionsCompleted: 4, finished: false })
    );
  });

  it("shows a WRONG_CODE message with shake styling, without calling onCorrect", async () => {
    mockFetchOnce({ correct: false, code: "WRONG_CODE" }, 400);
    const onCorrect = vi.fn();
    render(
      <CheckpointCodeForm issuedCode="042817" expiresAt={futureExpiry} onCorrect={onCorrect} onExpired={vi.fn()} />
    );

    await enterAndSubmit("111111");

    await waitFor(() => expect(screen.getByText(/isn't right/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/enter the 6-digit code/i)).toHaveClass("animate-shake");
    expect(onCorrect).not.toHaveBeenCalled();
  });

  it("calls onExpired when the server reports CODE_EXPIRED", async () => {
    mockFetchOnce({ correct: false, code: "CODE_EXPIRED" }, 410);
    const onExpired = vi.fn();
    render(
      <CheckpointCodeForm issuedCode="042817" expiresAt={futureExpiry} onCorrect={vi.fn()} onExpired={onExpired} />
    );

    await enterAndSubmit("111111");

    await waitFor(() => expect(onExpired).toHaveBeenCalled());
  });

  it("calls onExpired once the client-side countdown reaches zero", async () => {
    const onExpired = vi.fn();
    render(
      <CheckpointCodeForm
        issuedCode="042817"
        expiresAt={new Date(Date.now() - 1000).toISOString()}
        onCorrect={vi.fn()}
        onExpired={onExpired}
      />
    );

    await waitFor(() => expect(onExpired).toHaveBeenCalled());
  });

  it("renders a distinct RATE_LIMITED message, not treated as a wrong code", async () => {
    mockFetchOnce({ code: "RATE_LIMITED" }, 429);
    render(
      <CheckpointCodeForm issuedCode="042817" expiresAt={futureExpiry} onCorrect={vi.fn()} onExpired={vi.fn()} />
    );

    await enterAndSubmit("111111");

    await waitFor(() => expect(screen.getByText(/slow down/i)).toBeInTheDocument());
    expect(screen.queryByText(/isn't right/i)).not.toBeInTheDocument();
  });

  it("disables submit until 6 digits are entered", () => {
    render(
      <CheckpointCodeForm issuedCode="042817" expiresAt={futureExpiry} onCorrect={vi.fn()} onExpired={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: /submit code/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/enter the 6-digit code/i), { target: { value: "123" } });
    expect(screen.getByRole("button", { name: /submit code/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/enter the 6-digit code/i), { target: { value: "123456" } });
    expect(screen.getByRole("button", { name: /submit code/i })).not.toBeDisabled();
  });
});
