import { z } from 'zod';

export const CreateWorkshopOrderSchema = z.object({
    description: z.string().min(10, "Description must be at least 10 characters long"),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
    metadata: z.record(z.any()).optional(),
});

export type CreateWorkshopOrderFragment = z.infer<typeof CreateWorkshopOrderSchema>;
