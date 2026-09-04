import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RegisterPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() })
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Register form validation", () => {
  it("shows an inline error for a malformed BITS ID instead of submitting", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "Nighthawks" } });
    fireEvent.change(screen.getByLabelText(/leader name/i), { target: { value: "Arya" } });
    fireEvent.change(screen.getByLabelText(/leader bits id/i), { target: { value: "NOTABITSID" } });
    fireEvent.change(screen.getByLabelText(/contact number/i), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByPlaceholderText(/member 2 name/i), { target: { value: "Bee" } });
    fireEvent.change(screen.getByPlaceholderText(/member 2 bits id/i), { target: { value: "2023A7PS0002P" } });
    fireEvent.change(screen.getByPlaceholderText(/member 3 name/i), { target: { value: "Cee" } });
    fireEvent.change(screen.getByPlaceholderText(/member 3 bits id/i), { target: { value: "2023A7PS0003P" } });

    fireEvent.click(screen.getByRole("button", { name: /register team/i }));

    expect(screen.getByText(/format should look like/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("requires at least 2 additional members (team size 3-5)", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "Nighthawks" } });
    fireEvent.change(screen.getByLabelText(/leader name/i), { target: { value: "Arya" } });
    fireEvent.change(screen.getByLabelText(/leader bits id/i), { target: { value: "2023A7PS1234P" } });
    fireEvent.change(screen.getByLabelText(/contact number/i), { target: { value: "9876543210" } });
    // Leave both member rows empty.

    fireEvent.click(screen.getByRole("button", { name: /register team/i }));

    expect(screen.getByText(/teams need 3-5 members/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("submits when all required fields are valid", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal("fetch", fetchSpy);

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "Nighthawks" } });
    fireEvent.change(screen.getByLabelText(/leader name/i), { target: { value: "Arya" } });
    fireEvent.change(screen.getByLabelText(/leader bits id/i), { target: { value: "2023A7PS1234P" } });
    fireEvent.change(screen.getByLabelText(/contact number/i), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByPlaceholderText(/member 2 name/i), { target: { value: "Bee" } });
    fireEvent.change(screen.getByPlaceholderText(/member 2 bits id/i), { target: { value: "2023A7PS0002P" } });
    fireEvent.change(screen.getByPlaceholderText(/member 3 name/i), { target: { value: "Cee" } });
    fireEvent.change(screen.getByPlaceholderText(/member 3 bits id/i), { target: { value: "2023A7PS0003P" } });

    fireEvent.click(screen.getByRole("button", { name: /register team/i }));

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/teams/register",
      expect.objectContaining({ method: "POST" })
    );
  });
});
