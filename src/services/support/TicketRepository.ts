import { ObjectId } from "mongodb";
import { getTenantCollection } from "@/lib/db-tenant";
import { Ticket } from "./schemas/TicketSchema";

/**
 * TicketRepository - Layer for direct MongoDB operations on tickets.
 * Rule #11: Multi-tenant Harmony via getTenantCollection.
 */
export class TicketRepository {
    private static readonly COLLECTION = "tickets";

    static async findById(id: string, tenantId: string): Promise<Ticket | null> {
        // tenantId isolation is handled by getTenantCollection wrapper filter
        const coll = await getTenantCollection<Ticket>(this.COLLECTION, { tenantId } as any);
        return await coll.findOne({ _id: new ObjectId(id) as any });
    }

    static async list(query: any, options: { sort?: any, limit?: number, skip?: number } = {}) {
        const coll = await getTenantCollection<Ticket>(this.COLLECTION);
        return await coll.find(query, {
            sort: options.sort || { updatedAt: -1 },
            limit: options.limit || 50,
            skip: options.skip || 0
        });
    }

    static async create(ticket: Ticket): Promise<string> {
        const coll = await getTenantCollection<Ticket>(this.COLLECTION);
        const result = await coll.insertOne(ticket as any);
        return result.insertedId.toString();
    }

    static async update(id: string, update: any): Promise<boolean> {
        const coll = await getTenantCollection<Ticket>(this.COLLECTION);
        const result = await coll.updateOne(
            { _id: new ObjectId(id) as any },
            update
        );
        return result.matchedCount > 0;
    }

    static async count(query: any): Promise<number> {
        const coll = await getTenantCollection<Ticket>(this.COLLECTION);
        return await coll.countDocuments(query);
    }
}
