// Shared validation constants/helpers for registration (backend spec section 8,
// frontend spec section 12). Kept framework-agnostic so both the API route and
// the register form/tests can import the same source of truth.

export const BITS_ID_REGEX = /^202[0-9][A-Z]\d[A-Z]{2}\d{4}[A-Z]$/;
export const BITS_ID_EXAMPLE = "2023A7PS1234P";

export function isValidBitsId(value: string): boolean {
  return BITS_ID_REGEX.test(value.trim().toUpperCase());
}

// Leader + 2 to 4 additional members => team size 3-5 total.
export const MIN_ADDITIONAL_MEMBERS = 2;
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
