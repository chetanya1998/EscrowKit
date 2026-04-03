import { createAuthenticationAdapter } from "@rainbow-me/rainbowkit";
import { SiweMessage } from "siwe";
import {
  API_BASE_URL,
  SIWE_NONCE_STORAGE_KEY,
  clearStoredAuthToken,
  setStoredAuthToken,
} from "./utils";

const AUTH_BASE_URL = `${API_BASE_URL}/api/v1/auth`;

export const authAdapter = createAuthenticationAdapter({
  getNonce: async () => {
    const response = await fetch(`${AUTH_BASE_URL}/nonce`);
    if (!response.ok) throw new Error("Failed to fetch nonce");
    const data = await response.json();
    localStorage.setItem(SIWE_NONCE_STORAGE_KEY, data.nonceToken);
    return data.nonce;
  },
  createMessage: ({ nonce, address, chainId }) => {
    return new SiweMessage({
      domain: window.location.host,
      address,
      statement: "Sign in to EscrowKit",
      uri: window.location.origin,
      version: "1",
      chainId,
      nonce,
    });
  },
  verify: async ({ message, signature }) => {
    try {
      const nonceToken = localStorage.getItem(SIWE_NONCE_STORAGE_KEY);
      const verifyRes = await fetch(`${AUTH_BASE_URL}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.prepareMessage(),
          signature,
          nonceToken,
        }),
      });

      if (!verifyRes.ok) {
        clearStoredAuthToken();
        return false;
      }

      const verifyData = await verifyRes.json();
      setStoredAuthToken(verifyData.token);
      return true;
    } catch {
      clearStoredAuthToken();
      return false;
    }
  },
  signOut: async () => {
    clearStoredAuthToken();
  },
});
