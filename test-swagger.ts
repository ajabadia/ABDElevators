import { z } from 'zod';
import { extendZodWithOpenApi, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

async function testSwagger() {
    try {
        console.log("Extending zod...");
        extendZodWithOpenApi(z);
        console.log("Success extending zod.");

        console.log("Loading schemas...");
        const schemas = await import('./src/lib/schemas');
        console.log("Schemas loaded!");

        const registry = new OpenAPIRegistry();
        registry.register('Entity', schemas.EntitySchema.openapi({
            description: 'Entidad técnica analizada',
        }));
        console.log("Registry successfully built.");
    } catch (e) {
        console.error("Swagger generation failed:", e);
    }
}
testSwagger();
