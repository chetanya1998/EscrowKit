
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@Injectable()
export class EvidenceService {
    private readonly uploadDir = path.join(process.cwd(), 'uploads');

    constructor() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    async storeFile(file: Express.Multer.File): Promise<{ hash: string; filename: string }> {
        // Mock IPFS: Calculate SHA256 of file content as "hash"
        const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');

        // Save file locally with hash as filename (or keep original name)
        const ext = path.extname(file.originalname);
        const filename = `${hash}${ext}`;
        const filePath = path.join(this.uploadDir, filename);

        fs.writeFileSync(filePath, file.buffer);

        return { hash, filename };
    }

    async getFile(hash: string): Promise<string | null> {
        // Find file with this hash prefix
        const files = fs.readdirSync(this.uploadDir);
        const match = files.find(f => f.startsWith(hash));
        if (match) {
            return path.join(this.uploadDir, match);
        }
        return null;
    }
}
