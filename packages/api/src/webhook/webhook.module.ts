
import { Global, Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';

@Global() // Make it global so other modules can inject WebhookService to trigger events
@Module({
    controllers: [WebhookController],
    providers: [WebhookService],
    exports: [WebhookService],
})
export class WebhookModule { }
