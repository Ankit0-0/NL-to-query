import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import pinoHttp from "pino-http";
import queryRouter from "./modules/query/query.routes";
import { AppError } from "./lib/app-error";

const app = express();

app.use(express.json());

app.use(
  pinoHttp({
    transport:
      process.env.NODE_ENV === "development"
        ? {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "SYS:standard",
              ignore: "pid,hostname",
            },
          }
        : undefined,
  })
);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "db_demo",
  });
});

app.use("/api/v1/query", queryRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

app.use(
  (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
    req.log.error({ err }, "Unhandled error");

    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        status: "error",
        message: err.message,
      });
      return;
    }

    if (err instanceof Error) {
      res.status(400).json({
        status: "error",
        message: err.message,
      });
      return;
    }

    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
);

export default app;