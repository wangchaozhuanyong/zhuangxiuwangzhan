// This secret is injected only into the protected issuer runtime and the Edge
// Function. No GitHub job receives it; the site publish secret is separate.
export async function verifyManagedIssuerSecret(provided: string | null, expected: string | undefined) {
  if (!expected || expected.length < 32 || !provided) return false;
  const hash = async (value: string) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  const [left, right] = await Promise.all([hash(provided), hash(expected)]);
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}
