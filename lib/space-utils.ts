const SPACE_KEY_PATTERN = /^[a-z0-9-]{6,64}$/;
const SPACE_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function sanitizeSpaceKey(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return SPACE_KEY_PATTERN.test(normalized) ? normalized : null;
}

export function createSpaceKey(): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);

  let token = "space-";
  for (const byte of bytes) {
    token += SPACE_ALPHABET[byte % SPACE_ALPHABET.length];
  }

  return token;
}
