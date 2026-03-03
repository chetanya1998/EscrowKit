import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenAddress(address: string | `0x${string}`): string {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function getExplorerUrl(hash: string, isAddress: boolean = false): string {
  const baseUrl = process.env.NEXT_PUBLIC_EXPLORER_URL || "https://rpc.odyssey.storyrpc.io"
  return isAddress ? `${baseUrl}/address/${hash}` : `${baseUrl}/tx/${hash}`
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
