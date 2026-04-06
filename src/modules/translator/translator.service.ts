import { InferenceClient } from "@huggingface/inference";
import { structuredQuerySchema } from "../query/query.schemas";
import { AppError } from "../../lib/app-error";

const hf = new InferenceClient(process.env.HF_TOKEN);

export class TranslatorService {
  static async translate(nlQuery: string) {
    try {
      const prompt = this.buildPrompt(nlQuery);

      const response = await hf.chatCompletion({
        model: "meta-llama/Meta-Llama-3-8B-Instruct",
        messages: [
          {
            role: "system",
            content:
              "You are a strict query translator. Output ONLY valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 300,
      });

      const raw = response.choices?.[0]?.message?.content ?? "";
      const json = this.extractJSON(raw);

      const parsed = structuredQuerySchema.safeParse(json); // checking if the output is valid according to our schema

      if (!parsed.success) {
        throw new AppError("Model returned an invalid structured query", 422);
      }

      return parsed.data;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("Failed to translate natural language query", 502);
    }
  }

  private static buildPrompt(nlQuery: string) { // instructions for the LLM
    return `
Convert the following natural language query into JSON.

Dataset: invoices

Fields:
invoice_id, customer, amount, status, region, date

Operators:
eq, neq, gt, gte, lt, lte, contains

Rules:
- Output ONLY valid JSON
- Do NOT include explanation
- Do NOT invent fields
- Use only allowed operators
- Use "contains" only for text
- amount is number
- status is one of: paid, unpaid, overdue
- limit max 100

Example:

User: Show unpaid invoices above 50000
Output:
{
  "dataset": "invoices",
  "select": ["invoice_id", "customer", "amount", "status"],
  "filters": [
    { "field": "status", "operator": "eq", "value": "unpaid" },
    { "field": "amount", "operator": "gt", "value": 50000 }
  ],
  "sort": { "field": "amount", "direction": "desc" },
  "limit": 10
}

User: ${nlQuery}
Output:
`;
  }

  private static extractJSON(text: string) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start === -1 || end === -1) {
      throw new AppError("No valid JSON found in model response", 422);
    }

    const jsonString = text.slice(start, end + 1);

    try {
      return JSON.parse(jsonString);
    } catch {
      throw new AppError("Failed to parse model JSON output", 422);
    }
  }
}
