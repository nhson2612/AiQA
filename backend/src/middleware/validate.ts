import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../services/logger.service';
import logger from '../services/logger.service';

/**
 * Generic validation middleware factory
 * Validates request against a Zod schema
 */
export const validateRequest = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate the request against the schema
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Transform Zod errors into our ValidationError format
                const errors: Record<string, string> = {};

                error.issues.forEach((err: any) => {
                    const path = err.path.join('.');
                    errors[path] = err.message;
                });

                logger.warn('Validation failed', {
                    errors,
                    path: req.path,
                    method: req.method,
                });

                next(new ValidationError(errors));
            } else {
                next(error);
            }
        }
    };
};
