
---

## Global error classes for Murumiwa

Add typed errors to keep route logic clean and consistent.

```ts
// src/utils/errors.ts
export class AppError extends Error {
  status: number;
  code: string;
  details?: any;
  constructor(message: string, status = 500, code = "APP_ERROR", details?: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad Request", details?: any) {
    super(message, 400, "BAD_REQUEST", details);
  }
}
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", details?: any) {
    super(message, 401, "UNAUTHORIZED", details);
  }
}
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", details?: any) {
    super(message, 403, "FORBIDDEN", details);
  }
}
export class NotFoundError extends AppError {
  constructor(message = "Not Found", details?: any) {
    super(message, 404, "NOT_FOUND", details);
  }
}
export class ConflictError extends AppError {
  constructor(message = "Conflict", details?: any) {
    super(message, 409, "CONFLICT", details);
  }
}
