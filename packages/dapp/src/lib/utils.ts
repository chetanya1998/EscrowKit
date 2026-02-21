import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (isLocalhost ? 'http://localhost:3001' : 'https://api.escrowkit.com');

export function getExplorerUrl(address: string) {
    // Default to local anvil explorer or similar if no env var
    // For now, let's just point to etherscan sepolia as a placeholder or localhost if dev
    if (process.env.NODE_ENV === 'development') {
        return `https://etherscan.io/address/${address}`; // Fallback for now as local explorer isn't standard
    }
    return `https://sepolia.etherscan.io/address/${address}`;
}
