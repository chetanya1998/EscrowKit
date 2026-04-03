import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const AUTH_TOKEN_STORAGE_KEY = "authToken";
export const SIWE_NONCE_STORAGE_KEY = "siweNonceToken";
export const AUTH_CHANGED_EVENT = "escrowkit-auth-changed";
export const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
export const API_BASE_URL = API_ORIGIN;

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenAddress(address: string | `0x${string}`): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getExplorerUrl(hash: string, isAddress = false): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_EXPLORER_URL || "https://sepolia.basescan.org";
  return isAddress ? `${baseUrl}/address/${hash}` : `${baseUrl}/tx/${hash}`;
}

export function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function setStoredAuthToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function clearStoredAuthToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(SIWE_NONCE_STORAGE_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export async function authFetch(
  input: string | URL | Request,
  init: RequestInit = {},
): Promise<Response> {
  const token = getStoredAuthToken();
  const headers = new Headers(init.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    clearStoredAuthToken();
  }

  return response;
}
