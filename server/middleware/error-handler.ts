import type { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async route handler to catch errors and return standardized error response
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void | any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

/**
 * Global error handler middleware. Must be registered after all routes.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const status =
    (err instanceof Error && 'status' in err ? (err as { status?: number }).status : undefined) ||
    (err instanceof Error && 'statusCode' in err ? (err as { statusCode?: number }).statusCode : undefined) ||
    500;
  
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  
  console.error(err);
  res.status(status).json({ error: message });
}
