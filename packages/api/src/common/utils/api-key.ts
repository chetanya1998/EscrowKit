import * as crypto from 'crypto';

export function hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
}

export function maskApiKey(prefix: string, lastFour: string): string {
    return `${prefix}...${lastFour}`;
}
