import { z } from "zod";

export const DATASET_NAME = "invoices";

export const invoiceFields = [
  "invoice_id",
  "customer",
  "amount",
  "status",
  "region",
  "date",
] as const;

export const filterOperators = [ // allowed operators for filtering
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "contains",
] as const;

export const sortDirections = ["asc", "desc"] as const;

export const invoiceStatusValues = ["paid", "unpaid", "overdue"] as const;

export type InvoiceField = (typeof invoiceFields)[number];
export type FilterOperator = (typeof filterOperators)[number];
export type SortDirection = (typeof sortDirections)[number];
export type InvoiceStatus = (typeof invoiceStatusValues)[number];

export const fieldEnum = z.enum(invoiceFields);
export const operatorEnum = z.enum(filterOperators);
export const sortDirectionEnum = z.enum(sortDirections);

const scalarValueSchema = z.union([z.string(), z.number()]);

export const filterSchema = z.object({
  field: fieldEnum,
  operator: operatorEnum,
  value: scalarValueSchema,
});

export const sortSchema = z.object({
  field: fieldEnum,
  direction: sortDirectionEnum,
});

export const structuredQuerySchema = z // the expected structure of the JSON output from the LLM
  .object({
    dataset: z.literal(DATASET_NAME),
    select: z.array(fieldEnum).min(1).max(invoiceFields.length).optional(),
    filters: z.array(filterSchema).max(10).optional(),
    sort: sortSchema.optional(),
    limit: z.number().int().positive().max(100).optional(),
  })
  .superRefine((query, ctx) => {
    const seen = new Set<string>();

    if (query.select) {
      for (const field of query.select) {
        if (seen.has(field)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["select"],
            message: `Duplicate select field: ${field}`,
          });
        }
        seen.add(field);
      }
    }

    for (const [index, filter] of (query.filters ?? []).entries()) { // additional validation for filters based on field types and operator rules
      const isNumericField = filter.field === "amount";
      const isTextField =
        filter.field === "invoice_id" ||
        filter.field === "customer" ||
        filter.field === "status" ||
        filter.field === "region" ||
        filter.field === "date";

      if (isNumericField && typeof filter.value !== "number") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["filters", index, "value"],
          message: `Field "${filter.field}" requires a numeric value`,
        });
      }

      if (filter.operator === "contains" && !isTextField) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["filters", index, "operator"],
          message: `"contains" is only allowed on text fields`,
        });
      }

      if (filter.operator === "contains" && typeof filter.value !== "string") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["filters", index, "value"],
          message: `"contains" requires a string value`,
        });
      }

      if (
        filter.field === "status" &&
        typeof filter.value === "string" &&
        !invoiceStatusValues.includes(filter.value as InvoiceStatus)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["filters", index, "value"],
          message: `Invalid status value: ${filter.value}`,
        });
      }
    }
  });

export const naturalLanguageQueryRequestSchema = z.object({
  query: z.string().min(1, "Query is required").max(500),
});

export type StructuredQuery = z.infer<typeof structuredQuerySchema>;
export type NaturalLanguageQueryRequest = z.infer<
  typeof naturalLanguageQueryRequestSchema
>;