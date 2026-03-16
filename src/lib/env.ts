import { z } from 'zod';
import { AppError } from './errors';

const envSchema = z.object({
  // Infrastructure
  DATABASE_URL: z.string().url(),
  MONGODB_URI: z.string().url(),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string(),

  // Security
  ENCRYPTION_SECRET: z.string().min(32, "ENCRYPTION_SECRET must be at least 32 characters"),
  INTERNAL_API_SECRET: z.string().min(1),
  INTERNAL_API_BASE_URL: z.string().url().default('http://localhost:3000'),
  ALLOWED_HOSTS: z.string().default(''),
  NEXTAUTH_SECRET: z.string().min(16),
  
  // App Config
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  
  // API Keys / Third Party
  GEMINI_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv() {
  try {
    const parsed = envSchema.safeParse(process.env);
    
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const missingFields = Object.keys(errors);
      
      console.error('❌ Invalid environment variables:', errors);
      
      if (process.env.NODE_ENV === 'production') {
        throw new AppError(
          'INTERNAL_ERROR', 
          500, 
          `Security Hardening Breach: Missing or invalid environment variables: ${missingFields.join(', ')}`
        );
      }
    }
    
    return parsed.data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('INTERNAL_ERROR', 500, 'Environment validation failed');
  }
}

// Global singleton for validated env (lazy loaded)
let _env: Env | null = null;
export const getEnv = () => {
    if (!_env) _env = validateEnv() as Env;
    return _env;
};
