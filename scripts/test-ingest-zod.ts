import { z } from 'zod';

const LocalIngestMetadataSchema = z.object({
    type: z.string().min(1),
    version: z.string().min(1),
    documentTypeId: z.string().optional(),
    scope: z.enum(['GLOBAL', 'INDUSTRY', 'TENANT']).default('TENANT'),
    industry: z.string().default('ELEVATORS'),
});

const testCases = [
    {
        name: "Valid Case",
        payload: {
            type: "Manual",
            version: "1.0",
            documentTypeId: "some-id",
            scope: "TENANT",
            industry: "ELEVATORS"
        }
    },
    {
        name: "Missing Type",
        payload: {
            type: null,
            version: "1.0",
            scope: "TENANT"
        }
    },
    {
        name: "Empty Type",
        payload: {
            type: "",
            version: "1.0",
            scope: "TENANT"
        }
    },
    {
        name: "Invalid Scope",
        payload: {
            type: "Manual",
            version: "1.0",
            scope: "INVALID"
        }
    },
    {
        name: "Missing Version",
        payload: {
            type: "Manual",
            version: null,
            scope: "TENANT"
        }
    },
    {
        name: "Empty Version",
        payload: {
            type: "Manual",
            version: "",
            scope: "TENANT"
        }
    }
];

testCases.forEach(tc => {
    try {
        console.log(`Testing: ${tc.name}`);
        LocalIngestMetadataSchema.parse(tc.payload);
        console.log("  ✅ Passed");
    } catch (e: any) {
        console.log(`  ❌ Failed: ${e.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ')}`);
    }
});
