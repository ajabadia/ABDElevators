import { BaseCheckpointSaver, Checkpoint, CheckpointMetadata, CheckpointTuple } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";
import { connectDB } from "./db";

/**
 * Implementación personalizada de persistencia para LangGraph usando MongoDB.
 * Asegura que los estados de los agentes sean auditables y recuperables.
 * Fulfills Phase 21.1 requirement.
 */
export class MongoDBSaver extends BaseCheckpointSaver {
    private collectionName: string = "agent_checkpoints";

    async getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
        const db = await connectDB();
        const collection = db.collection(this.collectionName);

        const thread_id = config.configurable?.thread_id;
        const checkpoint_id = config.configurable?.checkpoint_id;

        if (!thread_id) return undefined;

        const query: any = { thread_id };
        if (checkpoint_id) {
            query.checkpoint_id = checkpoint_id;
        }

        const result = await collection.findOne(query, { sort: { created_at: -1 } });

        if (!result) return undefined;

        return {
            config,
            checkpoint: result.checkpoint as Checkpoint,
            metadata: result.metadata as CheckpointMetadata,
            parentConfig: result.parent_config
        };
    }

    async *list(config: RunnableConfig, options?: any): AsyncGenerator<CheckpointTuple> {
        const db = await connectDB();
        const collection = db.collection(this.collectionName);

        const thread_id = config.configurable?.thread_id;
        if (!thread_id) return;

        const query: any = { thread_id };
        if (options?.before) {
            query.created_at = { $lt: options.before };
        }

        const cursor = collection.find(query).sort({ created_at: -1 }).limit(options?.limit || 100);

        for await (const r of cursor) {
            yield {
                config: { configurable: { thread_id: r.thread_id, checkpoint_id: r.checkpoint_id } },
                checkpoint: r.checkpoint as Checkpoint,
                metadata: r.metadata as CheckpointMetadata,
            };
        }
    }

    async put(config: RunnableConfig, checkpoint: Checkpoint, metadata: CheckpointMetadata): Promise<RunnableConfig> {
        const db = await connectDB();
        const collection = db.collection(this.collectionName);

        const thread_id = config.configurable?.thread_id;
        if (!thread_id) throw new Error("thread_id is required in config");

        const checkpoint_id = checkpoint.id;

        await collection.insertOne({
            thread_id,
            checkpoint_id,
            checkpoint,
            metadata,
            parent_config: config,
            created_at: new Date()
        });

        return { configurable: { thread_id, checkpoint_id } };
    }

    // Required by BaseCheckpointSaver but we can leave as no-op or simple impl
    async putWrites(config: RunnableConfig, writes: any[], taskId: string): Promise<void> {
        // En una implementación más avanzada, guardaríamos las escrituras pendientes.
        return;
    }

    async deleteThread(threadId: string): Promise<void> {
        const db = await connectDB();
        const collection = db.collection(this.collectionName);
        await collection.deleteMany({ thread_id: threadId });
    }
}
