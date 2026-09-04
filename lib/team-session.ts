import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "treasure_team_session";

function secret() {
  const value = process.env.TEAM_SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("TEAM_SESSION_SECRET must be at least 32 characters.");
  }
  return new TextEncoder().encode(value);
}

export async function createTeamSession(payload: {
  teamId: string;
  sessionVersion: number;
}) {
  const token = await new SignJWT({
    teamId: payload.teamId,
    sessionVersion: payload.sessionVersion,
    role: "TEAM"
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12
  });
}

export async function clearTeamSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function readTeamSession() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    if (
      payload.role !== "TEAM" ||
      typeof payload.teamId !== "string" ||
      typeof payload.sessionVersion !== "number"
    ) {
      return null;
    }

    return {
      teamId: payload.teamId,
      sessionVersion: payload.sessionVersion
    };
  } catch {
    return null;
  }
}
