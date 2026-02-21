import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { HfInference } from '@huggingface/inference';

@Injectable()
export class AiService {
    private hf: HfInference;

    constructor() {
        // Initialize HuggingFace client
        const apiKey = process.env.HF_API_TOKEN;
        if (!apiKey) {
            console.warn("HF_API_TOKEN is not set. AI generation may fail if free tier limits are exceeded without auth.");
        }
        this.hf = new HfInference(apiKey);
    }

    async generateEscrowConfig(userPrompt?: string, templateType?: string) {
        if (!process.env.HF_API_TOKEN) {
            throw new InternalServerErrorException("HF_API_TOKEN environment variable is not configured on the server.");
        }

        let basePrompt = "";

        if (templateType === 'freelance') {
            basePrompt = `I need an escrow agreement for a freelance project.`;
        } else if (templateType === 'rental') {
            basePrompt = `I need an escrow agreement for a rental deposit.`;
        }

        const finalPrompt = userPrompt
            ? `${basePrompt ? basePrompt + ' Details: ' : ''}${userPrompt}`
            : basePrompt;

        if (!finalPrompt) {
            throw new BadRequestException("Must provide either a prompt or a predefinedTemplate.");
        }

        try {
            // Use Mistral-7B-Instruct-v0.2 as a reliable free-tier model on HF
            const generatedJson = await this.callHuggingFace(finalPrompt);

            // Post-process to inject live exchange rates if needed
            if (generatedJson.originalCurrency && generatedJson.targetTokenCurrency) {
                try {
                    const rate = await this.getExchangeRate(generatedJson.originalCurrency, generatedJson.targetTokenCurrency);
                    generatedJson.exchangeRateApplied = rate;

                    // Recalculate crypto amounts based on the live rate
                    generatedJson.totalAmountCrypto = Number((generatedJson.totalAmountOriginal * rate).toFixed(2));
                    for (const milestone of generatedJson.milestones) {
                        milestone.amountCrypto = Number((milestone.amountOriginal * rate).toFixed(2));
                    }
                } catch (e) {
                    console.warn("Failed to apply live exchange rate, falling back to LLM estimation", e);
                }
            }

            return generatedJson;
        } catch (error: any) {
            console.error("AI Generation Error:", error.message || error);
            throw new InternalServerErrorException("Failed to generate escrow configuration from AI.");
        }
    }

    private async callHuggingFace(prompt: string) {
        const systemPrompt = `You are an expert escrow configuration assistant. 
Your job is to parse the user's request and output a strictly valid JSON object representing the escrow terms. 
Do NOT wrap the JSON in markdown blocks like \`\`\`json. Just return the raw JSON string.

The JSON MUST have the following structure:
{
  "title": "Short descriptive title",
  "description": "Brief summary",
  "originalCurrency": "The currency mentioned, e.g., e-Rupaiya, INR, USDC, USD",
  "targetTokenCurrency": "If they mentioned e-Rupaiya or INR, target USDC. If USDC, target USDC.",
  "totalAmountOriginal": Total numerical amount in the original currency,
  "milestones": [
    {
      "description": "Milestone condition",
      "percentage": percentage as number (e.g. 50),
      "amountOriginal": numerical amount for this milestone
    }
  ]
}

Ensure the milestone percentages sum to 100.
Ensure the milestone amountOriginal sum to totalAmountOriginal.

User Request: "${prompt}"

Output exactly the JSON object, nothing else.`;

        const response = await this.hf.textGeneration({
            model: "mistralai/Mistral-7B-Instruct-v0.2",
            inputs: `<s>[INST] ${systemPrompt} [/INST]`,
            parameters: {
                max_new_tokens: 512,
                temperature: 0.1, // Low temp for more deterministic JSON
                return_full_text: false,
            }
        });

        const rawText = response.generated_text.trim();

        // Sometimes models still return markdown blocks despite instructions
        const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : rawText;

        try {
            return JSON.parse(jsonString);
        } catch (parseError) {
            console.error("Failed to parse JSON from AI:", jsonString);
            throw new Error("AI returned invalid JSON format.");
        }
    }

    async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
        // e-Rupaiya (e₹) is technically pegged 1:1 with INR.
        let from = fromCurrency.toUpperCase();
        let to = toCurrency.toUpperCase();

        if (from === 'E-RUPAIYA' || from === 'E₹') from = 'INR';
        if (to === 'E-RUPAIYA' || to === 'E₹') to = 'INR';

        if (from === to) return 1.0;

        try {
            // Using a free open API for demonstration (Frankfurter API, no key required for basic fiat)
            // Note: Frankfurter doesn't support USDC directly, we'll map USDC -> USD
            const finalFrom = from === 'USDC' || from === 'USDT' ? 'USD' : from;
            const finalTo = to === 'USDC' || to === 'USDT' ? 'USD' : to;

            if (finalFrom === finalTo) return 1.0;

            const response = await fetch(`https://api.frankfurter.app/latest?from=${finalFrom}&to=${finalTo}`);
            const data = await response.json();

            if (data && data.rates && data.rates[finalTo]) {
                return data.rates[finalTo];
            }
            throw new Error("Rate not found in API response");
        } catch (error) {
            console.error(`Failed to fetch exchange rate for ${from} to ${to}:`, error);
            // Fallback hardcoded rates for demonstration purposes if API fails or blocks
            if (from === 'INR' && (to === 'USD' || to === 'USDC')) return 0.012;
            if ((from === 'USD' || from === 'USDC') && to === 'INR') return 83.33;

            return 1.0;
        }
    }
}
