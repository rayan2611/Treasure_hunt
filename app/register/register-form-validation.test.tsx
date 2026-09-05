import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RegisterPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() })
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// The component checks for an existing session (GET /api/team) on mount and
// only renders the form once that reports "not logged in".
function stubNoSession(extra?: (url: string) => Promise<any> | undefined) {
  const fetchSpy = vi.fn((url: string) => {
    if (url === "/api/team") return Promise.resolve({ ok: false });
    return extra?.(url) ?? Promise.resolve({ ok: false });
  });
  vi.stubGlobal("fetch", fetchSpy);
  return fetchSpy;
}

describe("Register form validation", () => {
  it("requires at least 1 additional member (team size 2-5)", async () => {
    const fetchSpy = stubNoSession();

    render(<RegisterPage />);
    await screen.findByLabelText(/team name/i);

    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "Nighthawks" } });
    fireEvent.change(screen.getByLabelText(/leader name/i), { target: { value: "Arya" } });
    fireEvent.change(screen.getByLabelText(/leader bits id/i), { target: { value: "any-id-they-like" } });
    fireEvent.change(screen.getByLabelText(/contact number/i), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByLabelText(/create a 4-digit pin/i), { target: { value: "4321" } });
    fireEvent.change(screen.getByLabelText(/confirm pin/i), { target: { value: "4321" } });
    // Leave the member row empty.

    fireEvent.click(screen.getByRole("button", { name: /register team/i }));

    expect(screen.getByText(/teams need 2-5 members/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalledWith("/api/teams/register", expect.anything());
  });

  it("submits when all required fields are valid, with no BITS ID format restriction", async () => {
    const fetchSpy = stubNoSession((url) =>
      url === "/api/teams/register" ? Promise.resolve({ ok: true, json: async () => ({ ok: true }) }) : undefined
    );

    render(<RegisterPage />);
    await screen.findByLabelText(/team name/i);

    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "Nighthawks" } });
    fireEvent.change(screen.getByLabelText(/leader name/i), { target: { value: "Arya" } });
    fireEvent.change(screen.getByLabelText(/leader bits id/i), { target: { value: "whatever id format" } });
    fireEvent.change(screen.getByLabelText(/contact number/i), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByLabelText(/create a 4-digit pin/i), { target: { value: "4321" } });
    fireEvent.change(screen.getByLabelText(/confirm pin/i), { target: { value: "4321" } });
    fireEvent.change(screen.getByPlaceholderText(/member 2 name/i), { target: { value: "Bee" } });
    fireEvent.change(screen.getByPlaceholderText(/member 2 bits id/i), { target: { value: "also whatever" } });

    fireEvent.click(screen.getByRole("button", { name: /register team/i }));

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/teams/register",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("requires the confirm-PIN field to match", async () => {
    const fetchSpy = stubNoSession();

    render(<RegisterPage />);
    await screen.findByLabelText(/team name/i);

    fireEvent.change(screen.getByLabelText(/team name/i), { target: { value: "Nighthawks" } });
    fireEvent.change(screen.getByLabelText(/leader name/i), { target: { value: "Arya" } });
    fireEvent.change(screen.getByLabelText(/leader bits id/i), { target: { value: "2023A7PS1234P" } });
    fireEvent.change(screen.getByLabelText(/contact number/i), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByLabelText(/create a 4-digit pin/i), { target: { value: "1111" } });
    fireEvent.change(screen.getByLabelText(/confirm pin/i), { target: { value: "2222" } });
    fireEvent.change(screen.getByPlaceholderText(/member 2 name/i), { target: { value: "Bee" } });
    fireEvent.change(screen.getByPlaceholderText(/member 2 bits id/i), { target: { value: "2023A7PS0002P" } });

    fireEvent.click(screen.getByRole("button", { name: /register team/i }));

    expect(screen.getByText(/pins don't match/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalledWith("/api/teams/register", expect.anything());
  });
});
