import { z } from "zod";

/**
 * 🆔 OBJECTID SCHEMA
 * Strict validation for MongoDB ObjectIDs to prevent malformed ID errors 
 * and NoSQL injection attempts via illegal characters.
 */
export const ObjectIdSchema = z.string()
    .length(24, "ID must be exactly 24 characters")
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

/**
 * 📦 ENTITY ID SCHEMA (Generic)
 * For systems that might use UUID or ObjectId.
 */
export const EntityIdSchema = z.union([
    ObjectIdSchema,
    z.string().uuid("Invalid UUID format")
]);
