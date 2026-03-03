import { MongoSanitizer } from "@/lib/mongo-sanitizer";
import { logEvento } from "@/lib/logger";

describe("MongoSanitizer Unit Tests", () => {
    it("should remove forbidden operators like $where", async () => {
        const input = {
            name: "test",
            "$where": "this.age > 18"
        };

        const result = await MongoSanitizer.sanitizeQuery(input);

        expect(result).toHaveProperty("name", "test");
        expect(result).not.toHaveProperty("$where");
        expect(logEvento).toHaveBeenCalledWith(expect.objectContaining({
            action: "BLOCK_OPERATOR"
        }));
    });

    it("should escape special characters in strings", async () => {
        const input = {
            search: "user.*"
        };

        const result = await MongoSanitizer.sanitizeQuery(input);

        expect(result.search).toBe("user\\.\\*");
    });

    it("should sanitize nested objects and arrays", async () => {
        const input = {
            filters: [
                { email: "a@b.com" },
                { "$eval": "malicious" }
            ],
            nested: {
                operator: "$function"
            }
        };

        const result = await MongoSanitizer.sanitizeQuery(input);

        expect(result.filters).toHaveLength(2);
        expect(result.filters[1]).toEqual({});
        expect(result.nested).toEqual({});
    });

    it("should return empty object for null or non-object input", async () => {
        expect(await MongoSanitizer.sanitizeQuery(null)).toEqual({});
        expect(await MongoSanitizer.sanitizeQuery("string")).toEqual({});
    });
});
