import { CryptoAdapter } from "../../shared/types/adapters.types";

export const webCryptoAdapter: CryptoAdapter = {
  async sha256(input) {
    // Web Crypto (preferred)
    if (globalThis.crypto?.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);

      const hashBuffer = await crypto.subtle.digest("SHA-256", data);

      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }

    // Node fallback
    const { createHash } = await import("crypto");

    return createHash("sha256").update(input).digest("hex");
  },
};
