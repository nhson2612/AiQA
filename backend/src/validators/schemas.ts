import { z } from 'zod';

/**
 * Auth Schemas
 */
export const signupSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format').min(1, 'Email is required'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
    }),
});

export const signinSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format').min(1, 'Email is required'),
        password: z.string().min(1, 'Password is required'),
    }),
});

/**
 * Chat Schemas
 */
export const sendMessageSchema = z.object({
    body: z.object({
        input: z.string().min(1, 'Input message is required'),
        conversationId: z.string().optional(),
    }),
    query: z.object({
        stream: z.enum(['true', 'false']).optional(),
    }).optional(),
});

/**
 * PDF Schemas
 */
export const pdfIdParamSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid PDF ID format'),
    }),
});

/**
 * Library Schemas
 */
export const libraryMessageSchema = z.object({
    body: z.object({
        input: z.string().min(1, 'Input message is required'),
        conversationId: z.string().optional(),
    }),
    query: z.object({
        stream: z.enum(['true', 'false']).optional(),
    }).optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type PdfIdParam = z.infer<typeof pdfIdParamSchema>;
export type LibraryMessageInput = z.infer<typeof libraryMessageSchema>;
