import { Request, Response, NextFunction } from "express";
import { naturalLanguageQueryRequestSchema } from "./query.schemas";
import { TranslatorService } from "../translator/translator.service";
import { DatasetService } from "../dataset/dataset.service";
import { ExecutorService } from "../executor/executor.service";

export class QueryController {
  static async handleQuery(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const startedAt = Date.now();

    try {
      const parsedBody = naturalLanguageQueryRequestSchema.parse(req.body);
      const { query } = parsedBody;

      req.log.info({ query }, "Received natural language query");

      const structuredQuery = await TranslatorService.translate(query);

      req.log.info({ structuredQuery }, "Translated structured query");

      const rows = DatasetService.getInvoices();
      const result = ExecutorService.execute(rows, structuredQuery);

      const durationMs = Date.now() - startedAt;

      req.log.info(
        {
          resultCount: result.length,
          durationMs,
        },
        "Query executed successfully"
      );

      res.status(200).json({
        status: "success",
        input: query,
        structuredQuery,
        resultCount: result.length,
        durationMs,
        rows: result,
      });
    } catch (error) {
      next(error);
    }
  }
}