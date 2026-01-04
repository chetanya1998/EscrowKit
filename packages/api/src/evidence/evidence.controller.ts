import { Controller, Post, Body } from '@nestjs/common';

@Controller('evidence')
export class EvidenceController {

    @Post()
    uploadEvidence(@Body() body: any) {
        // Stub implementation: In real app, handle file upload and return IPFS hash/URL
        // Here we just acknowledge the metadata
        console.log('Received evidence metadata:', body);
        return {
            success: true,
            hash: body.hash || "QmStubHash...",
            url: body.url || "http://localhost:3000/uploads/stub.pdf"
        };
    }
}
