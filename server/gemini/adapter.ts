import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/server/db/client';

// Standard 2026 Gemini 3.5 / 3.8 pricing:
// Input tokens: ~$0.075 / 1,000,000 tokens => ~0.000000075 USD => ~0.0000062 INR per token
// Output tokens: ~$0.30 / 1,000,000 tokens => ~0.0000003 USD => ~0.000025 INR per token
const INR_PER_INPUT_TOKEN = 0.0000062;
const INR_PER_OUTPUT_TOKEN = 0.000025;
const MAX_AI_BUDGET_INR = 8.0;

export interface GeminiCallParams {
  projectId: string;
  runId?: string;
  stage: string;
  prompt: string;
  systemInstruction?: string;
  responseSchema?: Record<string, any>;
  promptVersion?: string;
}

export interface GeminiCallResult<T = any> {
  success: boolean;
  data?: T;
  rawText?: string;
  inputTokens: number;
  outputTokens: number;
  costINR: number;
  model: string;
  durationMs: number;
  error?: string;
  fallbackUsed?: boolean;
}

export class GeminiAdapter {
  private static ai: GoogleGenAI | null = null;

  private static getClient(): GoogleGenAI {
    if (!this.ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
      }
      this.ai = new GoogleGenAI({ apiKey });
    }
    return this.ai;
  }

  /**
   * Executes a bounded structured generation call with strict cost logging and budget safety.
   */
  public static async generateBoundedContent<T = any>(
    params: GeminiCallParams,
    deterministicFallback?: () => T
  ): Promise<GeminiCallResult<T>> {
    const startTime = Date.now();
    const promptVersion = params.promptVersion || 'v2.1';

    // 1. Budget Guard: check existing cumulative cost for this generation run
    if (params.runId) {
      const existingLedger = await prisma.aiUsageLedger.aggregate({
        where: { runId: params.runId },
        _sum: { estimatedCostINR: true },
      });
      const currentCost = existingLedger._sum.estimatedCostINR || 0;
      if (currentCost >= MAX_AI_BUDGET_INR - 0.20) {
        console.warn(`[BudgetGuard] Current run cost (₹${currentCost.toFixed(2)}) is close to/exceeds ₹${MAX_AI_BUDGET_INR}. Triggering deterministic fallback.`);
        if (deterministicFallback) {
          const fallbackData = deterministicFallback();
          return {
            success: true,
            data: fallbackData,
            inputTokens: 0,
            outputTokens: 0,
            costINR: 0,
            model: 'deterministic_fallback',
            durationMs: Date.now() - startTime,
            fallbackUsed: true,
          };
        }
      }
    }

    const client = this.getClient();
    const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.8-flash'];

    for (const model of modelsToTry) {
      try {
        const config: Record<string, any> = {
          temperature: 0.3, // bounded creative copy
        };

        if (params.systemInstruction) {
          config.systemInstruction = params.systemInstruction;
        }

        if (params.responseSchema) {
          config.responseMimeType = 'application/json';
          config.responseSchema = params.responseSchema;
        }

        const response = await client.models.generateContent({
          model,
          contents: params.prompt,
          config,
        });

        const durationMs = Date.now() - startTime;
        const text = response.text || '';
        const usage = response.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 };
        const inputTokens = usage.promptTokenCount || 0;
        const outputTokens = usage.candidatesTokenCount || 0;

        const costINR = (inputTokens * INR_PER_INPUT_TOKEN) + (outputTokens * INR_PER_OUTPUT_TOKEN);

        // Record in database ledger
        await prisma.aiUsageLedger.create({
          data: {
            projectId: params.projectId,
            runId: params.runId || null,
            stage: params.stage,
            model,
            inputTokens,
            outputTokens,
            estimatedCostINR: costINR,
            durationMs,
            promptVersion,
          },
        });

        let parsedData: any = null;
        if (params.responseSchema || text.trim().startsWith('{') || text.trim().startsWith('[')) {
          try {
            parsedData = JSON.parse(text);
          } catch (e) {
            // Strip code fences if present
            const clean = text.replace(/```json\n?|\n?```/g, '').trim();
            parsedData = JSON.parse(clean);
          }
        }

        return {
          success: true,
          data: (parsedData || text) as T,
          rawText: text,
          inputTokens,
          outputTokens,
          costINR,
          model,
          durationMs,
          fallbackUsed: false,
        };
      } catch (err: any) {
        console.warn(`[GeminiAdapter] Attempt with ${model} failed:`, err.message || err);
        // Continue to next model candidate or fallback
      }
    }

    // If all models fail, trigger deterministic fallback if provided
    if (deterministicFallback) {
      console.warn('[GeminiAdapter] Models unavailable. Engaging deterministic fallback.');
      const fallbackData = deterministicFallback();
      return {
        success: true,
        data: fallbackData,
        inputTokens: 0,
        outputTokens: 0,
        costINR: 0,
        model: 'deterministic_fallback',
        durationMs: Date.now() - startTime,
        fallbackUsed: true,
      };
    }

    return {
      success: false,
      inputTokens: 0,
      outputTokens: 0,
      costINR: 0,
      model: 'none',
      durationMs: Date.now() - startTime,
      error: 'All Gemini model candidates failed and no fallback available.',
    };
  }
}
