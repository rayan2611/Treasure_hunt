// Shared validation constants/helpers for registration. Kept framework-agnostic
// so both the API route and the register form/tests can import the same source
// of truth.

// No format restriction on BITS ID by organizer request — teams may enter it
// however they like (roll number, ID card text, etc). Only presence matters.
export function isValidBitsId(value: string): boolean {
  return value.trim().length > 0;
}

// Leader + 1 to 4 additional members => team size 2-5 total.
export const MIN_ADDITIONAL_MEMBERS = 1;
export const MAX_ADDITIONAL_MEMBERS = 4;

export function isValidTeamSize(additionalMemberCount: number): boolean {
  return additionalMemberCount >= MIN_ADDITIONAL_MEMBERS && additionalMemberCount <= MAX_ADDITIONAL_MEMBERS;
}

// Teams choose their own 4-digit PIN at registration (not derived from the
// BITS ID) and log back in with team name / mobile number / BITS ID + PIN.
export const PIN_REGEX = /^\d{4}$/;

export function isValidPin(value: string): boolean {
  return PIN_REGEX.test(value.trim());
}
