import { createAuthenticationAdapter } from '@rainbow-me/rainbowkit';
import { SiweMessage } from 'siwe';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const authAdapter = createAuthenticationAdapter({
    getNonce: async () => {
        const response = await fetch(`${API_BASE_URL}/auth/nonce`);
        if (!response.ok) throw new Error('Failed to fetch nonce');
        const data = await response.json();
        localStorage.setItem('siweNonceToken', data.nonceToken);
        return data.nonce;
    },
    createMessage: ({ nonce, address, chainId }) => {
        return new SiweMessage({
            domain: window.location.host,
            address,
            statement: 'Sign in to EscrowKit',
            uri: window.location.origin,
            version: '1',
            chainId,
            nonce,
        });
    },
    verify: async ({ message, signature }) => {
        try {
            const nonceToken = localStorage.getItem('siweNonceToken');
            const verifyRes = await fetch(`${API_BASE_URL}/auth/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message.prepareMessage(), signature, nonceToken }),
            });
            if (verifyRes.ok) {
                const verifyData = await verifyRes.json();
                localStorage.setItem('authToken', verifyData.token);
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    },
    signOut: async () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('siweNonceToken');
    },
});
