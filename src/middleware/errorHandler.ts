// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.status || 500;

  // Structured log
  console.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.originalUrl,
    status: statusCode,
  });

  // Consistent JSON response
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || "Internal Server Error",
      status: statusCode,
      path: req.originalUrl,
      method: req.method,
    },
  });
};
